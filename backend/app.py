"""
POC: Chat interface where an LLM writes and executes its own SQL against a
local SQLite database, with guardrails around what it's allowed to run.

Run:
    python setup_db.py     # once, to create roofing.db
    python app.py
    open http://localhost:5000
"""
import os
import sqlite3
import json
from dotenv import load_dotenv
from flask_cors import CORS

import sqlglot
from sqlglot import exp
from flask import Flask, request, jsonify, render_template
from openai import OpenAI

load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

DB_PATH = os.path.join(os.path.dirname(__file__), "roofing.db")
MODEL = os.getenv("MODEL", "openai/gpt-4-turbo")
MAX_TOOL_ROUNDS = 4      # cap how many times the model can call the tool per turn
MAX_ROWS = 200           # hard cap on rows returned to the model / user
STATEMENT_TIMEOUT_S = 5  # sqlite busy timeout as a crude safety net

app = Flask(__name__)
CORS(app)
client = OpenAI(
    api_key=os.getenv("OPENROUTER_API_KEY"),
    base_url="https://openrouter.ai/api/v1",
)

SCHEMA_DESCRIPTION = """
You have READ-ONLY access to a SQLite database for a roofing contractor.
Only SELECT queries are permitted. Tables:

customers(id, name, email, phone, city, state)
supplies(id, name, category, company, unit_price, in_stock)
    -- category is one of: gutters, tiles, solar-tiles, shingles, underlayment
    -- company is the manufacturer/vendor the item comes from
orders(id, customer_id, order_date, status, notes)
    -- status is one of: pending, in_progress, completed, cancelled
order_items(id, order_id, supply_id, quantity)
    -- join table: an order can contain many supplies, each with a quantity

Relationships:
    orders.customer_id -> customers.id
    order_items.order_id -> orders.id
    order_items.supply_id -> supplies.id

When answering questions, write a single SELECT query and call execute_sql.
Look at the results, and if they don't fully answer the question, you may
call execute_sql again (e.g. to drill into a different table or fix a
mistake). Once you have what you need, answer the user in plain language.
Always mention concrete numbers/names from the query results, don't guess.

VISUALIZATION GUIDELINES:
When displaying query results, consider creating a visualization if appropriate:
- For tables with many rows: Return a JSON response with type "table" containing columns and rows
- For time-series or quantity data: Use "line_chart" (e.g., orders over time)
- For categorical comparisons: Use "bar_chart" (e.g., order counts by status, supplies by category)

Return visualizations as a JSON object with this format (wrapped in backticks):
```json
{
  "text": "Your plain text explanation here",
  "component": {
    "type": "table|bar_chart|line_chart",
    "title": "Optional chart title",
    "columns": ["col1", "col2"],  // for tables
    "rows": [{...}, {...}],        // for tables
    "data": [{...}, {...}],        // for charts
    "xKey": "field_name",          // for charts
    "yKey": "field_name"           // for charts
  }
}
```

Only use visualizations when they add value. For simple counts or text, just respond naturally.
""".strip()

TOOLS = [
    {
        "name": "execute_sql",
        "description": (
            "Execute a single read-only SQL SELECT query against the roofing "
            "contractor database and return the resulting rows as JSON. "
            "Only SELECT statements are allowed; no INSERT/UPDATE/DELETE/DDL."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "A single SQL SELECT statement.",
                }
            },
            "required": ["query"],
        },
    }
]


# ---------------------------------------------------------------------------
# Guardrails
# ---------------------------------------------------------------------------

class UnsafeQueryError(Exception):
    pass


