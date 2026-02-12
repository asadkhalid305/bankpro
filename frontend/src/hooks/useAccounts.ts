import { useState, useCallback } from 'react';
import type { Account } from '../types/Account';
import { api } from '../lib/api';

export const useAccounts = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);

  const fetchAccounts = useCallback(async () => {
    try {
      const data = await api.get('/accounts/');
      setAccounts(data);
    } catch (error) {
      console.error("Failed to fetch accounts", error);
    }
  }, []);

  const addAccount = useCallback(async (name: string, initialBalance: number, currency: string = 'EUR'): Promise<boolean> => {
    if (!name.trim()) {
      alert("Account name cannot be empty.");
      return false;
    }
    try {
      await api.post('/accounts/', { 
          new_name: name,
          initial_balance: initialBalance,
          currency: currency
      });
      await fetchAccounts();
      return true;
    } catch (error: any) {
      const detail = typeof error.detail === 'object' ? JSON.stringify(error.detail) : error.detail;
      alert(`Failed to add account: ${detail || 'Unknown error'}`);
      return false;
    }
  }, [fetchAccounts]);

  const updateAccount = useCallback(async (oldName: string, newName: string, initialBalance: number, currency: string = 'EUR'): Promise<boolean> => {
     if (!newName.trim()) {
      alert("Account name cannot be empty.");
      return false;
    }
    try {
      await api.post('/accounts/', { 
          old_name: oldName, 
          new_name: newName,
          initial_balance: initialBalance,
          currency: currency
      });
      await fetchAccounts();
      return true;
    } catch (error: any) {
      const detail = typeof error.detail === 'object' ? JSON.stringify(error.detail) : error.detail;
      alert(`Failed to update account: ${detail || 'Unknown error'}`);
      return false;
    }
  }, [fetchAccounts]);

  const deleteAccount = useCallback(async (name: string): Promise<boolean> => {
     if (!window.confirm(`Are you sure you want to delete account '${name}'?`)) return false;
    try {
      await api.delete(`/accounts/${encodeURIComponent(name)}`);
      await fetchAccounts();
      return true;
    } catch (error: any) {
      const detail = typeof error.detail === 'object' ? JSON.stringify(error.detail) : error.detail;
      alert(`Failed to delete account: ${detail || 'Unknown error'}`);
      return false;
    }
  }, [fetchAccounts]);

  return {
    accounts,
    fetchAccounts,
    addAccount,
    updateAccount,
    deleteAccount
  };
};
