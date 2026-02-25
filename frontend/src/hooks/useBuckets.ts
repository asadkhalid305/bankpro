import { useState, useCallback } from 'react';
import { api } from '../lib/api';

export interface Bucket {
  name: string;
  description?: string;
  initial_balance?: number;
}

export const useBuckets = () => {
  const [buckets, setBuckets] = useState<Bucket[]>([]);

  const fetchBuckets = useCallback(async () => {
    try {
      const data = await api.get('/buckets/');
      setBuckets(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch buckets:", error);
    }
  }, []);

  const saveBuckets = useCallback(async (newBuckets: Bucket[]): Promise<boolean> => {
    try {
      await api.post('/buckets/', newBuckets);
      await fetchBuckets();
      return true;
    } catch (error) {
      console.error("Failed to save buckets:", error);
      return false;
    }
  }, [fetchBuckets]);

  return {
    buckets,
    fetchBuckets,
    saveBuckets
  };
};