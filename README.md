# SQL Chat POC

A full-stack application where an LLM generates and executes SQL queries against a SQLite database, with automatic React-based visualizations of results.

**Frontend**: React + TypeScript + Vercel AI SDK + Recharts  
**Backend**: Flask + Python + OpenAI/OpenRouter SDK

## Architecture

```
sql-chat-poc/
├── frontend/          # React TypeScript chat interface
│   ├── src/
│   │   ├── components/
│   │   │   ├── Chat.tsx          # Main chat component with Vercel AI SDK
│   │   │   ├── DataTable.tsx     # Table visualization
│   │   │   ├── BarChart.tsx      # Bar chart visualization
│   │   │   └── LineChart.tsx     # Line chart visualization
│   │   └── App.tsx
│   └── package.json
├── backend/           # Flask API server
│   ├── app.py         # Main Flask app with LLM integration
│   ├── setup_db.py    # Database initialization
│   ├── templates/     # HTML templates
│   ├── roofing.db     # SQLite database
│   └── requirements.txt
└── .env              # Configuration (OpenRouter API key & model)
```

## Quick Start

### Prerequisites

- Python 3.13+
- Node.js 18+
- OpenRouter API key (get free at https://openrouter.ai)

### 1. Environment Setup

```bash
# In project root
cp .env.example .env
# Edit .env and add:
# OPENROUTER_API_KEY=sk-or-v1-...
# MODEL=openai/gpt-4-turbo
```

### 2. Backend Setup

```bash
cd backend
python -m venv .venv
source .venv/bin/activate    # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python setup_db.py            # Initialize database (one time)
python app.py                 # Runs on http://localhost:5000
```

### 3. Frontend Setup (new terminal)

```bash
cd frontend
npm install
npm start                     # Runs on http://localhost:3000
```

### 4. Open in Browser

Visit `http://localhost:3000` and start asking questions about the database!

## How It Works

1. **User Query**: Type a question in the chat interface (e.g., "How many orders are pending?")

2. **LLM Processing**: Backend sends the query to OpenRouter with:
   - Database schema context
   - Available execute_sql tool definition
   - Instructions for generating visualizations

3. **SQL Generation**: LLM generates a SQL query and calls the execute_sql tool

4. **Safe Execution**: Backend:
   - Validates the query is SELECT-only
   - Checks for injection attempts using AST analysis (sqlglot)
   - Executes against read-only database
   - Returns results to LLM

5. **Visualization**: LLM interprets results and optionally suggests a visualization (table/chart)

6. **Rendering**: Frontend receives the response and renders:
   - Plain text explanation
   - Data table, bar chart, or line chart (if visualization was suggested)

## Database Schema

Example roofing contractor database:

**customers** - Customer info
```
id, name, email, phone, city, state
```

**supplies** - Inventory
```
id, name, category, company, unit_price, in_stock
```

**orders** - Order records
```
id, customer_id, order_date, status, notes
```

**order_items** - Order details
```
id, order_id, supply_id, quantity
```

## Configuration

### Models

Any OpenRouter model works. Popular choices:

```env
MODEL=openai/gpt-4-turbo              # Most capable
MODEL=anthropic/claude-3-opus         # Good all-rounder
MODEL=openai/gpt-3.5-turbo            # Fast & cheap
MODEL=meta-llama/llama-2-70b-chat     # Open source
```

See https://openrouter.ai/models for full list.

### Ports

- Backend: `http://localhost:5000`
- Frontend: `http://localhost:3000`

To change ports, update:
- **Backend**: Last line of `backend/app.py` → `app.run(port=XXXX)`
- **Frontend**: `frontend/.env` → `REACT_APP_API_URL=http://localhost:XXXX`

## Safety Features

✓ **SELECT-only enforcement** - Parsed and validated with sqlglot  
✓ **Read-only database** - Opened with SQLite `mode=ro` URI  
✓ **Injection prevention** - AST analysis blocks dangerous operations  
✓ **Result limiting** - Auto-injects LIMIT if missing  
✓ **Statement timeout** - 5-second max per query  
✓ **CORS protected** - Requests only from localhost:3000

## API Reference

### `POST /api/chat`

Send a message and get a response with optional visualization.

**Request:**
```json
{
  "messages": [
    {
      "role": "user",
      "content": "What are the top 5 most stocked items?"
    }
  ]
}
```

**Response:**
```json
{
  "reply": "The top 5 most stocked items are...",
  "component": {
    "type": "table",
    "columns": ["name", "quantity"],
    "rows": [
      {"name": "Solar Tiles", "quantity": 150},
      {"name": "Shingles", "quantity": 120}
    ]
  }
}
```

Or just text if no visualization is needed:
```json
{
  "reply": "There are currently 42 pending orders."
}
```

## Troubleshooting

**Port already in use?**
```bash
~/tools/bin/kill-port.sh 5000    # Kill backend
~/tools/bin/kill-port.sh 3000    # Kill frontend
```

**Frontend can't reach backend?**
- Ensure backend is running on 5000: `python backend/app.py`
- Check CORS is enabled in `backend/app.py`
- Verify `.env` has correct API key and model

**"Module not found" errors?**
```bash
# Backend
cd backend && pip install -r requirements.txt

# Frontend
cd frontend && npm install
```

**Database errors?**
```bash
# Reinitialize database
cd backend && python setup_db.py
```

## Adding Custom Visualizations

To add a new chart type (e.g., Pie Chart):

1. Create component in `frontend/src/components/PieChart.tsx`
2. Import in `frontend/src/components/Chat.tsx`
3. Add handling in the message render loop:
   ```tsx
   {message.data.type === 'pie_chart' && <PieChart data={message.data} />}
   ```
4. Update backend prompt to suggest this visualization for appropriate queries

## Common Questions

**Q: Can I use a different database?**  
A: Yes, modify `backend/app.py` to connect to PostgreSQL, MySQL, etc. Just keep the safety validations!

**Q: How do I add more tables?**  
A: Update `backend/setup_db.py` to create them, then mention them in `SCHEMA_DESCRIPTION`.

**Q: Can I expose this publicly?**  
A: Not recommended without authentication. The current setup is safe for local use only.

**Q: What if the LLM generates bad SQL?**  
A: The query is validated, and if it fails (UnsafeQueryError or SQLite error), the error is returned to the LLM, which can retry.

## Development Notes

- Backend uses `load_dotenv()` to read `.env` from parent directory
- Frontend uses `fetch` to call backend API (no axios needed, can be removed)
- Vercel AI SDK's `useChat` is configured but responses use direct fetch
- Charts auto-scale to container width with Recharts `ResponsiveContainer`

## Future Ideas

- [ ] Streaming responses from LLM
- [ ] Query caching
- [ ] Advanced filters and aggregations
- [ ] CSV/PDF export
- [ ] Dark mode
- [ ] Explain generated SQL
- [ ] Query history/favorites
- [ ] User authentication
- [ ] More chart types (pie, scatter, heatmap)

## License

MIT
