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
OUTPUT_FILE = os.path.join(UPLOAD_DIR, "Final_Statement.xlsx")

os.makedirs(UPLOADS_DIR, exist_ok=True)
os.makedirs(STATEMENTS_DIR, exist_ok=True)
os.makedirs(BACKUP_DIR, exist_ok=True)

CATEGORIES = ['Benefit', 'Bill', 'Conversion', 'Dependant', 'Extra', 'Food & Outing', 'Gifts', 'Grocery', 'Investment', 'Medical', 'Office', 'Salary', 'Shopping', 'Transport', 'Vacation', 'Car', 'Unknown']
ACCOUNTS_FILE = os.path.join(UPLOAD_DIR, 'accounts.json')
PAYMENT_TYPES_FILE = os.path.join(os.path.dirname(__file__), 'payment_types.json')

class Account(BaseModel):
    name: str
    initial_balance: float = 0.0
    currency: str = "EUR"

# Initialize ACCOUNTS from file or migrate from payment_types
ACCOUNTS: List[Account] = []

def load_accounts():
    global ACCOUNTS
    if os.path.exists(ACCOUNTS_FILE):
        try:
            with open(ACCOUNTS_FILE, 'r') as f:
                data = json.load(f)
                ACCOUNTS = [Account(**item) for item in data]
        except json.JSONDecodeError:
            ACCOUNTS = []
    elif os.path.exists(PAYMENT_TYPES_FILE):
        # Migration logic
        print("Migrating payment types to accounts...")
        try:
            with open(PAYMENT_TYPES_FILE, 'r') as f:
                payment_types = json.load(f)
                ACCOUNTS = [Account(name=pt, initial_balance=0.0) for pt in payment_types]
            save_accounts()
            # Optional: Rename/Delete old file after successful migration? Keeping it for safety now.
            # os.rename(PAYMENT_TYPES_FILE, PAYMENT_TYPES_FILE + ".bak") 
        except Exception as e:
            print(f"Error migrating payment types: {e}")
            ACCOUNTS = []
    else:
        # Default accounts if nothing exists
        defaults = ['Deutsche Bank', 'Wise', 'Paypal', 'Cash', 'Revolut']
        ACCOUNTS = [Account(name=name, initial_balance=0.0) for name in defaults]
        save_accounts()

def save_accounts():
    with open(ACCOUNTS_FILE, 'w') as f:
        json.dump([acc.dict() for acc in ACCOUNTS], f, indent=2)

# Load accounts on startup
load_accounts()

class Transaction(BaseModel):
    DATE: str
    MERCHANT: str
    CATEGORY: str
    PAYMENT: str
    PRICE: float

class MergeRequest(BaseModel):
    transactions: List[Transaction]

class MappingUpdate(BaseModel):
    merchant: str
    category: str
    old_merchant: str | None = None

class AccountUpdate(BaseModel):
    old_name: Optional[str] = None
    new_name: str
    initial_balance: float
    currency: str = "EUR"

class MasterUpdate(BaseModel):
    index: int
    DATE: str
    MERCHANT: str
    CATEGORY: str
    PRICE: float
    PAYMENT: str

class MasterAdd(BaseModel):
    DATE: str
    MERCHANT: str
    CATEGORY: str
    PRICE: float
    PAYMENT: str

class DeleteRequest(BaseModel):
    indices: List[int]

class MappingBulkDeleteRequest(BaseModel):
    merchants: List[str]

@app.get("/mappings")
async def get_mappings():
    return processor.load_mappings()

def get_account_balance(account_name: str, initial_balance: float) -> float:
    if not os.path.exists(OUTPUT_FILE):
        return initial_balance
    
    try:
        df = pd.read_excel(OUTPUT_FILE)
        # Filter transactions for this account
        account_txns = df[df['PAYMENT'] == account_name]
        
        # Calculate sum of PRICE (assuming PRICE is signed float)
        # Need to ensure PRICE is numeric
        total_transaction_value = pd.to_numeric(account_txns['PRICE'], errors='coerce').sum()
        
        return initial_balance + total_transaction_value
    except Exception as e:
        print(f"Error calculating balance for {account_name}: {e}")
        return initial_balance

