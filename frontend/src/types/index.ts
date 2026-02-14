export interface Transaction {
  id?: number;
  date: string;
  merchant: string;
  details: string;
  category: string;
  amount: number;
  account: string;
  bucket: string;
  transaction_type: 'EXPENSE' | 'INCOME' | 'TRANSFER';
  raw_merchant?: string;
  payer?: string;
  payee?: string;
  is_manual?: boolean;
  is_duplicate?: boolean;
}

export interface Account {
  name: string;
  initial_balance: number;
  current_balance: number;
  currency?: string;
  bucket: string;
}

export interface Metadata {
  source: string;
  start_date: string;
  end_date: string;
  initial_balance: number | null;
  final_balance: number | null;
}

export interface UploadResponse {
  metadata?: Metadata;
  data?: Transaction[]; 
  message?: string;
  new_filename?: string;
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
  'Shopping', 'Transport', 'Vacation', 'Car', 'Unknown', 'Kindergeld'
];

export const BUCKET_OPTIONS = ['Main', 'Kindergeld', 'Savings'];
export const TYPE_OPTIONS = ['EXPENSE', 'INCOME', 'TRANSFER'];
