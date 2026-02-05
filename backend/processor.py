import sys
import pandas as pd
import pdfplumber
import re
import os

TARGET_COLUMNS = ['DATE', 'WHERE', 'CATEGORY', 'PAYMENT', 'PRICE']
OUTPUT_FILE = 'files/Final_Statement.xlsx'

def clean_merchant_name(text):
    if not text: return ""
    
    # 1. Conservative Regex Cleaning (Always runs)
    # Remove IBANs
    text = re.sub(r'[A-Z]{2}\d{2}[A-Z0-9]{11,30}', '', text)
    # Remove common transaction noise like "ID:...", "Ref:...", "Terminal..."
    text = re.sub(r'(ID|REF|TRACE|SEQ|AUTH|TERMINAL|CARD|BATCH|VISA|MC)[:\s]*\d+', '', text, flags=re.IGNORECASE)
    # Remove strings of 6+ numbers (likely reference codes)
    text = re.sub(r'\d{6,}', '', text)
    # Remove common bank prefixes
    text = re.sub(r'^(DIRECT DEBIT|CREDIT TRANSFER|PAYMENT TO|PURCHASE AT)\s+', '', text, flags=re.IGNORECASE)
    # Remove excess special characters and multiple spaces
    text = re.sub(r'[^\w\s\.\-]', ' ', text)
    text = re.sub(r'\s+', ' ', text).strip()
    
    # Optional: You can extend this with a local LLM call here if Ollama is running
    # Example: return call_ollama_cleaner(text)
    
    return text.title()

def process_excel(file_path):
    print(f"Processing Excel: {file_path}")
    df = pd.read_excel(file_path)
    
    # Metadata extraction (Wise specific)
    metadata = {
        "source": "Wise",
        "start_date": None,
        "end_date": None,
        "initial_balance": None,
        "final_balance": None
    }
    
    if 'Date' in df.columns:
        dates = pd.to_datetime(df['Date'])
        metadata["start_date"] = dates.min().strftime('%Y-%m-%d')
        metadata["end_date"] = dates.max().strftime('%Y-%m-%d')

    # Mapping
    new_df = pd.DataFrame(columns=TARGET_COLUMNS)
    if 'Date' in df.columns:
        new_df['DATE'] = pd.to_datetime(df['Date']).dt.strftime('%Y-%m-%d')
    
    def get_where(row):
        if 'Merchant' in row and pd.notna(row['Merchant']): return row['Merchant']
        if 'Payee Name' in row and pd.notna(row['Payee Name']): return row['Payee Name']
        return row.get('Description', '')
        
    new_df['WHERE'] = df.apply(get_where, axis=1).apply(clean_merchant_name)
    new_df['PAYMENT'] = 'Wise'
    new_df['CATEGORY'] = ''
    new_df['PRICE'] = df.get('Amount', 0)
        
    return new_df, metadata

def process_pdf(file_path):
    print(f"Processing PDF: {file_path}")
    transactions = []
    metadata = {
        "source": "Deutsche Bank",
        "start_date": None,
        "end_date": None,
        "initial_balance": None,
        "final_balance": None
    }
    
    with pdfplumber.open(file_path) as pdf:
        full_text = ""
        for page in pdf.pages:
            text = page.extract_text()
            if not text: continue
            full_text += text + "\n"
            lines = text.split('\n')
            
            # ... (Transaction extraction logic remains similar but improved)
            date_start_pattern = re.compile(r'^(\d{2}-\d{2}-)\s+(\d{2}-\d{2}-)\s+(.*?)\s+([-+]?[\d,.]+)$')
            current_transaction = None
            
            for line in lines:
                match = date_start_pattern.match(line)
                if match:
                    if current_transaction: transactions.append(current_transaction)
                    current_transaction = {
                        'date_part': match.group(1),
                        'item_lines': [match.group(3)],
                        'amount': clean_currency(match.group(4)),
                        'year': None
                    }
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

        # Meta extraction from full_text
        # Example: "Balance on 01-10-2025 + 5,000.00"
        balance_matches = re.findall(r'Balance on (\d{2}-\d{2}-\d{4})\s+([+-]?\s*[\d,.]+)', full_text)
        if balance_matches:
            metadata["initial_balance"] = clean_currency(balance_matches[0][1])
            metadata["final_balance"] = clean_currency(balance_matches[-1][1])

    data = []
    for t in transactions:
        year = t['year'] or "2025" # Fallback
        day, month = t['date_part'].split('-')[:2]
        full_date = f"{year}-{month}-{day}"
        data.append({
            'DATE': full_date,
            'WHERE': clean_merchant_name(" ".join(t['item_lines'])),
            'CATEGORY': '',
            'PAYMENT': 'Deutsche Bank',
            'PRICE': t['amount']
        })
    
    df = pd.DataFrame(data)
    if not df.empty:
        metadata["start_date"] = df['DATE'].min()
        metadata["end_date"] = df['DATE'].max()
        
    return df, metadata

def main():
    import glob
    
    # If a specific file is provided, process it.
    if len(sys.argv) > 1:
        files_to_process = [sys.argv[1]]
    else:
        # Otherwise, scan for source files
        print("Scanning 'files/' directory for *source* files...")
        files_to_process = []
        files_to_process.extend(glob.glob('files/*source*.pdf'))
        files_to_process.extend(glob.glob('files/*source*.xlsx'))
        
        if not files_to_process:
            print("No files found matching '*source*' in 'files/' directory.")
            sys.exit(0)

    print(f"Found {len(files_to_process)} files to process.")
    
    all_dfs = []
    
    for file_path in files_to_process:
        try:
            if file_path.lower().endswith('.pdf'):
                df = process_pdf(file_path)
                all_dfs.append(df)
            elif file_path.lower().endswith('.xlsx'):
                df = process_excel(file_path)
                all_dfs.append(df)
            else:
                print(f"Skipping unsupported file: {file_path}")
        except Exception as e:
            print(f"Error processing {file_path}: {e}")

    if not all_dfs:
        print("No data extracted.")
        sys.exit(0)

    # Merge all new data
    new_data_df = pd.concat(all_dfs, ignore_index=True)
    
    # Handle Output
    if os.path.exists(OUTPUT_FILE):
        print(f"Appending to existing {OUTPUT_FILE}")
        try:
            existing_df = pd.read_excel(OUTPUT_FILE)
            final_df = pd.concat([existing_df, new_data_df], ignore_index=True)
        except Exception as e:
            print(f"Error reading existing output file, creating new one: {e}")
            final_df = new_data_df
    else:
        print(f"Creating new {OUTPUT_FILE}")
        final_df = new_data_df
        
    print(f"Writing {len(final_df)} rows to {OUTPUT_FILE}")
    final_df.to_excel(OUTPUT_FILE, index=False)
    print("Done.")

if __name__ == "__main__":
    main()
