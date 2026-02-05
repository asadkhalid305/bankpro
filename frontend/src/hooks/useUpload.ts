import { useState, useCallback } from 'react';
import type { UploadResponse, Transaction } from '../types';

export const useUpload = () => {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'review' | 'merging' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [stagedData, setStagedData] = useState<UploadResponse | null>(null);
  const [selectedTransactions, setSelectedTransactions] = useState<number[]>([]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setStatus('idle');
      setMessage('');
      setStagedData(null);
    }
  }, []);

  const uploadFile = useCallback(async () => {
    if (!file) return;
    setStatus('uploading');
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload/', { method: 'POST', body: formData });
      const data = await response.json();
      if (response.ok) {
        setStagedData(data);
        setStatus('review');
        setFile(null); // Clear file input state in React
        // Note: Clearing the actual DOM element needs to happen in the UI component
        
        const nonDups = data.transactions
          .map((t: Transaction, i: number) => t.is_duplicate ? -1 : i)
          .filter((i: number) => i !== -1);
        setSelectedTransactions(nonDups);
      } else {
        setStatus('error');
        setMessage(data.detail || 'Upload failed');
      }
    } catch (error) {
      setStatus('error');
      setMessage('Network error');
    }
  }, [file]);

  const mergeTransactions = useCallback(async () => {
    if (!stagedData) return;
    setStatus('merging');
    const toMerge = stagedData.transactions.filter((_, i) => selectedTransactions.includes(i));
    
    try {
      const response = await fetch('/api/merge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactions: toMerge })
      });
      const data = await response.json();
      if (response.ok) {
        setStatus('success');
        setMessage(`Successfully merged ${toMerge.length} transactions.`);
      } else {
        setStatus('error');
        setMessage(data.detail || 'Merge failed');
      }
    } catch (error) {
      setStatus('error');
      setMessage('Merge failed');
    }
  }, [stagedData, selectedTransactions]);

  const updateCategory = useCallback((index: number, newCategory: string) => {
    if (!stagedData) return;
    setStagedData(prev => {
        if (!prev) return null;
        const updatedTransactions = [...prev.transactions];
        updatedTransactions[index] = { ...updatedTransactions[index], CATEGORY: newCategory };
        return { ...prev, transactions: updatedTransactions };
    });
  }, [stagedData]);

  const toggleTransactionSelection = useCallback((index: number) => {
    setSelectedTransactions(prev => 
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  }, []);

  const toggleAllTransactions = useCallback(() => {
    if (!stagedData) return;
    if (selectedTransactions.length === stagedData.transactions.length) {
        setSelectedTransactions([]);
    } else {
        setSelectedTransactions(stagedData.transactions.map((_, i) => i));
    }
  }, [stagedData, selectedTransactions]);

  const resetStatus = useCallback(() => {
      setStatus('idle');
  }, []);

  return {
    file,
    status,
    message,
    stagedData,
    selectedTransactions,
    handleFileChange,
    uploadFile,
    mergeTransactions,
    updateCategory,
    toggleTransactionSelection,
    toggleAllTransactions,
    resetStatus
  };
};
