# 🏦 BankPro: Personal Statement Processor

BankPro is a robust, local-first application designed to help you organize your finances by extracting, cleaning, and categorizing transactions from bank statements. It uniquely separates **Physical Reality** (where your money is) from **Logical Reality** (what your money is for).

## 🚀 Key Features

- **Physical vs. Logical Tracking**: Track bank accounts (Deutsche Bank, Wise, TR) separately from your "Buckets" (Main, Kindergeld, Savings).
- **Auto-Learning Categorization**: Correct a transaction's category once, and the app remembers that rule for every future statement you upload.
- **German SEPA Optimization**: Advanced cleaning logic for technical SEPA strings (specifically for Deutsche Bank PDFs).
- **SQLite Source of Truth**: All data is stored locally in a fast, reliable database.
- **Excel Export (V2 Style)**: Download a structured Excel file compatible with your existing financial formulas and dashboards.

---

## 🛠️ Getting Started

### 1. Requirements
- Python 3.10+
- Node.js & npm

### 2. Setup
```bash
# Setup Backend
cd backend
python3 -m venv .venv
source .venv/bin/env/activate  # macOS/Linux
pip install -r requirements.txt

# Setup Frontend
cd ../frontend
npm install
```

### 3. Running the App
Start the Backend:
```bash
cd backend
uvicorn main:app --reload
```

Start the Frontend:
```bash
cd frontend
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 📖 How to Use

1.  **Configure**: Go to **Accounts** and **Buckets** to set up your bank sources and your logical fund purposes.
2.  **Import**: Upload a PDF (Deutsche Bank) or XLSX (Wise) statement.
3.  **Review**:
    *   Verify the **Type** (Income, Expense, or Transfer).
    *   Assign the correct **Bucket** (e.g., move Kindergeld payments to the Kindergeld bucket).
    *   Select the **Category**.
4.  **Confirm**: Click "Confirm & Merge" to commit transactions to your database.
5.  **Dashboard**: View your live Net Worth, Account Balances, and Monthly Spending.

---

## 🔌 Extending to Other Banks

Currently, the parsing logic is optimized for:
- **Deutsche Bank (PDF)**
- **Wise (XLSX)**

### How to add a new bank:
The parsing logic lives in `backend/processor.py`. To add a new bank, you need to define its date and amount patterns.

**The "AI-Vibe" Hack:**
If you want to add a new bank using an AI tool (like ChatGPT or Gemini), use the following prompt:

> "I have a bank statement processor built with Python and `pdfplumber`. I want to add support for a new bank. Here is a sample of the raw text extracted from the PDF: **[PASTE 5-10 LINES OF PDF TEXT HERE]**. Please provide a regex pattern and a Python extraction loop that identifies the **Date**, **Merchant/Description**, and **Amount** for each transaction in this specific format."

Once you have the logic, simply add it as a new function in `processor.py` and update the `upload_file` router in `main.py`.

---

## 🔐 Privacy & Security
This app is designed to run **locally**. Your financial data never leaves your computer. The SQLite database (`processor.db`) stays entirely on your machine.
