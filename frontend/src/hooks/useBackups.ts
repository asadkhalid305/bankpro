import { useState, useCallback } from 'react';
import type { Backup, Transaction } from '../types';

export const useBackups = () => {
  const [backups, setBackups] = useState<Backup[]>([]);
  const [previewData, setPreviewData] = useState<Transaction[] | null>(null);
  const [selectedBackup, setSelectedBackup] = useState<string | null>(null);

  const fetchBackups = useCallback(async () => {
    try {
      const response = await fetch('/api/backups');
      const data = await response.json();
      setBackups(data);
    } catch (error) {
      alert("Failed to fetch backups");
    }
  }, []);

  const previewBackup = useCallback(async (filename: string) => {
    try {
      const response = await fetch(`/api/backups/${filename}/preview`);
      const data = await response.json();
      if (response.ok) {
        setPreviewData(data);
        setSelectedBackup(filename);
      } else {
        alert(`Failed to load preview: ${data.detail || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Failed to load preview:", error);
    }
  }, []);

  const restoreBackup = useCallback(async (filename: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/rollback?filename=${filename}`, { method: 'POST' });
      if (response.ok) {
        setPreviewData(null);
        setSelectedBackup(null);
        return true;
      } else {
        const errorData = await response.json();
        alert(`Restore failed: ${errorData.detail || 'Unknown error'}`);
        return false;
      }
    } catch (error) {
      console.error("Failed to restore backup:", error);
      return false;
    }
  }, []);

  const closePreview = useCallback(() => {
    setPreviewData(null);
    setSelectedBackup(null);
  }, []);

  return {
    backups,
    fetchBackups,
    previewData,
    selectedBackup,
    previewBackup,
    restoreBackup,
    closePreview
  };
};
