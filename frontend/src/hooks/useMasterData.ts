import { useState, useCallback } from 'react';
import type { Transaction, SortConfig } from '../types';

export const useMasterData = () => {
  const [data, setData] = useState<Transaction[]>([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [accountFilter, setAccountFilter] = useState('All');
  const [bucketFilter, setBucketFilter] = useState('All');
  const [sortConfig, setSortConfig] = useState<SortConfig<Transaction> | null>({ key: 'date', direction: 'desc' });
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());

  const fetchMasterData = useCallback(async () => {
    try {
      const response = await fetch('/api/transactions/');
      const jsonData = await response.json();
      setData(jsonData);
    } catch (error) {
      console.error("Failed to fetch transactions:", error);
    }
  }, []);

  const getFilteredData = useCallback(() => {
    let items = [...data];
    
    items = items.filter(item => 
      (item.merchant.toLowerCase().includes(search.toLowerCase()) ||
       item.category.toLowerCase().includes(search.toLowerCase()) ||
       item.account.toLowerCase().includes(search.toLowerCase())) &&
      (categoryFilter === 'All' || item.category === categoryFilter) &&
      (accountFilter === 'All' || item.account === accountFilter) &&
      (bucketFilter === 'All' || item.bucket === bucketFilter)
    );

    if (sortConfig) {
      items.sort((a, b) => {
        const valA = String(a[sortConfig.key]) || ''; 
        const valB = String(b[sortConfig.key]) || '';
        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return items;
  }, [data, search, categoryFilter, accountFilter, bucketFilter, sortConfig]);

  const addRow = useCallback(async (newRow: Partial<Transaction>): Promise<boolean> => {
    try {
      const response = await fetch('/api/transactions/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRow)
      });
      if (response.ok) {
        await fetchMasterData();
        return true;
      }
      return false;
    } catch (error) {
      console.error("Failed to add transaction:", error);
      return false;
    }
  }, [fetchMasterData]);

  const deleteRows = useCallback(async (ids: number[]): Promise<boolean> => {
    if (!window.confirm(`Delete ${ids.length} transaction(s)?`)) return false;
    try {
      for (const id of ids) {
        await fetch(`/api/transactions/${id}`, { method: 'DELETE' });
      }
      setSelectedRows(new Set());
      await fetchMasterData();
      return true;
    } catch (error) {
      console.error("Failed to delete transactions:", error);
      return false;
    }
  }, [fetchMasterData]);

  const toggleSort = useCallback((key: keyof Transaction) => {
    setSortConfig(current => {
      let direction: 'asc' | 'desc' = 'asc';
      if (current && current.key === key && current.direction === 'asc') {
        direction = 'desc';
      }
      return { key, direction };
    });
  }, []);

  const toggleSelection = useCallback((id: number) => {
    setSelectedRows(prev => {
      const newSelection = new Set(prev);
      if (newSelection.has(id)) newSelection.delete(id);
      else newSelection.add(id);
      return newSelection;
    });
  }, []);

  const toggleAllSelection = useCallback((ids: number[]) => {
    setSelectedRows(prev => {
      if (prev.size === ids.length && ids.length > 0) return new Set();
      return new Set(ids);
    });
  }, []);

  const updateRow = useCallback(async (id: number, updates: Partial<Transaction>): Promise<boolean> => {
    try {
      const response = await fetch('/api/transactions/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates })
      });
      if (response.ok) {
        await fetchMasterData();
        return true;
      }
      return false;
    } catch (error) {
      console.error("Failed to update transaction:", error);
      return false;
    }
  }, [fetchMasterData]);

  return {
    data,
    fetchMasterData,
    search, setSearch,
    categoryFilter, setCategoryFilter,
    accountFilter, setAccountFilter,
    bucketFilter, setBucketFilter,
    sortConfig, toggleSort,
    selectedRows, toggleSelection, toggleAllSelection,
    getFilteredData,
    addRow,
    updateRow,
    deleteRows
  };
};