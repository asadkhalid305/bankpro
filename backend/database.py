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

    # Migration & Seeding
    
    # Seed Categories
    DEFAULT_CATEGORIES = [
        'Benefit', 'Bill', 'Conversion', 'Dependant', 'Extra', 'Food & Outing', 
        'Gifts', 'Grocery', 'Investment', 'Medical', 'Office', 'Salary', 
        'Shopping', 'Transport', 'Vacation', 'Car', 'Unknown', 'Kindergeld'
    ]
    for cat in DEFAULT_CATEGORIES:
        cursor.execute("INSERT OR IGNORE INTO categories (name) VALUES (?)", (cat,))

    # Migrate Mappings
    mapping_file = os.path.join(BASE_DIR, "mappings.json")
    if os.path.exists(mapping_file):
        try:
            with open(mapping_file, 'r') as f:
                mappings = json.load(f)
                for pattern, category in mappings.items():
                    cursor.execute("INSERT OR IGNORE INTO mappings (pattern, category) VALUES (?, ?)", (pattern, category))
        except Exception as e:
            print(f"Mapping migration error: {e}")

    # Migrate Accounts
    accounts_file = os.path.join(os.path.dirname(BASE_DIR), "files", "accounts.json")
    if os.path.exists(accounts_file):
        try:
            with open(accounts_file, 'r') as f:
                accounts = json.load(f)
                for acc in accounts:
                    cursor.execute("INSERT OR IGNORE INTO accounts (name, initial_balance, currency) VALUES (?, ?, ?)", 
                                 (acc['name'], acc.get('initial_balance', 0.0), acc.get('currency', 'EUR')))
        except Exception as e:
            print(f"Account migration error: {e}")
    else:
        # Default accounts
        for acc in ['Deutsche Bank', 'Wise', 'Paypal', 'Cash', 'Revolut']:
            cursor.execute("INSERT OR IGNORE INTO accounts (name) VALUES (?)", (acc,))

    # Seed Buckets
    for bucket in ['Main', 'Kindergeld', 'Savings']:
        cursor.execute("INSERT OR IGNORE INTO buckets (name) VALUES (?)", (bucket,))

    conn.commit()
    conn.close()

if __name__ == "__main__":
    init_db()
    print("Database schema updated and data migrated successfully.")