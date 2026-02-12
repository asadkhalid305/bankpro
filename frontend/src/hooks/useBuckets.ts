import { useState, useCallback } from 'react';

export interface Bucket {
  name: string;
  description?: string;
}

export const useBuckets = () => {
  const [buckets, setBuckets] = useState<Bucket[]>([]);

  const fetchBuckets = useCallback(async () => {
    try {
      const response = await fetch('/api/buckets/');
      const data = await response.json();
      setBuckets(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch buckets:", error);
    }
  }, []);

  const saveBuckets = useCallback(async (newBuckets: Bucket[]): Promise<boolean> => {
    try {
      const response = await fetch('/api/buckets/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBuckets)
      });
      if (response.ok) {
        await fetchBuckets();
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  }, [fetchBuckets]);

  return {
    buckets,
    fetchBuckets,
    saveBuckets
  };
};
