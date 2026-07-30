"""
Creates and seeds roofing.db with sample data for the POC.
Run once: python setup_db.py
"""
import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "roofing.db")

SCHEMA = """
CREATE TABLE customers (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    city TEXT,
    state TEXT
);

CREATE TABLE supplies (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,       -- gutters, tiles, solar-tiles, shingles, underlayment
    company TEXT NOT NULL,        -- manufacturer / vendor
    unit_price REAL NOT NULL,
    in_stock INTEGER NOT NULL     -- quantity currently in stock
);

CREATE TABLE orders (
    id INTEGER PRIMARY KEY,
    customer_id INTEGER NOT NULL,
    order_date TEXT NOT NULL,     -- ISO date
    status TEXT NOT NULL,         -- pending, in_progress, completed, cancelled
    notes TEXT,
    FOREIGN KEY (customer_id) REFERENCES customers(id)
);

CREATE TABLE order_items (
    id INTEGER PRIMARY KEY,
    order_id INTEGER NOT NULL,
    supply_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (supply_id) REFERENCES supplies(id)
);
"""

CUSTOMERS = [
    (1, "Maria Alvarez", "maria.a@example.com", "555-0101", "Austin", "TX"),
    (2, "James Whitfield", "jwhit@example.com", "555-0102", "Denver", "CO"),
    (3, "Priya Nair", "priya.nair@example.com", "555-0103", "Tampa", "FL"),
    (4, "Tom Bergeron", "tbergeron@example.com", "555-0104", "Portland", "OR"),
    (5, "Aisha Khan", "aisha.k@example.com", "555-0105", "Phoenix", "AZ"),
]

SUPPLIES = [
    (1, "5-inch K-Style Gutter", "gutters", "GutterMaster Inc.", 4.25, 1200),
    (2, "6-inch Half-Round Gutter", "gutters", "GutterMaster Inc.", 6.10, 400),
    (3, "Seamless Aluminum Gutter", "gutters", "AlumEdge Co.", 5.75, 850),
    (4, "Classic Clay Roof Tile", "tiles", "Terra Roofing Co.", 3.90, 3000),
    (5, "Concrete Flat Tile", "tiles", "Terra Roofing Co.", 2.60, 5000),
    (6, "Slate-Look Composite Tile", "tiles", "StoneCraft Supply", 7.80, 900),
    (7, "SolarGlass Roof Tile", "solar-tiles", "Tesla Energy", 62.00, 150),
    (8, "SunTegra Solar Shingle", "solar-tiles", "SunTegra Inc.", 58.50, 200),
    (9, "Architectural Asphalt Shingle", "shingles", "Owens Corning", 1.35, 10000),
    (10, "3-Tab Asphalt Shingle", "shingles", "GAF Materials", 0.95, 8000),
    (11, "Synthetic Underlayment Roll", "underlayment", "GAF Materials", 45.00, 600),
    (12, "Ice & Water Shield Roll", "underlayment", "Owens Corning", 68.00, 300),
]

ORDERS = [
    (1, 1, "2026-05-02", "completed", "Full gutter replacement, front and back"),
    (2, 2, "2026-05-10", "in_progress", "Clay tile reroof, west wing"),
    (3, 3, "2026-06-01", "pending", "Solar tile consultation and quote"),
    (4, 4, "2026-06-15", "completed", "Asphalt shingle repair after storm"),
    (5, 1, "2026-07-01", "in_progress", "Add solar tiles to south-facing roof"),
    (6, 5, "2026-07-10", "cancelled", "Customer postponed project"),
    (7, 3, "2026-07-20", "pending", "Gutter + underlayment bundle"),
]

ORDER_ITEMS = [
    (1, 1, 1, 180),   # order 1: K-style gutter x180 ft
    (2, 1, 11, 4),    # order 1: underlayment rolls
    (3, 2, 4, 2200),  # order 2: clay tile
    (4, 3, 7, 40),    # order 3: SolarGlass tile quote
    (5, 4, 9, 3000),  # order 4: architectural shingle
    (6, 5, 8, 60),    # order 5: SunTegra solar shingle
    (7, 5, 3, 150),   # order 5: aluminum gutter
    (8, 7, 2, 90),    # order 7: half-round gutter
    (9, 7, 12, 3),    # order 7: ice & water shield
]

def main():
    if os.path.exists(DB_PATH):
        os.remove(DB_PATH)
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.executescript(SCHEMA)
    cur.executemany("INSERT INTO customers VALUES (?,?,?,?,?,?)", CUSTOMERS)
    cur.executemany("INSERT INTO supplies VALUES (?,?,?,?,?,?)", SUPPLIES)
    cur.executemany("INSERT INTO orders VALUES (?,?,?,?,?)", ORDERS)
    cur.executemany("INSERT INTO order_items VALUES (?,?,?,?)", ORDER_ITEMS)
    conn.commit()
    conn.close()
    print(f"Created {DB_PATH} with sample roofing contractor data.")

if __name__ == "__main__":
    main()
