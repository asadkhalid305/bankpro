from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
import shutil
import os
import json
import processor
import pandas as pd
from datetime import datetime
from pydantic import BaseModel
from typing import List, Optional
import sqlite3
import database
import config_manager

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "files"
UPLOADS_DIR = os.path.join(UPLOAD_DIR, "uploads")
STATEMENTS_DIR = os.path.join(UPLOAD_DIR, "statements")
BACKUP_DIR = os.path.join(UPLOAD_DIR, "backups")
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "processor.db")

os.makedirs(UPLOADS_DIR, exist_ok=True)
os.makedirs(STATEMENTS_DIR, exist_ok=True)
os.makedirs(BACKUP_DIR, exist_ok=True)

class ManualTransaction(BaseModel):
    date: str
    merchant: str
    details: Optional[str] = ""
    amount: float
    account: str
    category: str
    bucket: str = "Main"
    transaction_type: str = "EXPENSE"

class AccountModel(BaseModel):
    name: str
    initial_balance: float = 0.0
    currency: str = "EUR"
    bucket: str = "Main"

class AccountUpdate(BaseModel):
    old_name: Optional[str] = None
    new_name: str
    initial_balance: float
    currency: str = "EUR"
    bucket: str = "Main"

class BucketModel(BaseModel):
    name: str
    description: Optional[str] = None

class TransactionUpdate(BaseModel):
    id: int
    date: Optional[str] = None
    merchant: Optional[str] = None
    details: Optional[str] = None
    category: Optional[str] = None
    amount: Optional[float] = None
    account: Optional[str] = None
    bucket: Optional[str] = None
    transaction_type: Optional[str] = None
    class Config:
        extra = "ignore"

class MappingRequest(BaseModel):
    merchant: str
    category: str
    bucket: Optional[str] = "Main"
    old_merchant: Optional[str] = None

class BulkDeleteMappings(BaseModel):
    merchants: List[str]

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

@app.on_event("startup")
def startup():
    database.init_db()
    config_manager.load_config_from_seed()

# --- ACCOUNTS ---
@app.get("/accounts/")
async def get_accounts():
    conn = get_db()
    # Calculate current balance: initial_balance + sum(transactions)
    cursor = conn.execute('''
        SELECT a.name, a.initial_balance, a.currency, a.bucket,
               a.initial_balance + TOTAL(t.amount) as current_balance
        FROM accounts a
        LEFT JOIN transactions t ON a.name = t.account
        GROUP BY a.name
    ''')
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

@app.post("/accounts/")
async def update_or_add_account(acc: AccountUpdate):
    conn = get_db()
    try:
        if acc.old_name:
            # Update existing account
            conn.execute('''
                UPDATE accounts 
                SET name = ?, initial_balance = ?, currency = ?, bucket = ?
                WHERE name = ?
            ''', (acc.new_name, acc.initial_balance, acc.currency, acc.bucket, acc.old_name))
            
            # Also update any transactions associated with the old name
            if acc.old_name != acc.new_name:
                conn.execute("UPDATE transactions SET account = ? WHERE account = ?", (acc.new_name, acc.old_name))
        else:
            # Add new account
            conn.execute('''
                INSERT INTO accounts (name, initial_balance, currency, bucket) 
                VALUES (?, ?, ?, ?)
            ''', (acc.new_name, acc.initial_balance, acc.currency, acc.bucket))
        
        conn.commit()
        config_manager.dump_config_to_seed()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()
    return {"status": "success"}

@app.delete("/accounts/{name}")
async def delete_account(name: str):
    conn = get_db()
    try:
        conn.execute("DELETE FROM accounts WHERE name = ?", (name,))
        conn.commit()
        config_manager.dump_config_to_seed()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()
    return {"status": "success"}

# --- BUCKETS ---
@app.get("/buckets/")
async def get_buckets():
    conn = get_db()
    cursor = conn.execute("SELECT name, description FROM buckets")
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

@app.post("/buckets/")
async def save_buckets(buckets: List[BucketModel]):
    conn = get_db()
    try:
        conn.execute("DELETE FROM buckets")
        for b in buckets:
            conn.execute("INSERT INTO buckets (name, description) VALUES (?, ?)", (b.name, b.description))
        conn.commit()
        config_manager.dump_config_to_seed()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()
    return {"status": "success"}

# --- CATEGORIES ---
@app.get("/categories/")
async def get_categories():
    conn = get_db()
    cursor = conn.execute("SELECT name FROM categories")
    rows = cursor.fetchall()
    conn.close()
    return [row['name'] for row in rows]

