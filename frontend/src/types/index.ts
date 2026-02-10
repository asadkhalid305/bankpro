export interface Transaction {
  DATE: string;
  MERCHANT: string;
  CATEGORY: string;
  PAYMENT: string;
  PRICE: number;
  is_duplicate?: boolean;
  originalIndex?: number; // Added for master data editing
}

export interface Metadata {
  source: string;
  start_date: string;
  end_date: string;
  initial_balance: number | null;
  final_balance: number | null;
}

export interface UploadResponse {
  metadata?: Metadata; // Make optional for new file creation
  transactions?: Transaction[]; // Make optional for new file creation
  categories?: string[]; // Make optional for new file creation
  accounts?: string[]; // Corrected from payment_types to accounts, and made optional
  message?: string; // New: For success message when creating a new file
  new_filename?: string; // New: For filename when creating a new file
}

export interface Backup {
  filename: string;
  date: string;
  size: string;
}

export interface SortConfig<T> {
  key: keyof T;
  direction: 'asc' | 'desc';
}

export const CATEGORY_OPTIONS = [
  'Benefit', 'Bill', 'Conversion', 'Dependant', 'Extra', 'Food & Outing', 
  'Gifts', 'Grocery', 'Investment', 'Medical', 'Office', 'Salary', 
  'Shopping', 'Transport', 'Vacation', 'Car', 'Unknown'
];