@app.get("/accounts")
async def get_accounts():
    # Return accounts with current calculated balance
    response_data = []
    for acc in ACCOUNTS:
        current_bal = get_account_balance(acc.name, acc.initial_balance)
        acc_dict = acc.dict()
        acc_dict['current_balance'] = current_bal
        response_data.append(acc_dict)
    return response_data

@app.post("/accounts")
async def add_or_update_account(update: AccountUpdate):
    global ACCOUNTS
    
    # Check if duplicate name (exclude self if updating)
    if any(acc.name == update.new_name and acc.name != update.old_name for acc in ACCOUNTS):
        raise HTTPException(status_code=400, detail=f"Account '{update.new_name}' already exists.")

    if update.old_name:
        # Update existing
        account = next((acc for acc in ACCOUNTS if acc.name == update.old_name), None)
        if not account:
            raise HTTPException(status_code=404, detail=f"Account '{update.old_name}' not found.")
        
        # If name changed, we need to update transactions and mappings? 
        # For now, let's just update the Account definition. 
        # Ideally, we should update the Master File (Final_Statement.xlsx) to reflect the new Payment method name.
        if update.old_name != update.new_name:
             if os.path.exists(OUTPUT_FILE):
                try:
                    df = pd.read_excel(OUTPUT_FILE)
                    df.loc[df['PAYMENT'] == update.old_name, 'PAYMENT'] = update.new_name
                    df.to_excel(OUTPUT_FILE, index=False)
                except Exception as e:
                    print(f"Error updating payment name in master file: {e}")
        
        account.name = update.new_name
        account.initial_balance = update.initial_balance
        account.currency = update.currency
    else:
        # Add new
        new_acc = Account(
            name=update.new_name, 
            initial_balance=update.initial_balance,
            currency=update.currency
        )
        ACCOUNTS.append(new_acc)
    
    save_accounts()
    return {"status": "success", "accounts": await get_accounts()}

@app.delete("/accounts/{account_name}")
async def delete_account(account_name: str):
    global ACCOUNTS
    account = next((acc for acc in ACCOUNTS if acc.name == account_name), None)
    if not account:
        raise HTTPException(status_code=404, detail=f"Account '{account_name}' not found.")
    
    ACCOUNTS.remove(account)
    save_accounts()
    return {"status": "success", "accounts": await get_accounts()}

@app.post("/mappings")
async def update_mapping(update: MappingUpdate):
    try:
        mappings = processor.load_mappings()
        
        # If old_merchant is provided and exists, it's an edit/rename
        if update.old_merchant and update.old_merchant in mappings:
            del mappings[update.old_merchant]
        elif update.old_merchant and update.old_merchant not in mappings:
            # If old_merchant specified but not found, it's likely an error or trying to edit a non-existent mapping
            raise HTTPException(status_code=404, detail=f"Original merchant '{update.old_merchant}' not found for update.")
        
        mappings[processor.clean_merchant_name(update.merchant)] = update.category # Ensure merchant name is cleaned
        with open(processor.MAPPING_FILE, 'w') as f:
            json.dump(mappings, f, indent=2)
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/mappings/bulk_delete")
async def bulk_delete_mappings(request: MappingBulkDeleteRequest):
    try:
        mappings = processor.load_mappings()
        deleted_count = 0
        for merchant in request.merchants:
            # Try raw first, then cleaned
            targets = [merchant, processor.clean_merchant_name(merchant)]
            for t in targets:
                if t in mappings:
                    del mappings[t]
                    deleted_count += 1
                    break
        
        with open(processor.MAPPING_FILE, 'w') as f:
            json.dump(mappings, f, indent=2)
        return {"status": "success", "deleted_count": deleted_count}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/mappings/{merchant}")
