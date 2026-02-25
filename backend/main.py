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
    initial_balance: float = 0.0

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

class FixedExpenseModel(BaseModel):
    service: str
    category: str
    payment_account: str
    period: str
    price: float
    due_day: int = 1
    is_manual: int = 0
    due_months: Optional[str] = None
    bucket: str = "Main"

class FixedExpenseUpdate(FixedExpenseModel):
    id: int

class BillStatusUpdate(BaseModel):
    fixed_expense_id: int
    month: str
    status: str # pending, paid, skipped
    transaction_id: Optional[int] = None

class CategoryBudgetModel(BaseModel):
    category_name: str
    month: str
    target_amount: float

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def get_monthly_fixed_by_category():
    conn = get_db()
    cursor = conn.execute("SELECT category, period, price FROM fixed_expenses")
    rows = cursor.fetchall()
    conn.close()
    
    fixed_by_cat = {}
    for row in rows:
        cat = row['category']
        price = row['price']
        period = row['period']
        
        monthly_equiv = 0
        if period == 'Monthly': monthly_equiv = price
        elif period == 'Quarterly': monthly_equiv = price / 3
        elif period == 'Yearly': monthly_equiv = price / 12
        
        fixed_by_cat[cat] = fixed_by_cat.get(cat, 0) + monthly_equiv
    return fixed_by_cat

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
    cursor = conn.execute("SELECT name, description, initial_balance FROM buckets")
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

@app.post("/buckets/")
async def save_buckets(buckets: List[BucketModel]):
    conn = get_db()
    try:
        conn.execute("DELETE FROM buckets")
        for b in buckets:
            conn.execute("INSERT INTO buckets (name, description, initial_balance) VALUES (?, ?, ?)", (b.name, b.description, b.initial_balance))
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

@app.post("/categories/update")
async def update_category(request: dict):
    old_name = request.get('old_name')
    new_name = request.get('new_name')
    if not old_name or not new_name:
        raise HTTPException(status_code=400, detail="Missing old_name or new_name")
        
    conn = get_db()
    try:
        # Update category name
        conn.execute("UPDATE categories SET name = ? WHERE name = ?", (new_name, old_name))
        # Propagate to all tables
        conn.execute("UPDATE transactions SET category = ? WHERE category = ?", (new_name, old_name))
        conn.execute("UPDATE mappings SET category = ? WHERE category = ?", (new_name, old_name))
        conn.execute("UPDATE fixed_expenses SET category = ? WHERE category = ?", (new_name, old_name))
        conn.execute("UPDATE category_budgets SET category_name = ? WHERE category_name = ?", (new_name, old_name))
        
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
    fixed_baselines = get_monthly_fixed_by_category()
    
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
    # Corrected: Bucket Initial Balance + Initial Balances of linked accounts + All transactions
    cursor = conn.execute('SELECT name, initial_balance FROM buckets')
    bucket_initials = {row['name']: row['initial_balance'] for row in cursor.fetchall()}
    
    cursor = conn.execute('SELECT bucket as name, SUM(initial_balance) as initial FROM accounts GROUP BY bucket')
    account_initials = {row['name']: row['initial'] for row in cursor.fetchall()}
    
    cursor = conn.execute('SELECT bucket as name, TOTAL(amount) as trans_sum FROM transactions GROUP BY bucket')
    trans_sums = {row['name']: row['trans_sum'] for row in cursor.fetchall()}
    
    buckets = []
    for b_name, b_init in bucket_initials.items():
        balance = b_init + account_initials.get(b_name, 0) + trans_sums.get(b_name, 0)
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

    # Category Summary (Filtered & Period-Aware)
    # 1. Calculate months in period for scaling fixed baselines
    d1 = datetime.strptime(start_date, '%Y-%m-%d')
    d2 = datetime.strptime(end_date, '%Y-%m-%d')
    # Use a simple month count (difference in months + 1)
    months_in_period = (d2.year - d1.year) * 12 + d2.month - d1.month + 1
    
    # 2. Get Sum of Manual Budgets in range
    # Get all month strings in range (e.g. "2024-01", "2024-02")
    months_list = []
    curr = d1
    while curr <= d2:
        m_str = curr.strftime('%Y-%m')
        if m_str not in months_list: months_list.append(m_str)
        # Move to next month safely
        if curr.month == 12: curr = curr.replace(year=curr.year+1, month=1)
        else: curr = curr.replace(month=curr.month+1)
        
    cursor = conn.execute(f'''
        SELECT category_name as category, SUM(target_amount) as manual_total
        FROM category_budgets
        WHERE month IN ({','.join(['?']*len(months_list))})
        GROUP BY category_name
    ''', months_list)
    manual_sums = {row['category']: row['manual_total'] for row in cursor.fetchall()}

    # 3. Get Transactions in range
    cursor = conn.execute('''
        SELECT category, SUM(amount) as amount 
        FROM transactions 
        WHERE transaction_type = 'EXPENSE' 
        AND date BETWEEN ? AND ?
        GROUP BY category
    ''', (start_date, end_date))
    trans_rows = cursor.fetchall()
    
    categories = []
    processed_cats = set()
    for row in trans_rows:
        cat = row['category']
        processed_cats.add(cat)
        fixed_baseline = fixed_baselines.get(cat, 0)
        # Use manual total if set, otherwise fallback to fixed baseline
        total_budget_for_period = manual_sums.get(cat, fixed_baseline * months_in_period)
        
        display_name = "Uncategorized" if cat == "Unknown" else cat
        
        categories.append({
            "category": display_name,
            "total": row['amount'],
            "budget": total_budget_for_period
        })

    # 4. Add categories that have budget but no transactions
    all_budget_cats = set(manual_sums.keys()) | set(fixed_baselines.keys())
    for cat in all_budget_cats:
        if cat not in processed_cats:
            fixed_baseline = fixed_baselines.get(cat, 0)
            total_budget_for_period = manual_sums.get(cat, fixed_baseline * months_in_period)
            
            if total_budget_for_period > 0:
                categories.append({
                    "category": cat,
                    "total": 0,
                    "budget": total_budget_for_period
                })

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

