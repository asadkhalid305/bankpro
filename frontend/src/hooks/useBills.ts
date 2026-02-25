import { useState, useCallback } from 'react';
import { api } from '../lib/api';

export interface Bill {
  id: number;
  service: string;
  category: string;
  price: number;
  due_day: number;
  is_manual: number;
  payment_account: string;
  status: 'pending' | 'paid' | 'skipped';
  transaction_id?: number;
  paid_at?: string;
}

export const useBills = () => {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBills = useCallback(async (month: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get(`/bills/?month=${month}`);
      setBills(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  const updateBillStatus = async (fixed_expense_id: number, month: string, status: 'pending' | 'paid' | 'skipped', transaction_id?: number) => {
    try {
      await api.post('/bills/status', { fixed_expense_id, month, status, transaction_id });
      
      // Update local state
      setBills(prev => prev.map(b => 
        b.id === fixed_expense_id ? { ...b, status, transaction_id, paid_at: status === 'paid' ? new Date().toISOString() : undefined } : b
      ));
      
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    }
  };

  return {
    bills,
    loading,
    error,
    fetchBills,
    updateBillStatus
  };
};
