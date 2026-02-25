import sys
import pandas as pd
import pdfplumber
import re
import os
import json
import sqlite3
from datetime import datetime

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, 'processor.db')

USER_NAME = "Asad Ullah Khalid"

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def clean_currency(s):
    if isinstance(s, (int, float)):
        return float(s)
    s = str(s).strip()
    last_comma = s.rfind(',')
    last_dot = s.rfind('.')
    if last_comma != -1 and last_dot != -1:
        if last_comma > last_dot:
            s = s.replace('.', '').replace(',', '.')
        else:
            s = s.replace(',', '')
    elif last_comma != -1:
        s = s.replace(',', '.')
    s = re.sub(r'[^\d.-]', '', s)
    try:
        return float(s)
    except ValueError:
        return 0.0

def clean_merchant_name(text):
    if not text: return ""
    match = re.search(r'(?:von|an|aus)\s+(.*?)\s+(?:IBAN|BIC|PaymentReference|Creditor-Id|Mand-Id|E2E-Ref)', text, re.IGNORECASE)
    if match:
        text = match.group(1).strip()
    else:
        text = re.sub(r'^(Sepalastschrifteinzugvon|Sepaüberweisungan|Sepaüberweisungvon|Sepaechtzeitüberweisungan|Sepaechtzeitüberweisungvon|Sepadauerauftragan)\s*', '', text, flags=re.IGNORECASE)

    noise_patterns = [
        r'IBAN[A-Z0-9\s]{15,35}', 
        r'BIC[A-Z0-9\s]{8,15}',
        r'PaymentReference/E2E-Ref\.',
        r'E2E-Ref\.',
        r'Creditor-Id\.',
        r'Mand-Id',
        r'OTHRSonst\.Transakt\.',
        r'RCURWiederholungslastschrift',
        r'RINPDauerauftrag',
        r'Kd-Nr\.', r'Rg-Nr\.',
        r'Niederlassung Deutschland',
        r'Branchnumber', r'Accountnumber', r'Newbalance',
        r'92115202/00900560/3000000000'
    ]
    for pattern in noise_patterns:
        text = re.sub(pattern, ' ', text, flags=re.IGNORECASE)

    text = re.sub(r'[A-Z]{2}\d{2}[A-Z0-9]{11,30}', ' ', text)
    text = re.sub(r'\d{8,}', ' ', text)
    text = re.sub(r'[^\w\s\.\-]', ' ', text)
    text = re.sub(r'\s+', ' ', text).strip()
    if len(text) > 50:
        text = text[:47] + "..."
    return text.title()

def extract_details(text):
    if not text: return ""
    # Look for reference part in SEPA strings
    # Usually after 'Ref.' or 'Reference'
    ref_match = re.search(r'(?:PaymentReference/E2E-Ref\.|E2E-Ref\.|Ref\.)\s*(.*?)(?:\s+Creditor-Id|\s+Mand-Id|\s+RCUR|\s+OTHR|\s+BIC|$)', text, re.IGNORECASE)
    if ref_match:
        details = ref_match.group(1).strip()
        # Clean up some common noise from details
        details = re.sub(r'IBAN[A-Z0-9\s]{15,35}', '', details, flags=re.IGNORECASE)
        details = re.sub(r'\s+', ' ', details).strip()
        return details[:100] # Limit length
    return ""

def get_category_from_db(raw_merchant):
    if not raw_merchant: return "Unknown", "Main"
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT pattern, category, bucket FROM mappings")
    mappings = cursor.fetchall()
    conn.close()
    m_lower = raw_merchant.lower()
    sorted_mappings = sorted(mappings, key=lambda x: len(x['pattern']), reverse=True)
    for m in sorted_mappings:
        if m['pattern'].lower() in m_lower:
            return m['category'], m['bucket']
    return "Unknown", "Main"

def identify_transaction_type(merchant, amount, payer=None, payee=None):
    combined_names = f"{merchant} {payer or ''} {payee or ''}".lower()
    
    # Check for user's full name or significant parts
    user_full_name = USER_NAME.lower()
    # Only match if full name is found or at least "First Last"
    tokens = user_full_name.split()
    if len(tokens) >= 2:
        first_last = f"{tokens[0]} {tokens[-1]}"
        if user_full_name in combined_names or first_last in combined_names:
            return "TRANSFER"
            
    # Check for specific transfer indicators
    transfer_keywords = ["umbebuchung", "internal transfer", "kontoübertrag", "self transfer"]
    if any(kw in combined_names for kw in transfer_keywords):
        return "TRANSFER"
        
    return "INCOME" if amount > 0 else "EXPENSE"

