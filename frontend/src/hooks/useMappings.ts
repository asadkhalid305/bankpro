import { useState, useCallback } from 'react';
import type { SortConfig } from '../types';

export interface Mapping {
  pattern: string;
  category: string;
  bucket: string;
}

export const useMappings = () => {
  const [mappings, setMappings] = useState<Mapping[]>([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [sortConfig, setSortConfig] = useState<SortConfig<Mapping> | null>({ key: 'pattern', direction: 'asc' });
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

  const fetchMappings = useCallback(async () => {
    try {
      const response = await fetch('/api/mappings/');
      const data = await response.json();
      setMappings(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch mappings:", error);
    }
  }, []);

  const getSortedMappings = useCallback(() => {
    let items = mappings.filter(m => {
      const matchesSearch = m.pattern.toLowerCase().includes(search.toLowerCase()) ||
                            m.category.toLowerCase().includes(search.toLowerCase());
      const matchesFilter = categoryFilter === 'All' || m.category === categoryFilter;
      return matchesSearch && matchesFilter;
    });
    
    if (sortConfig) {
      items.sort((a, b) => {
        const valA = String(a[sortConfig.key]).toLowerCase();
        const valB = String(b[sortConfig.key]).toLowerCase();
        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return items;
  }, [mappings, search, categoryFilter, sortConfig]);

  const addMapping = useCallback(async (merchant: string, category: string, bucket: string = "Main"): Promise<boolean> => {
    try {
      const response = await fetch('/api/mappings/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ merchant, category, bucket })
      });
      if (response.ok) {
        await fetchMappings();
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  }, [fetchMappings]);

  const updateMapping = useCallback(async (oldMerchant: string | null, newMerchant: string, newCategory: string, bucket: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/mappings/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchant: newMerchant,
          category: newCategory,
          bucket: bucket,
          old_merchant: oldMerchant
        })
      });
      if (response.ok) {
        await fetchMappings();
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  }, [fetchMappings]);

  const deleteMappings = useCallback(async (merchants: string[]): Promise<boolean> => {
    if (!window.confirm(`Delete ${merchants.length} mapping(s)?`)) return false;
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
      }
      return false;
    } catch (error) {
      return false;
    }
  }, [fetchMappings]);

  const toggleSort = useCallback((key: keyof Mapping) => {
    setSortConfig(current => {
      let direction: 'asc' | 'desc' = 'asc';
      if (current && current.key === key && current.direction === 'asc') {
        direction = 'desc';
      }
      return { key, direction };
    });
  }, []);

  const toggleSelection = useCallback((pattern: string) => {
    setSelectedRows(prev => {
      const newSelection = new Set(prev);
      if (newSelection.has(pattern)) newSelection.delete(pattern);
      else newSelection.add(pattern);
      return newSelection;
    });
  }, []);

  const toggleAllSelection = useCallback((patterns: string[]) => {
    setSelectedRows(prev => {
      if (prev.size === patterns.length && patterns.length > 0) return new Set();
      return new Set(patterns);
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