def validate_select_only(query: str) -> str:
    """
    Parse the query and reject anything that isn't exactly one SELECT
    statement. Raises UnsafeQueryError with a human-readable reason on
    rejection. Returns the (possibly LIMIT-adjusted) query on success.
    """
    # Reject stacked statements up front (sqlglot.parse splits on ';')
    statements = [s for s in sqlglot.parse(query, read="sqlite") if s is not None]
    if len(statements) != 1:
        raise UnsafeQueryError("Only a single SQL statement is allowed per call.")

    parsed = statements[0]

    if not isinstance(parsed, exp.Select):
        raise UnsafeQueryError(
            f"Only SELECT statements are allowed (got {parsed.key.upper()})."
        )

    # Belt-and-suspenders: make sure no mutating keywords appear anywhere in
    # the parsed tree (covers things like SELECT ... INTO, subqueries, etc.)
    forbidden = (
        exp.Insert, exp.Update, exp.Delete, exp.Drop, exp.Create,
        exp.Alter, exp.TruncateTable,
    )
    for node in parsed.walk():
        n = node[0] if isinstance(node, tuple) else node
        if isinstance(n, forbidden):
            raise UnsafeQueryError("Query contains a forbidden write/DDL operation.")

    # Inject a LIMIT if the model didn't include one, so a broad query can't
    # dump the whole table.
    if parsed.args.get("limit") is None:
        parsed = parsed.limit(MAX_ROWS)

    return parsed.sql(dialect="sqlite")


def run_query(query: str):
    """Validate then execute against a read-only SQLite connection."""
    safe_query = validate_select_only(query)

    # Open strictly read-only via URI so even a validation bypass can't write.
    uri = f"file:{DB_PATH}?mode=ro"
    conn = sqlite3.connect(uri, uri=True, timeout=STATEMENT_TIMEOUT_S)
    conn.row_factory = sqlite3.Row
    try:
        cur = conn.execute(safe_query)
        rows = [dict(r) for r in cur.fetchmany(MAX_ROWS)]
    finally:
        conn.close()

    return safe_query, rows


# ---------------------------------------------------------------------------
# Chat endpoint
# ---------------------------------------------------------------------------

@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/chat", methods=["POST"])
def chat():
    body = request.get_json(force=True)
    history = body.get("messages", [])  # [{role, content}, ...] from the client

    messages = [{"role": "system", "content": SCHEMA_DESCRIPTION}] + list(history)
    executed_queries = []  # collected for display in the UI, per turn

    for _ in range(MAX_TOOL_ROUNDS):
        response = client.chat.completions.create(
            model=MODEL,
            max_tokens=1024,
            tools=[{"type": "function", "function": tool} for tool in TOOLS],
            messages=messages,
        )

        finish_reason = response.choices[0].finish_reason
        if finish_reason != "tool_calls":
            final_text = response.choices[0].message.content or ""
            return jsonify({"reply": final_text, "queries": executed_queries})

        # Model wants to call execute_sql — append its turn, then handle each
        # tool call block and feed results back.
        messages.append({"role": "assistant", "content": response.choices[0].message.content, "tool_calls": response.choices[0].message.tool_calls})

        tool_results = []
        for tool_call in response.choices[0].message.tool_calls or []:
            arguments = json.loads(tool_call.function.arguments)
            query = arguments.get("query", "")
            try:
                safe_query, rows = run_query(query)
                executed_queries.append({"query": safe_query, "row_count": len(rows)})
                result_payload = {"rows": rows, "row_count": len(rows)}
                tool_results.append(
                    {
                        "type": "tool_result",
                        "tool_call_id": tool_call.id,
                        "content": json.dumps(result_payload),
                    }
                )
            except UnsafeQueryError as e:
                tool_results.append(
                    {
                        "type": "tool_result",
                        "tool_call_id": tool_call.id,
                        "content": json.dumps({"error": str(e)}),
                    }
                )
            except sqlite3.Error as e:
                tool_results.append(
                    {
                        "type": "tool_result",
                        "tool_call_id": tool_call.id,
                        "content": json.dumps({"error": f"SQL error: {e}"}),
                    }
                )

        messages.append({"role": "user", "content": tool_results})

    return jsonify(
        {
            "reply": "I made too many query attempts without reaching an answer. "
                      "Try rephrasing your question.",
            "queries": executed_queries,
        }
    )


if __name__ == "__main__":
    if not os.path.exists(DB_PATH):
        print("roofing.db not found — run `python setup_db.py` first.")
    app.run(debug=True, port=5000)
