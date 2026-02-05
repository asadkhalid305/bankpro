import { useState, useCallback } from 'react';
import type { Transaction, SortConfig } from '../types';

export const useMasterData = () => {
  const [data, setData] = useState<Transaction[]>([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [paymentFilter, setPaymentFilter] = useState('All');
  const [sortConfig, setSortConfig] = useState<SortConfig<Transaction> | null>({ key: 'DATE', direction: 'desc' });
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());

  const fetchMasterData = useCallback(async () => {
    try {
      const response = await fetch('/api/master');
      const jsonData = await response.json();
      setData(jsonData);
    } catch (error) {
      alert("Failed to fetch master data");
      throw error;
    }
  }, []);

  const getFilteredData = useCallback(() => {
    let items = data.map((item, index) => ({ ...item, originalIndex: index }));
    
    items = items.filter(item => 
      (item.MERCHANT.toLowerCase().includes(search.toLowerCase()) ||
       item.CATEGORY.toLowerCase().includes(search.toLowerCase()) ||
       item.PAYMENT.toLowerCase().includes(search.toLowerCase())) &&
      (categoryFilter === 'All' || item.CATEGORY === categoryFilter) &&
      (paymentFilter === 'All' || item.PAYMENT === paymentFilter)
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
  }, [data, search, categoryFilter, paymentFilter, sortConfig]);

  const updateRow = useCallback(async (originalIndex: number, updatedRow: Transaction): Promise<boolean> => {
    try {
      const response = await fetch('/api/master/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          index: originalIndex,
          ...updatedRow
        })
      });
      if (response.ok) {
        await fetchMasterData();
        return true;
      } else {
        const errorData = await response.json();
        alert(`Failed to update master row: ${errorData.detail || 'Unknown error'}`);
        return false;
      }
    } catch (error) {
      alert("Failed to update master row: Network error");
      return false;
    }
  }, [fetchMasterData]);

  const addRow = useCallback(async (newRow: Transaction): Promise<boolean> => {
    if (!newRow.MERCHANT || !newRow.DATE || !newRow.CATEGORY || newRow.PRICE === undefined || newRow.PAYMENT === undefined) {
      alert("Please fill all fields for the new record.");
      return false;
    }
    try {
      const response = await fetch('/api/master/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRow)
      });
      if (response.ok) {
        await fetchMasterData();
        return true;
      } else {
        const errorData = await response.json();
        alert(`Failed to add new master row: ${errorData.detail || 'Unknown error'}`);
        return false;
      }
    } catch (error) {
      alert("Failed to add new master row: Network error");
      return false;
    }
  }, [fetchMasterData]);

  const deleteRows = useCallback(async (indices: number[]): Promise<boolean> => {
     if (!window.confirm(`Are you sure you want to delete ${indices.length} transaction(s) from your master statement?`)) return false;
    try {
      const response = await fetch(`/api/master/bulk_delete`, { 
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ indices })
      });
      if (response.ok) {
        setSelectedRows(new Set());
        await fetchMasterData();
        return true;
      } else {
        const errorData = await response.json();
        alert(`Failed to delete master row(s): ${errorData.detail || 'Unknown error'}`);
        return false;
      }
    } catch (error) {
      alert("Failed to delete master row(s): Network error");
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

  const toggleSelection = useCallback((originalIndex: number) => {
    setSelectedRows(prev => {
      const newSelection = new Set(prev);
      if (newSelection.has(originalIndex)) newSelection.delete(originalIndex);
      else newSelection.add(originalIndex);
      return newSelection;
    });
  }, []);

  const toggleAllSelection = useCallback((filteredIndices: number[]) => {
    setSelectedRows(prev => {
      if (prev.size === filteredIndices.length && filteredIndices.length > 0) {
        return new Set();
      } else {
        return new Set(filteredIndices);
      }
    });
  }, []);

  return {
    data,
    fetchMasterData,
    search, setSearch,
    categoryFilter, setCategoryFilter,
    paymentFilter, setPaymentFilter,
    sortConfig, toggleSort,
    selectedRows, toggleSelection, toggleAllSelection,
    getFilteredData,
    updateRow,
    addRow,
    deleteRows
  };
};
