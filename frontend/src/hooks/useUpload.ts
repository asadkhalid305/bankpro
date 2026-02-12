import { useState, useCallback } from 'react';
import type { UploadResponse, Transaction } from '../types';

export const useUpload = () => {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'review' | 'merging' | 'success' | 'error' | 'new_file_created'>('idle');
  const [message, setMessage] = useState('');
  const [stagedData, setStagedData] = useState<UploadResponse | null>(null);
  const [selectedTransactions, setSelectedTransactions] = useState<number[]>([]);
  const [createNewFile, setCreateNewFile] = useState(false);

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
    formData.append('create_new_file', createNewFile ? 'true' : 'false');

    try {
      const response = await fetch('/api/upload/', { method: 'POST', body: formData });
      const data = await response.json();
      if (response.ok) {
        if (createNewFile) {
          setStatus('new_file_created');
          setMessage(data.message || `File created successfully.`);
        } else {
          setStagedData(data);
          setStatus('review');
          setFile(null);
          
          if (data.data) {
            const nonDups = data.data
              .map((t: Transaction, i: number) => t.is_duplicate ? -1 : i)
              .filter((i: number) => i !== -1);
            setSelectedTransactions(nonDups);
          }
        }
      } else {
        setStatus('error');
        setMessage(data.detail || 'Upload failed');
      }
    } catch (error) {
      setStatus('error');
      setMessage('Network error');
    }
  }, [file, createNewFile]);

  const mergeTransactions = useCallback(async () => {
    if (!stagedData || !stagedData.data) return;
    setStatus('merging');
    const toMerge = stagedData.data.filter((_, i) => selectedTransactions.includes(i));
    
    try {
      const response = await fetch('/api/merge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactions: toMerge })
      });
      if (response.ok) {
        setStatus('success');
        setMessage(`Successfully merged ${toMerge.length} transactions.`);
      } else {
        const data = await response.json();
        setStatus('error');
        setMessage(data.detail || 'Merge failed');
      }
    } catch (error) {
      setStatus('error');
      setMessage('Merge failed');
    }
  }, [stagedData, selectedTransactions]);

  const updateCategory = useCallback((index: number, newCategory: string) => {
    if (!stagedData || !stagedData.data) return;
    setStagedData(prev => {
        if (!prev || !prev.data) return null;
        const updatedTransactions = [...prev.data];
        updatedTransactions[index] = { ...updatedTransactions[index], category: newCategory };
        return { ...prev, data: updatedTransactions };
    });
  }, [stagedData]);

  const updateBucket = useCallback((index: number, newBucket: string) => {
    if (!stagedData || !stagedData.data) return;
    setStagedData(prev => {
        if (!prev || !prev.data) return null;
        const updatedTransactions = [...prev.data];
        updatedTransactions[index] = { ...updatedTransactions[index], bucket: newBucket };
        return { ...prev, data: updatedTransactions };
    });
  }, [stagedData]);

  const updateType = useCallback((index: number, newType: 'EXPENSE' | 'INCOME' | 'TRANSFER') => {
    if (!stagedData || !stagedData.data) return;
    setStagedData(prev => {
        if (!prev || !prev.data) return null;
        const updatedTransactions = [...prev.data];
        updatedTransactions[index] = { ...updatedTransactions[index], transaction_type: newType };
        return { ...prev, data: updatedTransactions };
    });
  }, [stagedData]);

  const toggleTransactionSelection = useCallback((index: number) => {
    setSelectedTransactions(prev => 
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  }, []);

  const toggleAllTransactions = useCallback(() => {
    if (!stagedData || !stagedData.data) return;
    if (selectedTransactions.length === stagedData.data.length) {
        setSelectedTransactions([]);
    } else {
        setSelectedTransactions(stagedData.data.map((_, i) => i));
    }
  }, [stagedData, selectedTransactions]);

  const resetStatus = useCallback(() => {
      setStatus('idle');
      setFile(null);
      setStagedData(null);
      setSelectedTransactions([]);
      setMessage('');
      setCreateNewFile(false);
  }, []);

  return {
    file,
    status,
    message,
    stagedData,
    selectedTransactions,
    createNewFile,
    handleFileChange,
    uploadFile,
    mergeTransactions,
    updateCategory,
    updateBucket,
    updateType,
    toggleTransactionSelection,
    toggleAllTransactions,
    resetStatus,
    setCreateNewFile
  };
};