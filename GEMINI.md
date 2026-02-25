# BankPro - Bank Statement Processor

Monorepo for the BankPro application, a tool designed to process bank statements into a standardized format and manage personal finances.

## Project Overview

BankPro consists of a Python FastAPI backend and a React frontend. The primary goal is to provide a local n8n automation for processing bank statements into a standardized Excel format. It allows users to upload bank statements, categorize transactions, and manage accounts and buckets.

## Tech Stack

### Backend

- **Framework:** FastAPI (Python)
- **Database:** SQLite (`processor.db`)
- **Logic:** Custom processing engine in `processor.py`
- **Entry Point:** `backend/main.py`
- **Key Libraries:** `pandas`, `pydantic`, `sqlite3`

### Frontend

- **Framework:** React 19 (TypeScript)
- **Build Tool:** Vite
- **Styling:** Tailwind CSS v4, `tailwindcss-animate`
- **Icons:** Lucide React
- **UI Components:** Custom components based on Shadcn/UI patterns (using `class-variance-authority`, `clsx`, `tailwind-merge`)
- **Routing:** React Router 7

## Directory Structure

- `backend/`: FastAPI application, database logic, and file storage.
  - `files/`: Storage for uploads, statements, and backups.
  - `processor.py`: Core transaction processing logic.
- `frontend/`: Vite-based React application.
  - `src/components/ui/`: Reusable UI components.
  - `src/features/`: Feature-specific components and logic.
  - `src/hooks/`: Custom React hooks for API interaction.
  - `src/lib/api.ts`: API client configuration.

## Development Guidelines

- **API Connection:** Ensure the frontend is properly configured to communicate with the FastAPI backend (defaulting to `http://localhost:8000`).
- **Styling:** Follow the existing Tailwind CSS v4 patterns and utility-first approach.
- **Accessibility:** Prioritize keyboard and screen reader accessibility for all UI components.
- **Database:** Use the provided SQLite database structure via `database.py` and `main.py` endpoints.
