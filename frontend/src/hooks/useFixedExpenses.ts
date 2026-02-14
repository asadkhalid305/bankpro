import { useState, useCallback } from 'react';
import { api } from '../lib/api';
import { type FixedExpense } from '../types';

export const useFixedExpenses = () => {
  const [expenses, setExpenses] = useState<FixedExpense[]>([]);

  const fetchExpenses = useCallback(async () => {
    try {
      const data = await api.get('/fixed_expenses/');
      setExpenses(data);
    } catch (error) {
      console.error("Failed to fetch fixed expenses:", error);
    }
  }, []);

  const addExpense = useCallback(async (expense: FixedExpense): Promise<boolean> => {
    try {
      await api.post('/fixed_expenses/', expense);
      await fetchExpenses();
      return true;
    } catch (error) {
      console.error("Failed to add fixed expense:", error);
      return false;
    }
  }, [fetchExpenses]);

  const deleteExpense = useCallback(async (id: number): Promise<boolean> => {
    if (!window.confirm("Are you sure you want to remove this recurring expense?")) return false;
    try {
      await api.delete(`/fixed_expenses/${id}`);
      await fetchExpenses();
      return true;
    } catch (error) {
      console.error("Failed to delete fixed expense:", error);
      return false;
    }
  }, [fetchExpenses]);

  return {
    expenses,
    fetchExpenses,
    addExpense,
    deleteExpense
  };
};
