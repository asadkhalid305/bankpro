import { useState, useCallback } from 'react';

export const usePaymentTypes = () => {
  const [paymentTypes, setPaymentTypes] = useState<string[]>([]);

  const fetchPaymentTypes = useCallback(async () => {
    try {
      const response = await fetch('/api/payment_types');
      const data = await response.json();
      setPaymentTypes(data);
    } catch (error) {
      alert("Failed to fetch payment types");
    }
  }, []);

  const addPaymentType = useCallback(async (newPaymentTypeName: string): Promise<boolean> => {
    if (!newPaymentTypeName.trim()) {
      alert("Payment type name cannot be empty.");
      return false;
    }
    try {
      const response = await fetch('/api/payment_types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ new_name: newPaymentTypeName })
      });
      if (response.ok) {
        await fetchPaymentTypes();
        return true;
      } else {
        const errorData = await response.json();
        alert(`Failed to add payment type: ${errorData.detail || 'Unknown error'}`);
        return false;
      }
    } catch (error) {
      alert("Failed to add payment type: Network error");
      return false;
    }
  }, [fetchPaymentTypes]);

  const updatePaymentType = useCallback(async (oldName: string, newName: string): Promise<boolean> => {
     if (!newName.trim()) {
      alert("Payment type name cannot be empty.");
      return false;
    }
    try {
      const response = await fetch('/api/payment_types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ old_name: oldName, new_name: newName })
      });
      if (response.ok) {
        await fetchPaymentTypes();
        return true;
      } else {
        const errorData = await response.json();
        alert(`Failed to update payment type: ${errorData.detail || 'Unknown error'}`);
        return false;
      }
    } catch (error) {
      alert("Failed to update payment type: Network error");
      return false;
    }
  }, [fetchPaymentTypes]);

  const deletePaymentType = useCallback(async (typeName: string): Promise<boolean> => {
     if (!window.confirm(`Are you sure you want to delete payment type '${typeName}'?`)) return false;
    try {
      const response = await fetch(`/api/payment_types/${encodeURIComponent(typeName)}`, { method: 'DELETE' });
      if (response.ok) {
        await fetchPaymentTypes();
        return true;
      } else {
        const errorData = await response.json();
        alert(`Failed to delete payment type: ${errorData.detail || 'Unknown error'}`);
        return false;
      }
    } catch (error) {
      alert("Failed to delete payment type: Network error");
      return false;
    }
  }, [fetchPaymentTypes]);

  return {
    paymentTypes,
    fetchPaymentTypes,
    addPaymentType,
    updatePaymentType,
    deletePaymentType
  };
};
