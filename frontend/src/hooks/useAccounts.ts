import { useState, useCallback } from 'react';
import type { Account } from '../types/Account';

export const useAccounts = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);

  const fetchAccounts = useCallback(async () => {
    try {
      const response = await fetch('/api/accounts');
      const data = await response.json();
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
      const response = await fetch('/api/accounts/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            new_name: name,
            initial_balance: initialBalance,
            currency: currency
        })
      });
      if (response.ok) {
        await fetchAccounts();
        return true;
      } else {
        const errorData = await response.json();
        const detail = typeof errorData.detail === 'object' ? JSON.stringify(errorData.detail) : errorData.detail;
        alert(`Failed to add account: ${detail || 'Unknown error'}`);
        return false;
      }
    } catch (error) {
      alert("Failed to add account: Network error");
      return false;
    }
  }, [fetchAccounts]);

  const updateAccount = useCallback(async (oldName: string, newName: string, initialBalance: number, currency: string = 'EUR'): Promise<boolean> => {
     if (!newName.trim()) {
      alert("Account name cannot be empty.");
      return false;
    }
    try {
      const response = await fetch('/api/accounts/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            old_name: oldName, 
            new_name: newName,
            initial_balance: initialBalance,
            currency: currency
        })
      });
      if (response.ok) {
        await fetchAccounts();
        return true;
      } else {
        const errorData = await response.json();
        const detail = typeof errorData.detail === 'object' ? JSON.stringify(errorData.detail) : errorData.detail;
        alert(`Failed to update account: ${detail || 'Unknown error'}`);
        return false;
      }
    } catch (error) {
      alert("Failed to update account: Network error");
      return false;
    }
  }, [fetchAccounts]);

  const deleteAccount = useCallback(async (name: string): Promise<boolean> => {
     if (!window.confirm(`Are you sure you want to delete account '${name}'?`)) return false;
    try {
      const response = await fetch(`/api/accounts/${encodeURIComponent(name)}`, { method: 'DELETE' });
      if (response.ok) {
        await fetchAccounts();
        return true;
      } else {
        const errorData = await response.json();
        const detail = typeof errorData.detail === 'object' ? JSON.stringify(errorData.detail) : errorData.detail;
        alert(`Failed to delete account: ${detail || 'Unknown error'}`);
        return false;
      }
    } catch (error) {
      alert("Failed to delete account: Network error");
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