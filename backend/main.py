from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
import shutil
import os
import json
import processor
import pandas as pd
from datetime import datetime
from pydantic import BaseModel
from typing import List

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
BACKUP_DIR = os.path.join(UPLOAD_DIR, "backups")
OUTPUT_FILE = os.path.join(UPLOAD_DIR, "Final_Statement.xlsx")

os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(BACKUP_DIR, exist_ok=True)

CATEGORIES = ['Benefit', 'Bill', 'Conversion', 'Dependant', 'Extra', 'Food & Outing', 'Gifts', 'Grocery', 'Investment', 'Medical', 'Office', 'Salary', 'Shopping', 'Transport', 'Vacation', 'Car', 'Unknown']

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
    old_merchant: str = None

@app.get("/mappings")
async def get_mappings():
    return processor.load_mappings()

@app.post("/mappings")
async def update_mapping(update: MappingUpdate):
    try:
        mappings = processor.load_mappings()
        # If renaming a merchant, remove the old key
        if update.old_merchant and update.old_merchant in mappings:
            del mappings[update.old_merchant]
        
        mappings[update.merchant] = update.category
        with open(processor.MAPPING_FILE, 'w') as f:
            json.dump(mappings, f, indent=2)
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/mappings/{merchant}")
async def delete_mapping(merchant: str):
    try:
        mappings = processor.load_mappings()
        if merchant in mappings:
            del mappings[merchant]
            with open(processor.MAPPING_FILE, 'w') as f:
                json.dump(mappings, f, indent=2)
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/upload/")
async def upload_file(file: UploadFile = File(...)):
    try:
        temp_file_path = os.path.join(UPLOAD_DIR, file.filename)
        with open(temp_file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        if file.filename.lower().endswith('.pdf'):
            df, metadata = processor.process_pdf(temp_file_path)
        elif file.filename.lower().endswith('.xlsx'):
            df, metadata = processor.process_excel(temp_file_path)
        else:
            raise HTTPException(status_code=400, detail="Unsupported file type")
            
        # Check for duplicates against master file
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
            "categories": CATEGORIES
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/merge")
async def merge_transactions(request: MergeRequest):
    try:
        new_df = pd.DataFrame([t.dict() for t in request.transactions])
        
        # Learn from user: Save category mappings
        for _, row in new_df.iterrows():
            if row['CATEGORY'] != 'Unknown':
                processor.save_mapping(row['MERCHANT'], row['CATEGORY'])
        
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