@app.post("/categories/")
async def save_categories(categories: List[str]):
    conn = get_db()
    try:
        conn.execute("DELETE FROM categories")
        for cat in categories:
            conn.execute("INSERT INTO categories (name) VALUES (?)", (cat,))
        conn.commit()
        config_manager.dump_config_to_seed()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()
    return {"status": "success"}

# --- TRANSACTIONS ---
@app.get("/transactions/")
async def get_transactions(bucket: Optional[str] = None, account: Optional[str] = None):
    conn = get_db()
    query = "SELECT * FROM transactions"
    params = []
    if bucket or account:
        query += " WHERE "
        conditions = []
        if bucket:
            conditions.append("bucket = ?")
            params.append(bucket)
        if account:
            conditions.append("account = ?")
            params.append(account)
        query += " AND ".join(conditions)
    query += " ORDER BY date DESC"
    cursor = conn.execute(query, params)
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

@app.post("/transactions/manual")
async def add_manual_transaction(t: ManualTransaction):
    conn = get_db()
    try:
        conn.execute('''
            INSERT INTO transactions (date, merchant, details, amount, account, category, bucket, transaction_type, is_manual)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
        ''', (t.date, t.merchant, t.details, t.amount, t.account, t.category, t.bucket, t.transaction_type))
        
        if t.category != "Unknown":
            conn.execute('''
                INSERT INTO mappings (pattern, category, bucket) VALUES (?, ?, ?)
                ON CONFLICT(pattern) DO UPDATE SET category = EXCLUDED.category, bucket = EXCLUDED.bucket
            ''', (t.merchant, t.category, t.bucket))
            config_manager.dump_config_to_seed()
            
        conn.commit()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()
    return {"status": "success"}

@app.post("/transactions/update")
async def update_transaction(t: TransactionUpdate):
    conn = get_db()
    try:
        fields, params = [], []
        update_dict = t.dict(exclude_unset=True)
        for field, value in update_dict.items():
            if field != 'id':
                fields.append(f"{field} = ?")
                params.append(value)
        if fields:
            params.append(t.id)
            conn.execute(f"UPDATE transactions SET {', '.join(fields)} WHERE id = ?", params)
            
            if 'category' in update_dict or 'bucket' in update_dict:
                row = conn.execute("SELECT merchant, category, bucket FROM transactions WHERE id = ?", (t.id,)).fetchone()
                if row and row['category'] != "Unknown":
                    conn.execute('''
                        INSERT INTO mappings (pattern, category, bucket) VALUES (?, ?, ?)
                        ON CONFLICT(pattern) DO UPDATE SET category = EXCLUDED.category, bucket = EXCLUDED.bucket
                    ''', (row['merchant'], row['category'], row['bucket']))
                    config_manager.dump_config_to_seed()
            conn.commit()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()
    return {"status": "success"}

@app.delete("/transactions/{t_id}")
async def delete_transaction(t_id: int):
    conn = get_db()
    conn.execute("DELETE FROM transactions WHERE id = ?", (t_id,))
    conn.commit()
    conn.close()
    return {"status": "success"}

# --- MAPPINGS ---
@app.get("/mappings/")
async def get_mappings():
    conn = get_db()
    cursor = conn.execute("SELECT pattern, category, bucket FROM mappings")
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

@app.post("/mappings/")
async def update_mapping(m: MappingRequest):
    conn = get_db()
    try:
        bucket = m.bucket
        if m.category == "Kindergeld" or "kindergeld" in m.merchant.lower():
            bucket = "Kindergeld"
        if m.old_merchant and m.old_merchant != m.merchant:
            conn.execute("DELETE FROM mappings WHERE pattern = ?", (m.old_merchant,))
        conn.execute('''
            INSERT INTO mappings (pattern, category, bucket) VALUES (?, ?, ?)
            ON CONFLICT(pattern) DO UPDATE SET category = EXCLUDED.category, bucket = EXCLUDED.bucket
        ''', (m.merchant, m.category, bucket))
        conn.commit()
        config_manager.dump_config_to_seed()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()
    return {"status": "success"}

@app.delete("/mappings/bulk_delete")
async def bulk_delete_mappings(request: BulkDeleteMappings):
    conn = get_db()
    try:
        for m in request.merchants:
            conn.execute("DELETE FROM mappings WHERE pattern = ?", (m,))
        conn.commit()
        config_manager.dump_config_to_seed()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()
    return {"status": "success"}