async def delete_mapping(merchant: str):
    try:
        mappings = processor.load_mappings()
        # Try raw first, then cleaned
        targets = [merchant, processor.clean_merchant_name(merchant)]
        deleted = False
        for t in targets:
            if t in mappings:
                del mappings[t]
                deleted = True
                break
        
        if deleted:
            with open(processor.MAPPING_FILE, 'w') as f:
                json.dump(mappings, f, indent=2)
            return {"status": "success"}
        return {"status": "success", "info": "Merchant not found in mappings"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/master")
async def get_master_data():
    if not os.path.exists(OUTPUT_FILE):
        return []
    try:
        df = pd.read_excel(OUTPUT_FILE)
        df = df.fillna("")
        return df.to_dict(orient="records")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/master/update")
async def update_master_row(update: MasterUpdate):
    if not os.path.exists(OUTPUT_FILE):
        raise HTTPException(status_code=404, detail="Master file not found")
    try:
        df = pd.read_excel(OUTPUT_FILE)
        if update.index >= len(df) or update.index < 0:
            raise HTTPException(status_code=400, detail="Invalid row index")
        
        # Update values, ensuring merchant name is cleaned
        df.at[update.index, 'DATE'] = update.DATE
        df.at[update.index, 'MERCHANT'] = processor.clean_merchant_name(update.MERCHANT)
        df.at[update.index, 'CATEGORY'] = update.CATEGORY
        df.at[update.index, 'PRICE'] = update.PRICE
        df.at[update.index, 'PAYMENT'] = update.PAYMENT
        
        df.to_excel(OUTPUT_FILE, index=False)
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/master/add")
async def add_master_row(new_row: MasterAdd):
    try:
        # Ensure new row merchant name is cleaned
        cleaned_row_dict = new_row.dict()
        cleaned_row_dict['MERCHANT'] = processor.clean_merchant_name(cleaned_row_dict['MERCHANT'])
        df_new_row = pd.DataFrame([cleaned_row_dict])
        
        if os.path.exists(OUTPUT_FILE):
            master_df = pd.read_excel(OUTPUT_FILE)
            final_df = pd.concat([master_df, df_new_row], ignore_index=True)
        else:
            final_df = df_new_row
            
        final_df.to_excel(OUTPUT_FILE, index=False)
        return {"status": "success", "total_rows": len(final_df)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/master/bulk_delete")
async def bulk_delete_master_rows(request: DeleteRequest):
    if not os.path.exists(OUTPUT_FILE):
        raise HTTPException(status_code=404, detail="Master file not found")
    try:
        df = pd.read_excel(OUTPUT_FILE)
        
        # Sort indices in descending order to avoid issues when dropping
        indices_to_drop = sorted(request.indices, reverse=True)
        
        for index in indices_to_drop:
            if index < 0 or index >= len(df):
                raise HTTPException(status_code=400, detail=f"Invalid row index {index} for deletion")
        
        df = df.drop(indices_to_drop).reset_index(drop=True)
        df.to_excel(OUTPUT_FILE, index=False)
        return {"status": "success", "deleted_count": len(request.indices)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

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

        if create_new_file:
            if not metadata.get("start_date") or not metadata.get("end_date"):
                print(f"Error: Date range metadata missing from statement. Metadata: {metadata}")
                raise HTTPException(status_code=400, detail="Cannot create new file: date range metadata missing from statement.")
            
            try:
                start_date_obj = datetime.strptime(metadata["start_date"], '%Y-%m-%d')
                end_date_obj = datetime.strptime(metadata["end_date"], '%Y-%m-%d')
                start_date_str = start_date_obj.strftime('%Y-%m-%d')
                end_date_str = end_date_obj.strftime('%Y-%m-%d')
                
                # Prepend bank name to the filename
                bank_name = metadata.get("source", "Bank").replace(" ", "_")
                new_filename = f"{bank_name}_Statement_{start_date_str}_to_{end_date_str}.xlsx"
                new_file_path = os.path.join(STATEMENTS_DIR, new_filename)
                
                print(f"Attempting to create new file: {new_file_path}")
                print(f"Start Date: {metadata['start_date']}, End Date: {metadata['end_date']}")
                print(f"Formatted Start Date: {start_date_str}, Formatted End Date: {end_date_str}")

                df.to_excel(new_file_path, index=False)
                print(f"Successfully created new file: {new_file_path}")
                return {
                    "status": "success",
                    "message": f"New file '{new_filename}' created successfully.",
                    "new_filename": new_filename,
                    "metadata": metadata
                }
            except ValueError as ve:
                print(f"ValueError during date parsing or file creation: {ve}. Metadata dates: {metadata.get('start_date')}, {metadata.get('end_date')}")
                raise HTTPException(status_code=500, detail=f"Error processing dates for new file: {ve}")
            except Exception as e:
                print(f"General error during new file creation: {e}")
                raise HTTPException(status_code=500, detail=f"Error creating new file: {e}")
        else:
            # Existing logic for merging
            duplicates = []
            if os.path.exists(OUTPUT_FILE):
                master_df = pd.read_excel(OUTPUT_FILE)
                
                # Simple check: Date + Merchant + Price
                for _, row in df.iterrows():
                    is_dup = not master_df[
                        (master_df['DATE'] == row['DATE']) & 
                        (master_df['MERCHANT'] == row['MERCHANT']) & 
                        (master_df['PRICE'] == row['PRICE'])
                    ].empty
                    duplicates.append(is_dup)
            else:
                # If no master file, everything is new
                duplicates = [False] * len(df)
            
            df['is_duplicate'] = duplicates
            
            return {
                "metadata": metadata,
                "transactions": df.to_dict(orient="records"),
                "categories": CATEGORIES,
                "accounts": [acc.name for acc in ACCOUNTS] # Return account names for review page
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/merge")
async def merge_transactions(request: MergeRequest):
    try:
        new_df = pd.DataFrame([t.dict() for t in request.transactions])
        
        # Backup existing file
        if os.path.exists(OUTPUT_FILE):
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            backup_path = os.path.join(BACKUP_DIR, f"Final_Statement_{timestamp}.xlsx")
            shutil.copy2(OUTPUT_FILE, backup_path)
            
            master_df = pd.read_excel(OUTPUT_FILE)
            final_df = pd.concat([master_df, new_df], ignore_index=True)
        else:
            final_df = new_df
            
        final_df.to_excel(OUTPUT_FILE, index=False)
        return {"status": "Success", "total_rows": len(final_df)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/backups")
async def list_backups():
    if not os.path.exists(BACKUP_DIR):
        return []
    backups = []
    for f in os.listdir(BACKUP_DIR):
        if f.endswith(".xlsx"):
            stats = os.stat(os.path.join(BACKUP_DIR, f))
            backups.append({
                "filename": f,
                "date": datetime.fromtimestamp(stats.st_mtime).strftime("%Y-%m-%d %H:%M:%S"),
                "size": f"{stats.st_size / 1024:.1f} KB"
            })
    return sorted(backups, key=lambda x: x['date'], reverse=True)

@app.get("/backups/{filename}/preview")
async def preview_backup(filename: str):
    try:
        path = os.path.join(BACKUP_DIR, filename)
        if not os.path.exists(path):
            raise HTTPException(status_code=404, detail="Backup not found")
        
        df = pd.read_excel(path)
        # Replace NaN with empty string to ensure JSON serialization
        df = df.fillna("")
        
        # Return first 50 rows for preview
        return df.head(50).to_dict(orient="records")
    except Exception as e:
        print(f"Error previewing backup {filename}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/rollback")
async def rollback(filename: str = None):
    if filename:
        target_path = os.path.join(BACKUP_DIR, filename)
    else:
        backups = sorted([f for f in os.listdir(BACKUP_DIR) if f.endswith(".xlsx")], reverse=True)
        if not backups:
            return {"error": "No backups found"}
        target_path = os.path.join(BACKUP_DIR, backups[0])
        filename = backups[0]
    
    if not os.path.exists(target_path):
        raise HTTPException(status_code=404, detail="Target backup not found")
        
    shutil.copy2(target_path, OUTPUT_FILE)
    return {"status": "Rollback successful", "restored_from": filename}

@app.get("/download")
def download_statement():
    if os.path.exists(OUTPUT_FILE):
        return FileResponse(OUTPUT_FILE, media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', filename="Final_Statement.xlsx")
    return {"error": "No statement generated yet"}