def process_excel(file_path):
    df = pd.read_excel(file_path)
    metadata = {"source": "Wise", "start_date": None, "end_date": None}
    if 'Date' in df.columns:
        dates = pd.to_datetime(df['Date'])
        metadata["start_date"] = dates.min().strftime('%Y-%m-%d')
        metadata["end_date"] = dates.max().strftime('%Y-%m-%d')

    processed_data = []
    for _, row in df.iterrows():
        raw_merchant = str(row.get('Merchant', row.get('Payee Name', row.get('Description', ''))))
        merchant = clean_merchant_name(raw_merchant)
        # For Wise, Description or Reference often has the details
        details = str(row.get('Description', row.get('Reference', '')))
        if details == raw_merchant: details = "" # Avoid redundancy
        
        amount = float(row.get('Amount', 0))
        category, bucket = get_category_from_db(raw_merchant)
        t_type = identify_transaction_type(raw_merchant, amount)
        if t_type == "TRANSFER" and category == "Unknown":
            category = "Conversion"
        if "kindergeld" in raw_merchant.lower(): bucket = "Kindergeld"

        processed_data.append({
            'date': pd.to_datetime(row['Date']).strftime('%Y-%m-%d') if 'Date' in row else None,
            'merchant': merchant,
            'details': details,
            'raw_merchant': raw_merchant,
            'amount': amount,
            'account': 'Wise',
            'bucket': bucket,
            'transaction_type': t_type,
            'category': category,
            'payer': row.get('Payer Name', None),
            'payee': row.get('Payee Name', None)
        })
    return pd.DataFrame(processed_data), metadata

def process_pdf(file_path):
    transactions = []
    metadata = {"source": "Deutsche Bank", "start_date": None, "end_date": None}
    with pdfplumber.open(file_path) as pdf:
        for page in pdf.pages:
            text = page.extract_text()
            if not text: continue
            lines = text.split('\n')
            date_start_pattern = re.compile(r'^(\d{2}-\d{2}-)\s+(\d{2}-\d{2}-)\s+(.*?)\s+([-+]?[\d,.]+)$')
            current_transaction = None
            for line in lines:
                match = date_start_pattern.match(line)
                if match:
                    if current_transaction: transactions.append(current_transaction)
                    current_transaction = {'date_part': match.group(1), 'item_lines': [match.group(3)], 'amount': clean_currency(match.group(4)), 'year': None}
                    continue
                if current_transaction and not current_transaction['year']:
                    year_match = re.match(r'^(\d{4})\s+(\d{4})', line)
                    if year_match:
                        current_transaction['year'] = year_match.group(1)
                        rest = line[len(year_match.group(0)):].strip()
                        if rest: current_transaction['item_lines'].append(rest)
                        continue
                if current_transaction:
                    if any(x in line for x in ["Account statement", "Page", "Deutsche Bank"]): continue
                    current_transaction['item_lines'].append(line)
            if current_transaction: transactions.append(current_transaction)

    processed_data = []
    for t in transactions:
        year = t['year'] or datetime.now().strftime('%Y')
        day, month = t['date_part'].split('-')[:2]
        full_date = f"{year}-{month}-{day}"
        raw_merchant = " ".join(t['item_lines'])
        merchant = clean_merchant_name(raw_merchant)
        details = extract_details(raw_merchant)
        
        category, bucket = get_category_from_db(raw_merchant)
        t_type = identify_transaction_type(raw_merchant, t['amount'])
        if t_type == "TRANSFER" and category == "Unknown":
            category = "Conversion"
        if "kindergeld" in raw_merchant.lower(): bucket = "Kindergeld"

        processed_data.append({
            'date': full_date,
            'merchant': merchant,
            'details': details,
            'raw_merchant': raw_merchant,
            'amount': t['amount'],
            'account': 'Deutsche Bank',
            'bucket': bucket,
            'transaction_type': t_type,
            'category': category,
            'payer': None, 'payee': None
        })
    df = pd.DataFrame(processed_data)
    if not df.empty:
        metadata["start_date"] = df['date'].min()
        metadata["end_date"] = df['date'].max()
    return df, metadata

def save_to_db(df, original_file=None):
    conn = get_db_connection()
    cursor = conn.cursor()
    for _, row in df.iterrows():
        try:
            cursor.execute('''
                INSERT INTO transactions (date, merchant, details, raw_merchant, amount, account, bucket, transaction_type, category, payer, payee, original_file)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(date, merchant, amount, account) DO NOTHING
            ''', (row['date'], row['merchant'], row.get('details', ''), row['raw_merchant'], row['amount'], row['account'], row['bucket'], row['transaction_type'], row['category'], row.get('payer'), row.get('payee'), original_file))
            if row['category'] != "Unknown":
                cursor.execute('''
                    INSERT INTO mappings (pattern, category, bucket) VALUES (?, ?, ?)
                    ON CONFLICT(pattern) DO UPDATE SET category = EXCLUDED.category, bucket = EXCLUDED.bucket
                ''', (row['merchant'], row['category'], row['bucket']))
        except Exception as e:
            print(f"Error saving row: {e}")
    conn.commit()
    conn.close()
