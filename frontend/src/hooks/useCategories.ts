import { useState, useCallback } from 'react';
import { api } from '../lib/api';

export const useCategories = () => {
  const [categories, setCategories] = useState<string[]>([]);

  const fetchCategories = useCallback(async () => {
    try {
      const data = await api.get('/categories/');
      setCategories(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    }
  }, []);

  const addCategory = useCallback(async (name: string): Promise<boolean> => {
    if (!name || categories.includes(name)) return false;
    const newCategories = [...categories, name];
    try {
      await api.post('/categories/', newCategories);
      await fetchCategories();
      return true;
    } catch (error) {
      console.error("Failed to add category:", error);
      return false;
    }
  }, [categories, fetchCategories]);

  const deleteCategory = useCallback(async (name: string): Promise<boolean> => {
    const newCategories = categories.filter(c => c !== name);
    try {
      await api.post('/categories/', newCategories);
      await fetchCategories();
      return true;
    } catch (error) {
      console.error("Failed to delete category:", error);
      return false;
    }
  }, [categories, fetchCategories]);

  return {
    categories,
    fetchCategories,
    addCategory,
    deleteCategory
  };
};