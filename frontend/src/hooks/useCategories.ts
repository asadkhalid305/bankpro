import { useState, useCallback } from 'react';

export const useCategories = () => {
  const [categories, setCategories] = useState<string[]>([]);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await fetch('/api/categories/');
      const data = await response.json();
      setCategories(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    }
  }, []);

  const addCategory = useCallback(async (name: string): Promise<boolean> => {
    if (!name || categories.includes(name)) return false;
    const newCategories = [...categories, name];
    try {
      const response = await fetch('/api/categories/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCategories)
      });
      if (response.ok) {
        await fetchCategories();
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  }, [categories, fetchCategories]);

  const deleteCategory = useCallback(async (name: string): Promise<boolean> => {
    const newCategories = categories.filter(c => c !== name);
    try {
      const response = await fetch('/api/categories/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCategories)
      });
      if (response.ok) {
        await fetchCategories();
        return true;
      }
      return false;
    } catch (error) {
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
