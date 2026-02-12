import sqlite3
import os
import json

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "processor.db")
BACKUP_FILE = os.path.join(BASE_DIR, "mappings_backup.json")

def migrate():
    if not os.path.exists(BACKUP_FILE):
        print(f"Error: {BACKUP_FILE} not found.")
        return

    with open(BACKUP_FILE, 'r') as f:
        backup_mappings = json.load(f)

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    count = 0
    for pattern, category in backup_mappings.items():
        # Determine bucket logic
        bucket = "Main"
        if category == "Kindergeld" or "kindergeld" in pattern.lower():
            bucket = "Kindergeld"
        elif category == "Investment":
            bucket = "Savings"
        
        # INSERT OR IGNORE to not overwrite existing ones if already there, 
        # or use REPLACE if we want the backup to be the primary source.
        # Given the user says they were missing, REPLACE is better to ensure the backup is applied.
        cursor.execute('''
            INSERT INTO mappings (pattern, category, bucket) VALUES (?, ?, ?)
            ON CONFLICT(pattern) DO UPDATE SET category = EXCLUDED.category, bucket = EXCLUDED.bucket
        ''', (pattern, category, bucket))
        count += 1

    conn.commit()
    conn.close()
    print(f"Successfully migrated {count} mappings from backup to database.")

if __name__ == "__main__":
    migrate()