# --- UPLOAD & MERGE ---
@app.post("/upload/")
async def upload_file(file: UploadFile = File(...), create_new_file: bool = Form(False)):
    try:
        temp_file_path = os.path.join(UPLOADS_DIR, file.filename)
        with open(temp_file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        if file.filename.lower().endswith('.pdf'):
            df, metadata = processor.process_pdf(temp_file_path)
        elif file.filename.lower().endswith('.xlsx'):
            df, metadata = processor.process_excel(temp_file_path)
        else:
            raise HTTPException(status_code=400, detail="Unsupported file type")

        conn = get_db()
        df['is_duplicate'] = False
        for idx, row in df.iterrows():
            cursor = conn.execute("SELECT id FROM transactions WHERE date = ? AND merchant = ? AND amount = ? AND account = ?", 
                                (row['date'], row['merchant'], row['amount'], row['account']))
            if cursor.fetchone(): df.at[idx, 'is_duplicate'] = True
        conn.close()

        # Prepare clean data for JSON (replace NaN with None)
        clean_data = []
        for row in df.to_dict(orient='records'):
            clean_row = {k: (v if pd.notna(v) else None) for k, v in row.items()}
            clean_data.append(clean_row)

        if create_new_file:
            bank_name = metadata.get("source", "Bank").replace(" ", "_")
            new_filename = f"{bank_name}_Statement_{metadata['start_date']}_to_{metadata['end_date']}.xlsx"
            df.drop(columns=['is_duplicate']).to_excel(os.path.join(STATEMENTS_DIR, new_filename), index=False)
            return {"status": "success", "message": f"New file created.", "new_filename": new_filename, "metadata": metadata, "data": clean_data}
        
        return {"status": "review", "metadata": metadata, "data": clean_data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/merge")
async def merge_to_db(request: dict):
    df = pd.DataFrame(request['transactions'])
    processor.save_to_db(df)
    config_manager.dump_config_to_seed() # Sync after batch learn
    return {"status": "success"}

# --- DASHBOARD & EXPORT ---
@app.get("/dashboard/summary")
async def get_summary(start_date: Optional[str] = None, end_date: Optional[str] = None):
    conn = get_db()
    
    # If no dates provided, default to current month
    if not start_date or not end_date:
        now = datetime.now()
        start_date = now.strftime('%Y-%m-01')
        # Simple end of month (next month day 1 - 1)
        if now.month == 12:
            end_date = f"{now.year}-12-31"
        else:
            end_date = (datetime(now.year, now.month + 1, 1)).strftime('%Y-%m-%d')
    
    # 1. Account Balances (Always Global Snapshot)
    cursor = conn.execute('''
        SELECT a.name, a.initial_balance + TOTAL(t.amount) as balance
        FROM accounts a
        LEFT JOIN transactions t ON a.name = t.account
        GROUP BY a.name
    ''')
    accounts = [dict(row) for row in cursor.fetchall()]
    total_net_worth = sum(acc['balance'] for acc in accounts)

    # 2. Bucket Balances (Always Global Snapshot)
    # Corrected: Initial Balances of linked accounts + All transactions
    cursor = conn.execute('SELECT bucket as name, SUM(initial_balance) as initial FROM accounts GROUP BY bucket')
    initial_balances = {row['name']: row['initial'] for row in cursor.fetchall()}
    
    cursor = conn.execute('SELECT bucket as name, TOTAL(amount) as trans_sum FROM transactions GROUP BY bucket')
    trans_sums = {row['name']: row['trans_sum'] for row in cursor.fetchall()}
    
    cursor = conn.execute('SELECT name FROM buckets')
    all_buckets = [row['name'] for row in cursor.fetchall()]
    
    buckets = []
    for b_name in all_buckets:
        balance = initial_balances.get(b_name, 0) + trans_sums.get(b_name, 0)
        buckets.append({"name": b_name, "balance": balance})

    # 3. Global Snapshot Pillars (Account-based as requested)
    # Personal Portfolio = Balance of TR - Personal
    # Child Investment = Balance of TR - Child
    investment_personal = sum(acc['balance'] for acc in accounts if 'personal' in acc['name'].lower() and 'tr' in acc['name'].lower())
    investment_child = sum(acc['balance'] for acc in accounts if 'child' in acc['name'].lower() and 'tr' in acc['name'].lower())

    # 4. Period Activity (Filtered by Date Range)
    # Transfers (Positive side only to show volume)
    cursor = conn.execute('''
        SELECT ABS(TOTAL(amount)) as total 
        FROM transactions 
        WHERE transaction_type = 'TRANSFER' AND amount > 0 AND date BETWEEN ? AND ?
    ''', (start_date, end_date))
    monthly_transfers = cursor.fetchone()['total']

    # Period Flow
    cursor = conn.execute('''
        SELECT TOTAL(amount) as total 
        FROM transactions 
        WHERE transaction_type = 'INCOME' 
        AND date BETWEEN ? AND ?
    ''', (start_date, end_date))
    monthly_income = cursor.fetchone()['total']

    cursor = conn.execute('''
        SELECT ABS(TOTAL(amount)) as total 
        FROM transactions 
        WHERE transaction_type = 'EXPENSE' 
        AND date BETWEEN ? AND ?
    ''', (start_date, end_date))
    monthly_expenses = cursor.fetchone()['total']
    
    monthly_savings = monthly_income - monthly_expenses

    # 5. Recent Transactions
    cursor = conn.execute("SELECT * FROM transactions ORDER BY date DESC, created_at DESC LIMIT 5")
    recent = [dict(row) for row in cursor.fetchall()]

    # Category Summary (Filtered)
    cursor = conn.execute('''
        SELECT category, SUM(amount) as total 
        FROM transactions 
        WHERE transaction_type = 'EXPENSE' 
        AND date BETWEEN ? AND ?
        GROUP BY category
    ''', (start_date, end_date))
    categories = [dict(row) for row in cursor.fetchall()]

    conn.close()
    return {
        "accounts": accounts,
        "buckets": buckets,
        "total_net_worth": total_net_worth,
        "investment_child": investment_child,
        "investment_personal": investment_personal,
        "monthly_transfers": monthly_transfers,
        "monthly_expenses": monthly_expenses,
        "monthly_income": monthly_income,
        "monthly_savings": monthly_savings,
        "recent_transactions": recent,
        "categories": categories,
        "filters": {"start_date": start_date, "end_date": end_date}
    }
    
    monthly_savings = monthly_income - monthly_expenses

    # 6. Recent Transactions (Always Latest)
    cursor = conn.execute("SELECT * FROM transactions ORDER BY date DESC, created_at DESC LIMIT 5")
    recent = [dict(row) for row in cursor.fetchall()]

    # Category Summary (Filtered by Date Range)
    cursor = conn.execute('''
        SELECT category, SUM(amount) as total 
        FROM transactions 
        WHERE transaction_type = 'EXPENSE' 
        AND date BETWEEN ? AND ?
        GROUP BY category
    ''', (start_date, end_date))
    categories = [dict(row) for row in cursor.fetchall()]

    conn.close()
    return {
        "accounts": accounts,
        "buckets": buckets,
        "investment_child": investment_child,
        "investment_personal": investment_personal,
        "monthly_transfers": monthly_transfers,
        "monthly_expenses": monthly_expenses,
        "monthly_income": monthly_income,
        "monthly_savings": monthly_savings,
        "recent_transactions": recent,
        "categories": categories,
        "filters": {"start_date": start_date, "end_date": end_date}
    }

@app.get("/export/targetV2")
async def export_target_v2():
    conn = get_db()
    # Use double quotes for reserved keyword "WHERE"
    df = pd.read_sql_query('SELECT date, merchant as "WHERE", details as DETAILS, category as CATEGORY, account as PAYMENT, amount as PRICE FROM transactions ORDER BY date DESC', conn)
    conn.close()
    export_path = os.path.join(UPLOAD_DIR, "Export_V2_Style.xlsx")
    with pd.ExcelWriter(export_path, engine='xlsxwriter') as writer:
        df.to_excel(writer, sheet_name='Transactions', index=False)
        if not df.empty:
            summary_df = df.groupby('CATEGORY')['PRICE'].sum().reset_index()
            summary_df.to_excel(writer, sheet_name='Summary', index=False)
    return FileResponse(export_path, filename="Export_V2_Style.xlsx")

@app.get("/backups/")
async def get_backups():
    if not os.path.exists(BACKUP_DIR): return []
    backups = []
    for f in os.listdir(BACKUP_DIR):
        if f.endswith('.xlsx'):
            stat = os.stat(os.path.join(BACKUP_DIR, f))
            backups.append({"filename": f, "date": datetime.fromtimestamp(stat.st_mtime).strftime('%Y-%m-%d %H:%M'), "size": f"{stat.st_size / 1024:.1f} KB"})
    return sorted(backups, key=lambda x: x['date'], reverse=True)