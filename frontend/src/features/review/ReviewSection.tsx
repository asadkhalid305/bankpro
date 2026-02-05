import React from 'react';
import type { UploadResponse } from '../../types';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { Input } from '../../components/ui/Input';

interface ReviewSectionProps {
  stagedData: UploadResponse;
  selectedTransactions: number[];
  onCancel: () => void;
  onMerge: () => void;
  onCategoryChange: (index: number, newCategory: string) => void;
  onToggleSelect: (index: number) => void;
  onToggleAll: () => void;
}

export const ReviewSection: React.FC<ReviewSectionProps> = ({
  stagedData,
  selectedTransactions,
  onCancel,
  onMerge,
  onCategoryChange,
  onToggleSelect,
  onToggleAll
}) => {
  return (
    <div className="review-section">
      <div className="metadata-banner">
        <div><strong>Source</strong> {stagedData.metadata.source}</div>
        <div><strong>Period</strong> {stagedData.metadata.start_date} to {stagedData.metadata.end_date}</div>
        <div><strong>Rows Found</strong> {stagedData.transactions.length}</div>
        <div><strong>Selected</strong> {selectedTransactions.length}</div>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>
                <Input 
                  type="checkbox" 
                  checked={selectedTransactions.length === stagedData.transactions.length}
                  onChange={onToggleAll}
                />
              </th>
              <th>Date</th>
              <th>Merchant</th>
              <th>Category</th>
              <th>Price</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {stagedData.transactions.map((t, i) => (
              <tr key={i} className={t.is_duplicate ? 'duplicate-row' : ''}>
                <td>
                  <Input 
                    type="checkbox" 
                    checked={selectedTransactions.includes(i)} 
                    onChange={() => onToggleSelect(i)}
                  />
                </td>
                <td>{t.DATE}</td>
                <td className="desc-cell">{t.MERCHANT}</td>
                <td>
                  <Select 
                    value={t.CATEGORY} 
                    onChange={(e) => onCategoryChange(i, e.target.value)}
                    options={stagedData.categories}
                  />
                </td>
                <td>{t.PRICE.toFixed(2)}</td>
                <td>{t.is_duplicate ? '⚠️ DUPLICATE' : '✅ NEW'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="actions">
        <Button onClick={onCancel} variant="secondary">Cancel</Button>
        <Button onClick={onMerge} variant="primary" color="success">
          Confirm & Merge {selectedTransactions.length} Rows
        </Button>
      </div>
    </div>
  );
};
