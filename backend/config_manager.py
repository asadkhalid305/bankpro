import sqlite3
import json
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "processor.db")
SEED_PATH = os.path.join(BASE_DIR, "config_seed.json")

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def dump_config_to_seed():
    """Saves current DB configuration state to seed.json"""
    try:
        conn = get_db_connection()
        data = {
            'categories': [row['name'] for row in conn.execute('SELECT name FROM categories').fetchall()],
            'buckets': [dict(row) for row in conn.execute('SELECT name, description FROM buckets').fetchall()],
            'accounts': [dict(row) for row in conn.execute('SELECT name, initial_balance, currency FROM accounts').fetchall()],
            'mappings': [dict(row) for row in conn.execute('SELECT pattern, category, bucket FROM mappings').fetchall()]
        }
        conn.close()
        
        with open(SEED_PATH, 'w') as f:
            json.dump(data, f, indent=2)
        print(f"Seed file updated: {SEED_PATH}")
    except Exception as e:
        print(f"Error dumping config: {e}")

def load_config_from_seed():
    """Populates DB from seed.json (useful for fresh setup)"""
    if not os.path.exists(SEED_PATH):
        return

    try:
        with open(SEED_PATH, 'r') as f:
            data = json.load(f)
        
        conn = get_db_connection()
        cursor = conn.cursor()

        # Seed Categories
        for cat in data.get('categories', []):
            cursor.execute("INSERT OR IGNORE INTO categories (name) VALUES (?)", (cat,))

        # Seed Buckets
        for b in data.get('buckets', []):
            cursor.execute("INSERT OR IGNORE INTO buckets (name, description) VALUES (?, ?)", 
                         (b['name'], b.get('description')))

        # Seed Accounts
        for acc in data.get('accounts', []):
            cursor.execute("INSERT OR IGNORE INTO accounts (name, initial_balance, currency) VALUES (?, ?, ?)", 
                         (acc['name'], acc.get('initial_balance', 0.0), acc.get('currency', 'EUR')))

        # Seed Mappings
        for m in data.get('mappings', []):
            cursor.execute('''
                INSERT OR IGNORE INTO mappings (pattern, category, bucket) 
                VALUES (?, ?, ?)
            ''', (m['pattern'], m['category'], m.get('bucket', 'Main')))

        conn.commit()
        conn.close()
        print("Database seeded from config_seed.json")
    except Exception as e:
        print(f"Error loading seed: {e}")

if __name__ == "__main__":
    # If run directly, perform a dump
    dump_config_to_seed()
