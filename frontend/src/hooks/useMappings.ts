import { useState, useCallback } from 'react';
import type { SortConfig } from '../types';

export const useMappings = () => {
  const [mappings, setMappings] = useState<Record<string, string>>({});
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [sortConfig, setSortConfig] = useState<SortConfig<{ merchant: string; category: string }> | null>(null);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

  const fetchMappings = useCallback(async () => {
    try {
      const response = await fetch('/api/mappings');
      const data = await response.json();
      setMappings(data);
    } catch (error) {
      alert("Failed to fetch mappings");
      throw error;
    }
  }, []);

  const getSortedMappings = useCallback(() => {
    let items = Object.entries(mappings).filter(([merchant, category]) => {
      const matchesSearch = merchant.toLowerCase().includes(search.toLowerCase()) ||
                            category.toLowerCase().includes(search.toLowerCase());
      const matchesFilter = categoryFilter === 'All' || category === categoryFilter;
      return matchesSearch && matchesFilter;
    });
    
    if (sortConfig) {
      items.sort((a, b) => {
        const valA = sortConfig.key === 'merchant' ? a[0] : a[1];
        const valB = sortConfig.key === 'merchant' ? b[0] : b[1];
        
        if (valA.toLowerCase() < valB.toLowerCase()) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (valA.toLowerCase() > valB.toLowerCase()) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return items;
  }, [mappings, search, categoryFilter, sortConfig]);

  const addMapping = useCallback(async (merchant: string, category: string): Promise<boolean> => {
     if (!merchant) {
      alert("Merchant name cannot be empty.");
      return false;
    }
    try {
      const response = await fetch('/api/mappings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchant,
          category,
          old_merchant: null
        })
      });
      if (response.ok) {
        await fetchMappings();
        return true;
      } else {
        const errorData = await response.json();
        alert(`Failed to add new mapping: ${errorData.detail || 'Unknown error'}`);
        return false;
      }
    } catch (error) {
      alert("Failed to add new mapping: Network error");
      return false;
    }
  }, [fetchMappings]);

  const updateMapping = useCallback(async (oldMerchant: string | null, newMerchant: string, newCategory: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/mappings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchant: newMerchant,
          category: newCategory,
          old_merchant: oldMerchant
        })
      });
      if (response.ok) {
        await fetchMappings();
        return true;
      } else {
        const errorData = await response.json();
        alert(`Failed to update mapping: ${errorData.detail || 'Unknown error'}`);
        return false;
      }
    } catch (error) {
      alert("Failed to update mapping: Network error");
      return false;
    }
  }, [fetchMappings]);

  const deleteMappings = useCallback(async (merchants: string[]): Promise<boolean> => {
     if (!window.confirm(`Are you sure you want to delete ${merchants.length} mapping(s)?`)) return false;
    try {
      const response = await fetch(`/api/mappings/bulk_delete`, { 
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ merchants })
      });
      if (response.ok) {
        setSelectedRows(new Set());
        await fetchMappings();
        return true;
      } else {
        const errorData = await response.json();
        alert(`Failed to delete mapping(s): ${errorData.detail || 'Unknown error'}`);
        return false;
      }
    } catch (error) {
      alert("Failed to delete mapping(s): Network error");
      return false;
    }
  }, [fetchMappings]);

  const toggleSort = useCallback((key: 'merchant' | 'category') => {
    setSortConfig(current => {
      let direction: 'asc' | 'desc' = 'asc';
      if (current && current.key === key && current.direction === 'asc') {
        direction = 'desc';
      }
      return { key, direction };
    });
  }, []);

  const toggleSelection = useCallback((merchant: string) => {
    setSelectedRows(prev => {
      const newSelection = new Set(prev);
      if (newSelection.has(merchant)) newSelection.delete(merchant);
      else newSelection.add(merchant);
      return newSelection;
    });
  }, []);

  const toggleAllSelection = useCallback((merchants: string[]) => {
    setSelectedRows(prev => {
      if (prev.size === merchants.length && merchants.length > 0) {
        return new Set();
      } else {
        return new Set(merchants);
      }
    });
  }, []);

  return {
    mappings,
    fetchMappings,
    search, setSearch,
    categoryFilter, setCategoryFilter,
    sortConfig, toggleSort,
    selectedRows, toggleSelection, toggleAllSelection,
    getSortedMappings,
    addMapping,
    updateMapping,
    deleteMappings
  };
};
