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
            is_default INTEGER DEFAULT 0
        )
    ''')

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
            service TEXT NOT NULL,
            category TEXT NOT NULL,
            payment_account TEXT NOT NULL,
            period TEXT NOT NULL,
            price REAL NOT NULL,
            bucket TEXT DEFAULT 'Main',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # 7. Category Budgets table
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

    # Specific migration for Kita
    cursor.execute("UPDATE fixed_expenses SET bucket = 'Kindergeld' WHERE service = 'Kita' AND bucket = 'Main'")

    # Seed Fixed Expenses
    FIXED_DATA = [
        ('Strabag House Rent', 'Essential', 'Deutsche Bank', 'Monthly', 1331.55, 'Main'),
        ('Eprimo Electricity', 'Essential', 'Deutsche Bank', 'Monthly', 100.00, 'Main'),
        ('Miles', 'Transport', 'Wise', 'Monthly', 49.90, 'Main'),
        ('HVV Javeria', 'Transport', 'Deutsche Bank', 'Monthly', 49.00, 'Main'),
        ('Telekom', 'Essential', 'Deutsche Bank', 'Monthly', 45.00, 'Main'),
        ('Kita', 'Essential', 'Deutsche Bank', 'Monthly', 33.00, 'Kindergeld'),
        ('Getsafe Liability & Legal Insurance', 'Essential', 'Deutsche Bank', 'Monthly', 27.54, 'Main'),
        ('OpenAI', 'Essential', 'Deutsche Bank', 'Monthly', 23.00, 'Main'),
        ('USC', 'Entertainment', 'Deutsche Bank', 'Monthly', 9.99, 'Main'),
        ('Aldi Talk', 'Essential', 'Wise', 'Monthly', 8.99, 'Main'),
        ('Amazon Prime', 'Shopping', 'Wise', 'Monthly', 8.99, 'Main'),
        ('Apple iTunes', 'Essential', 'Wise', 'Monthly', 2.99, 'Main'),
        ('Netflix', 'Entertainment', 'Meezan', 'Monthly', 1.00, 'Main'),
        ('Spotify', 'Entertainment', 'Meezan', 'Monthly', 1.00, 'Main'),
        ('Radio Tax (ARD)', 'Essential', 'Deutsche Bank', 'Quarterly', 55.08, 'Main'),
        ('Deutsche Bank Fee', 'Essential', 'Deutsche Bank', 'Quarterly', 20.70, 'Main'),
        ('HUK24', 'Essential', 'Deutsche Bank', 'Yearly', 860.38, 'Main'),
        ('Car Maintainance', 'Essential', 'Deutsche Bank', 'Yearly', 640.00, 'Main'),
        ('Domain', 'Personal', 'Wise', 'Yearly', 18.00, 'Main')
    ]
    cursor.execute("SELECT COUNT(*) FROM fixed_expenses")
    if cursor.fetchone()[0] == 0:
        for item in FIXED_DATA:
            cursor.execute("INSERT INTO fixed_expenses (service, category, payment_account, period, price, bucket) VALUES (?, ?, ?, ?, ?, ?)", item)

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
