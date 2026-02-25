import sqlite3
import os
import json

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "processor.db")

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # 1. Transactions table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date TEXT NOT NULL,
            merchant TEXT,
            raw_merchant TEXT,
            amount REAL NOT NULL,
            currency TEXT DEFAULT 'EUR',
            category TEXT,
            account TEXT NOT NULL,
            bucket TEXT DEFAULT 'Main',
            transaction_type TEXT NOT NULL,
            payer TEXT,
            payee TEXT,
            is_manual INTEGER DEFAULT 0,
            original_file TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(date, merchant, amount, account) ON CONFLICT IGNORE
        )
    ''')
    
    # 2. Mappings table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS mappings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            pattern TEXT UNIQUE NOT NULL,
            category TEXT NOT NULL,
            bucket TEXT DEFAULT 'Main'
        )
    ''')
    
    # 3. Accounts table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS accounts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL,
            initial_balance REAL DEFAULT 0.0,
            currency TEXT DEFAULT 'EUR',
            bucket TEXT DEFAULT 'Main',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # Migration for existing DBs
    try:
        cursor.execute("ALTER TABLE accounts ADD COLUMN bucket TEXT DEFAULT 'Main'")
    except:
        pass # Already exists

    # 4. Buckets table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS buckets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL,
            description TEXT,
            initial_balance REAL DEFAULT 0.0,
            is_default INTEGER DEFAULT 0
        )
    ''')

    # Migration for existing DBs
    try:
        cursor.execute("ALTER TABLE buckets ADD COLUMN initial_balance REAL DEFAULT 0.0")
    except:
        pass # Already exists

    # 5. Categories table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL
        )
    ''')

    # 6. Fixed Expenses table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS fixed_expenses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            service TEXT UNIQUE NOT NULL,
            category TEXT NOT NULL,
            payment_account TEXT NOT NULL,
            period TEXT NOT NULL,
            price REAL NOT NULL,
            due_day INTEGER DEFAULT 1,
            is_manual INTEGER DEFAULT 0,
            due_months TEXT, -- Comma separated months for Quarterly/Yearly
            bucket TEXT DEFAULT 'Main',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # 7. Bill Tracking table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS bill_tracking (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            fixed_expense_id INTEGER NOT NULL,
            month TEXT NOT NULL, -- YYYY-MM
            status TEXT DEFAULT 'pending', -- pending, paid, skipped
            paid_at TIMESTAMP,
            transaction_id INTEGER,
            UNIQUE(fixed_expense_id, month),
            FOREIGN KEY (fixed_expense_id) REFERENCES fixed_expenses(id)
        )
    ''')

    # 8. Category Budgets table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS category_budgets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            category_name TEXT NOT NULL,
            month TEXT NOT NULL,
            target_amount REAL NOT NULL,
            UNIQUE(category_name, month)
        )
    ''')

    # Migration for fixed_expenses
    try:
        cursor.execute("ALTER TABLE fixed_expenses ADD COLUMN bucket TEXT DEFAULT 'Main'")
    except:
        pass # Already exists
    
    try:
        cursor.execute("ALTER TABLE fixed_expenses ADD COLUMN due_day INTEGER DEFAULT 1")
        cursor.execute("ALTER TABLE fixed_expenses ADD COLUMN is_manual INTEGER DEFAULT 0")
        cursor.execute("ALTER TABLE fixed_expenses ADD COLUMN due_months TEXT")
    except:
        pass

    # Specific migration for Kita
    cursor.execute("UPDATE fixed_expenses SET bucket = 'Kindergeld' WHERE service = 'Kita' AND bucket = 'Main'")

    # Seed Fixed Expenses
    FIXED_DATA = [
        ('Strabag House Rent', 'Essential', 'Deutsche Bank', 'Monthly', 1331.55, 5, 1, None, 'Main'),
        ('Eprimo Electricity', 'Essential', 'Deutsche Bank', 'Monthly', 100.00, 15, 0, None, 'Main'),
        ('Miles', 'Transport', 'Wise', 'Monthly', 49.90, 1, 0, None, 'Main'),
        ('HVV Javeria', 'Transport', 'Deutsche Bank', 'Monthly', 49.00, 1, 0, None, 'Main'),
        ('Telekom', 'Essential', 'Deutsche Bank', 'Monthly', 45.00, 12, 0, None, 'Main'),
        ('Kita', 'Essential', 'Deutsche Bank', 'Monthly', 33.00, 1, 0, None, 'Kindergeld'),
        ('Getsafe Liability & Legal Insurance', 'Essential', 'Deutsche Bank', 'Monthly', 27.54, 10, 0, None, 'Main'),
        ('OpenAI', 'Essential', 'Deutsche Bank', 'Monthly', 23.00, 20, 0, None, 'Main'),
        ('USC', 'Entertainment', 'Deutsche Bank', 'Monthly', 9.99, 15, 0, None, 'Main'),
        ('Aldi Talk', 'Essential', 'Wise', 'Monthly', 8.99, 1, 0, None, 'Main'),
        ('Amazon Prime', 'Shopping', 'Wise', 'Monthly', 8.99, 15, 0, None, 'Main'),
        ('Apple iTunes', 'Essential', 'Wise', 'Monthly', 25.00, 1, 0, None, 'Main'),
        ('Netflix', 'Entertainment', 'Meezan', 'Monthly', 1.00, 1, 1, None, 'Main'),
        ('Spotify', 'Entertainment', 'Meezan', 'Monthly', 1.00, 1, 1, None, 'Main'),
        ('Radio Tax (ARD)', 'Essential', 'Deutsche Bank', 'Quarterly', 55.08, 15, 0, '1,4,7,10', 'Main'),
        ('Deutsche Bank Fee', 'Essential', 'Deutsche Bank', 'Quarterly', 20.70, 30, 0, '3,6,9,12', 'Main'),
        ('HUK24', 'Essential', 'Deutsche Bank', 'Yearly', 860.38, 1, 1, '1', 'Main'),
        ('Car Maintainance', 'Essential', 'Deutsche Bank', 'Yearly', 640.00, 1, 1, '6', 'Main'),
        ('Domain', 'Personal', 'Wise', 'Yearly', 18.00, 1, 0, '11', 'Main')
    ]
    for item in FIXED_DATA:
        cursor.execute("SELECT id FROM fixed_expenses WHERE service = ?", (item[0],))
        if not cursor.fetchone():
            cursor.execute("INSERT INTO fixed_expenses (service, category, payment_account, period, price, due_day, is_manual, due_months, bucket) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)", item)

    # Seed Categories
    DEFAULT_CATEGORIES = [
        'Benefit', 'Bill', 'Conversion', 'Dependant', 'Extra', 'Food & Outing', 
        'Gifts', 'Grocery', 'Investment', 'Medical', 'Office', 'Salary', 
        'Shopping', 'Transport', 'Vacation', 'Car', 'Unknown', 'Kindergeld'
    ]
    for cat in DEFAULT_CATEGORIES:
        cursor.execute("INSERT OR IGNORE INTO categories (name) VALUES (?)", (cat,))

    # Seed Buckets
    for bucket in ['Main', 'Kindergeld', 'Savings']:
        cursor.execute("INSERT OR IGNORE INTO buckets (name) VALUES (?)", (bucket,))

    # Seed Default Accounts
    for acc in ['Deutsche Bank', 'Wise', 'Paypal', 'Cash', 'Revolut']:
        cursor.execute("INSERT OR IGNORE INTO accounts (name) VALUES (?)", (acc,))

    conn.commit()
    conn.close()

if __name__ == "__main__":
    init_db()
    print("Database schema updated and data seeded successfully.")