# --- FIXED EXPENSES ---
@app.get("/fixed_expenses/")
async def get_fixed_expenses():
    conn = get_db()
    cursor = conn.execute("SELECT * FROM fixed_expenses ORDER BY period ASC, price DESC")
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

@app.post("/fixed_expenses/")
async def add_fixed_expense(exp: FixedExpenseModel):
    conn = get_db()
    try:
        conn.execute('''
            INSERT INTO fixed_expenses (service, category, payment_account, period, price, due_day, is_manual, due_months, bucket) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (exp.service, exp.category, exp.payment_account, exp.period, exp.price, exp.due_day, exp.is_manual, exp.due_months, exp.bucket))
        conn.commit()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()
    return {"status": "success"}

@app.post("/fixed_expenses/update")
async def update_fixed_expense(exp: FixedExpenseUpdate):
    conn = get_db()
    try:
        conn.execute('''
            UPDATE fixed_expenses 
            SET service = ?, category = ?, payment_account = ?, period = ?, price = ?, due_day = ?, is_manual = ?, due_months = ?, bucket = ?
            WHERE id = ?
        ''', (exp.service, exp.category, exp.payment_account, exp.period, exp.price, exp.due_day, exp.is_manual, exp.due_months, exp.bucket, exp.id))
        conn.commit()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()
    return {"status": "success"}

@app.delete("/fixed_expenses/{exp_id}")

async def delete_fixed_expense(exp_id: int):

    conn = get_db()

    conn.execute("DELETE FROM fixed_expenses WHERE id = ?", (exp_id,))

    conn.commit()

    conn.close()

    return {"status": "success"}



# --- CATEGORY BUDGETS ---

@app.get("/budgets/")
async def get_budgets(month: Optional[str] = None):
    conn = get_db()
    fixed_baselines = get_monthly_fixed_by_category()
    
    # 1. Get manual budgets for the month
    if month:
        cursor = conn.execute("SELECT * FROM category_budgets WHERE month = ?", (month,))
    else:
        cursor = conn.execute("SELECT * FROM category_budgets ORDER BY month DESC")
    manual_rows = cursor.fetchall()
    
    # SMART DEFAULT: If this month is empty, carry forward the latest setup
    if month and not manual_rows:
        cursor = conn.execute("SELECT * FROM category_budgets WHERE month < ? ORDER BY month DESC", (month,))
        latest_rows = cursor.fetchall()
        if latest_rows:
            latest_month = latest_rows[0]['month']
            manual_rows = [r for r in latest_rows if r['month'] == latest_month]

    conn.close()
    manual_map = {row['category_name']: row['target_amount'] for row in manual_rows}
    
    results = []
    # Show categories that have either a fixed baseline OR a manual budget
    all_active_cats = set(fixed_baselines.keys()) | set(manual_map.keys())
    
    for cat in sorted(list(all_active_cats)):
        fixed = fixed_baselines.get(cat, 0)
        # If no manual budget is set, the "Total" defaults to the "Fixed" commitment
        total = manual_map.get(cat, fixed)
        
        results.append({
            "category_name": cat,
            "fixed_baseline": fixed,
            "total_budget": total,
            "flexible_allowance": total - fixed # Calculated: what's left for variable spending
        })
        
    return results

@app.post("/budgets/sync_year")
async def sync_year_budgets(request: dict):
    source_month = request.get('month')
    if not source_month:
        raise HTTPException(status_code=400, detail="Missing month")
    
    conn = get_db()
    try:
        # Get source setup - specifically for the selected month
        cursor = conn.execute("SELECT category_name, target_amount FROM category_budgets WHERE month = ?", (source_month,))
        manual_rows = cursor.fetchall()
        
        # SMART DEFAULT: If the source month has no records, find the LATEST month that does
        if not manual_rows:
            cursor = conn.execute("SELECT * FROM category_budgets WHERE month < ? ORDER BY month DESC", (source_month,))
            latest_rows = cursor.fetchall()
            if latest_rows:
                latest_month = latest_rows[0]['month']
                manual_rows = [r for r in latest_rows if r['month'] == latest_month]
        
        # Decouple results from cursor
        sources = [{"category": row['category_name'], "amount": row['target_amount']} for row in manual_rows]
        
        # Determine year
        year = source_month.split('-')[0]
        all_months = [f"{year}-{m:02d}" for m in range(1, 13)]
        
        # Clear all months for this year
        placeholders = ', '.join(['?'] * len(all_months))
        conn.execute(f"DELETE FROM category_budgets WHERE month IN ({placeholders})", all_months)
        
        # Re-populate all 12 months with the EXACT setup
        for m in all_months:
            for row in sources:
                conn.execute('''
                    INSERT INTO category_budgets (category_name, month, target_amount)
                    VALUES (?, ?, ?)
                ''', (row['category'], m, row['amount']))
        
        conn.commit()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()
    return {"status": "success"}



@app.post("/budgets/")
async def update_budget(budget: CategoryBudgetModel):
    conn = get_db()
    try:
        conn.execute('''
            INSERT INTO category_budgets (category_name, month, target_amount) 
            VALUES (?, ?, ?)
            ON CONFLICT(category_name, month) DO UPDATE SET target_amount = EXCLUDED.target_amount
        ''', (budget.category_name, budget.month, budget.target_amount))
        conn.commit()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()
    return {"status": "success"}

@app.delete("/budgets/{month}/{category}")
async def delete_budget(month: str, category: str):
    conn = get_db()
    try:
        conn.execute("DELETE FROM category_budgets WHERE month = ? AND category_name = ?", (month, category))
        conn.commit()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()
    return {"status": "success"}

@app.post("/budgets/copy")
async def copy_budgets(request: dict):
    from_month = request.get('from_month')
    to_month = request.get('to_month')
    if not from_month or not to_month:
        raise HTTPException(status_code=400, detail="Missing from_month or to_month")
    
    conn = get_db()
    try:
        # Get source budgets
        cursor = conn.execute("SELECT category_name, target_amount FROM category_budgets WHERE month = ?", (from_month,))
        sources = cursor.fetchall()
        
        for row in sources:
            conn.execute('''
                INSERT INTO category_budgets (category_name, month, target_amount)
                VALUES (?, ?, ?)
                ON CONFLICT(category_name, month) DO UPDATE SET target_amount = EXCLUDED.target_amount
            ''', (row['category_name'], to_month, row['target_amount']))
        conn.commit()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()
    return {"status": "success"}

# --- BILL TRACKING ---

@app.get("/bills/")
async def get_bills(month: str):
    """
    Returns the bill checklist for a specific month (YYYY-MM).
    Automatically attempts to match pending bills with transactions.
    """
    conn = get_db()
    try:
        # 1. Get all fixed expenses
        cursor = conn.execute("SELECT * FROM fixed_expenses")
        all_fixed = [dict(row) for row in cursor.fetchall()]
        
        # 2. Filter for expenses relevant to this month
        month_parts = month.split('-')
        if len(month_parts) < 2:
            raise HTTPException(status_code=400, detail="Invalid month format. Use YYYY-MM")
        current_month_int = int(month_parts[1])
        
        relevant_fixed = []
        for exp in all_fixed:
            is_relevant = False
            if exp['period'] == 'Monthly':
                is_relevant = True
            elif exp['period'] in ['Quarterly', 'Yearly'] and exp['due_months']:
                due_months = [int(m.strip()) for m in exp['due_months'].split(',')]
                if current_month_int in due_months:
                    is_relevant = True
            
            if is_relevant:
                relevant_fixed.append(exp)

        # 3. Get existing tracking records for this month
        cursor = conn.execute("SELECT * FROM bill_tracking WHERE month = ?", (month,))
        tracking_rows = cursor.fetchall()
        tracking_map = {row['fixed_expense_id']: dict(row) for row in tracking_rows}
        
        # Track which transactions are already "claimed" by a bill this month
        matched_transaction_ids = {row['transaction_id'] for row in tracking_rows if row['transaction_id']}

        # 4. Get transactions for this month to auto-match (only outgoing)
        start_date = f"{month}-01"
        end_date = f"{month}-31" 
        cursor = conn.execute("SELECT id, merchant, amount, date FROM transactions WHERE amount < 0 AND date BETWEEN ? AND ?", (start_date, end_date))
        month_transactions = [dict(row) for row in cursor.fetchall()]

        results = []
        for exp in relevant_fixed:
            track = tracking_map.get(exp['id'])
            status = track['status'] if track else 'pending'
            transaction_id = track['transaction_id'] if track else None
            paid_at = track['paid_at'] if track else None

            # 5. Auto-matching logic for pending bills
            if status == 'pending' and not exp['is_manual']:
                for tx in month_transactions:
                    # Skip transactions already claimed by another bill
                    if tx['id'] in matched_transaction_ids: continue
                    
                    # Match by merchant name (case-insensitive) and price (approximate)
                    tx_amount = abs(tx['amount'])
                    merchant_match = (exp['service'].lower() in tx['merchant'].lower()) or \
                                     (tx['merchant'].lower() in exp['service'].lower())
                    
                    if merchant_match and abs(tx_amount - exp['price']) < 1.0:
                        status = 'paid'
                        transaction_id = tx['id']
                        paid_at = tx['date']
                        matched_transaction_ids.add(tx['id'])
                        
                        # Save the auto-match to DB
                        conn.execute('''
                            INSERT INTO bill_tracking (fixed_expense_id, month, status, transaction_id, paid_at)
                            VALUES (?, ?, ?, ?, ?)
                            ON CONFLICT(fixed_expense_id, month) DO UPDATE SET 
                                status = EXCLUDED.status, 
                                transaction_id = EXCLUDED.transaction_id,
                                paid_at = EXCLUDED.paid_at
                        ''', (exp['id'], month, status, transaction_id, paid_at))
                        break

            results.append({
                "id": exp['id'],
                "service": exp['service'],
                "category": exp['category'],
                "price": exp['price'],
                "due_day": exp['due_day'],
                "is_manual": exp['is_manual'],
                "payment_account": exp['payment_account'],
                "status": status,
                "transaction_id": transaction_id,
                "paid_at": paid_at
            })

        conn.commit()
        # Sort: pending first, then paid/skipped at the bottom (both sorted by due day)
        results.sort(key=lambda x: (x['status'] != 'pending', x['due_day']))
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@app.post("/bills/status")
async def update_bill_status(update: BillStatusUpdate):
    conn = get_db()
    try:
        paid_at = None
        if update.status == 'paid':
            paid_at = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

        conn.execute('''
            INSERT INTO bill_tracking (fixed_expense_id, month, status, transaction_id, paid_at)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(fixed_expense_id, month) DO UPDATE SET 
                status = EXCLUDED.status, 
                transaction_id = EXCLUDED.transaction_id,
                paid_at = EXCLUDED.paid_at
        ''', (update.fixed_expense_id, update.month, update.status, update.transaction_id, paid_at))
        conn.commit()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()
    return {"status": "success"}
