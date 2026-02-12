import { useState, useCallback } from 'react';
import type { UploadResponse, Transaction } from '../types';
import { api } from '../lib/api';

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
      const data = await api.upload('/upload/', formData);
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
    } catch (error: any) {
      setStatus('error');
      setMessage(error.detail || 'Upload failed');
    }
  }, [file, createNewFile]);

  const mergeTransactions = useCallback(async () => {
    if (!stagedData || !stagedData.data) return;
    setStatus('merging');
    const toMerge = stagedData.data.filter((_, i) => selectedTransactions.includes(i));
    
    try {
      await api.post('/merge', { transactions: toMerge });
      setStatus('success');
      setMessage(`Successfully merged ${toMerge.length} transactions.`);
    } catch (error: any) {
      setStatus('error');
      setMessage(error.detail || 'Merge failed');
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
