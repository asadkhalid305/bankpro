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
  metadata: Metadata;
  transactions: Transaction[];
  categories: string[];
  payment_types: string[];
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
