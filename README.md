# 🏦 BankPro: Intelligent Financial Engine

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python 3.10+](https://img.shields.io/badge/python-3.10+-blue.svg)](https://www.python.org/downloads/)
[![React 18](https://img.shields.io/badge/React-18-61dafb.svg)](https://reactjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-05998b.svg)](https://fastapi.tiangolo.com/)

**BankPro** is a specialized financial tool designed to solve the "Shadow Accounting" problem. It goes beyond simple transaction tracking by separating your **Physical Reality** (where your money sits) from your **Logical Reality** (what your money is for).

Built for users who manage multiple bank accounts (like Deutsche Bank and Wise) while maintaining complex personal budgets, investment portfolios, and family funds (like Kindergeld).

---

## 💎 Core Philosophy: Physical vs. Logical

Unlike standard banking apps, BankPro uses a dual-ledger system:

1.  **Physical Accounts**: These represent your actual bank accounts (e.g., `Deutsche Bank`, `Wise`, `Cash`). They track the real-world flow of money and balances.
2.  **Logical Buckets**: These represent the *purpose* of the money (e.g., `Main Budget`, `Kindergeld Account`, `Personal Savings`).

**Example**: You receive €250 Kindergeld in your Deutsche Bank account. Physically, the money is in DB. Logically, it belongs to the Kindergeld Bucket. BankPro keeps these worlds perfectly synced without messy manual Excel formulas.

---

## 🚀 Key Features

### 🧠 Auto-Learning Categorization
BankPro features a "Dynamic Brain." When you manually categorize a new merchant during import or edit, the system **automatically creates a rule** in your database. Next time you upload a statement, the categorization is done for you.

### 🧹 German SEPA Optimization
Directly addresses the technical noise in German bank statements. It automatically strips technical SEPA prefixes (`Sepalastschrifteinzugvon`), IBANs, BICs, and legal footers from Deutsche Bank PDFs, leaving you with clean, readable merchant names.

### 📈 Smart Dashboard
- **Net Worth Tracking**: Live aggregate balance across all bank accounts.
- **Bucket Allocation**: Visual progress bars showing how your funds are distributed across purposes.
- **Investment Principal**: Automatically calculates the total value moved into investment accounts.
- **Monthly Activity**: Real-time spending trackers and internal transfer summaries.

### 📥 Excel Engine
Maintains compatibility with your legacy workflows. Export your entire database into a structured Excel format that includes calculated category summaries and internal transfer logs.

---

## 🛠️ Technical Stack

- **Backend**: Python 3.10, FastAPI, Pandas, PDFPlumber, SQLite.
- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Lucide Icons.
- **Persistence**: SQLite (Local DB) + `config_seed.json` (Portable Logic Backup).

---

## 🏁 Getting Started

### 1. Prerequisities
Ensure you have **Python 3.10+** and **Node.js 18+** installed.

### 2. Installation
```bash
# Clone the repository
git clone git@github.com-personal:asadkhalid305/bankpro.git
cd bankpro

# Setup the Backend
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Setup the Frontend
cd ../frontend
npm install
```

### 3. Execution
**Run Backend:**
```bash
cd backend
uvicorn main:app --reload
```

**Run Frontend:**
```bash
cd frontend
npm run dev
```
Navigate to `http://localhost:5173`.

---

## 🔌 Extending to New Banks

The parsing engine is currently optimized for **Deutsche Bank (PDF)** and **Wise (XLSX)**.

### The Extension Pattern
All parsing logic resides in `backend/processor.py`. To add a new bank:
1. Extract raw text using `pdfplumber`.
2. Define a regex pattern for that bank's specific transaction lines.
3. Update the `upload_file` router in `main.py` to recognize the file.

### AI-Accelerated Extension (Recommended)
You can use AI tools (ChatGPT/Gemini) to generate parsing logic for any bank in seconds. Use this specific prompt:

> **"I am using a Python-based financial processor. I need to add support for a new bank PDF layout. Here is a sample of the raw text extracted from the PDF: [PASTE SAMPLE TEXT HERE]. Please write a Python function `process_[BANK_NAME](file_path)` using `pdfplumber` that iterates through pages and uses regex to extract DATE, DESCRIPTION, and AMOUNT into a list of dictionaries."**

---

## 🔐 Privacy by Design
BankPro is **local-first**.
- Your bank statements never leave your machine.
- No cloud accounts or 3rd party API connections are required.
- Your database is a local `.db` file under your control.

---

## 📄 License
Distributed under the MIT License. See `LICENSE` for more information.