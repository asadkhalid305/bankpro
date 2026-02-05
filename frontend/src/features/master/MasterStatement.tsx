import React, { useState } from 'react';
import { CATEGORY_OPTIONS, type Transaction, type SortConfig } from '../../types';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';

interface MasterStatementProps {
  data: (Transaction & { originalIndex: number })[];
  totalCount: number;
  paymentTypes: string[];
  search: string;
  onSearchChange: (val: string) => void;
  categoryFilter: string;
  onCategoryFilterChange: (val: string) => void;
  paymentFilter: string;
  onPaymentFilterChange: (val: string) => void;
  sortConfig: SortConfig<Transaction> | null;
  onSort: (key: keyof Transaction) => void;
  selectedRows: Set<number>;
  onToggleRow: (index: number) => void;
  onToggleAll: () => void;
  onDelete: (indices: number[]) => void;
  onUpdate: (index: number, row: Transaction) => void;
  onAdd: (row: Transaction) => void;
}

export const MasterStatement: React.FC<MasterStatementProps> = ({
  data,
  totalCount,
  paymentTypes,
  search,
  onSearchChange,
  categoryFilter,
  onCategoryFilterChange,
  paymentFilter,
  onPaymentFilterChange,
  sortConfig,
  onSort,
  selectedRows,
  onToggleRow,
  onToggleAll,
  onDelete,
  onUpdate,
  onAdd
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editRow, setEditRow] = useState<Transaction | null>(null);
  const [newRow, setNewRow] = useState<Transaction>({
    DATE: new Date().toISOString().split('T')[0],
    MERCHANT: '',
    CATEGORY: 'Unknown',
    PRICE: 0,
    PAYMENT: 'Other'
  });

  const handleEditClick = (row: Transaction & { originalIndex: number }) => {
    setEditingIndex(row.originalIndex);
    setEditRow(row);
  };

  const handleUpdateClick = (originalIndex: number) => {
    if (editRow) {
      onUpdate(originalIndex, editRow);
      setEditingIndex(null);
      setEditRow(null);
    }
  };

  const handleAddClick = () => {
    onAdd(newRow);
    setNewRow({ DATE: new Date().toISOString().split('T')[0], MERCHANT: '', CATEGORY: 'Unknown', PRICE: 0, PAYMENT: 'Other' });
    setShowAddForm(false);
  };

  return (
    <div className="master-section">
      <div className="section-header">
        <div>
          <h2>Master Statement</h2>
          <p className="disclaimer">📊 Showing all historical records from Final_Statement.xlsx</p>
        </div>
        <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
          <div className="filter-group">
            <Select 
              value={categoryFilter}
              onChange={(e) => onCategoryFilterChange(e.target.value)}
              options={CATEGORY_OPTIONS}
              placeholder="All Categories" // Logic adjustment: 'All' is manually handled in App.tsx options, let's stick to consistent UI
              style={{width: 'auto', marginRight: '10px'}}
            >
               <option value="All">All Categories</option>
               {CATEGORY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
            </Select>

             <Select 
              value={paymentFilter}
              onChange={(e) => onPaymentFilterChange(e.target.value)}
              options={paymentTypes}
              style={{width: 'auto', marginRight: '10px'}}
            >
                <option value="All">All Payments</option>
                {paymentTypes.map(c => <option key={c} value={c}>{c}</option>)}
            </Select>

            <Input 
              type="text" 
              placeholder="Search merchant..." 
              className="search-input"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
          {selectedRows.size > 0 && (
            <Button 
              onClick={() => onDelete(Array.from(selectedRows))} 
              variant="primary" 
              color="error" 
              size="sm"
              style={{width: 'auto'}}
            >
              🗑️ Delete Selected ({selectedRows.size})
            </Button>
          )}
          <Button 
            onClick={() => setShowAddForm(!showAddForm)} 
            variant="secondary"
            size="sm"
            style={{width: 'auto'}}
          >
            {showAddForm ? '✖️ Cancel Add' : '➕ Add New Record'}
          </Button>
        </div>
      </div>

      {showAddForm && (
        <div className="add-form card">
          <h3>Add New Master Record</h3>
          <div className="form-fields">
            <Input type="date" value={newRow.DATE} onChange={(e) => setNewRow({...newRow, DATE: e.target.value})} placeholder="Date" />
            <Input type="text" value={newRow.MERCHANT} onChange={(e) => setNewRow({...newRow, MERCHANT: e.target.value})} placeholder="Merchant" />
            <Select value={newRow.CATEGORY} onChange={(e) => setNewRow({...newRow, CATEGORY: e.target.value})} options={CATEGORY_OPTIONS} />
            <Select value={newRow.PAYMENT} onChange={(e) => setNewRow({...newRow, PAYMENT: e.target.value})} options={paymentTypes} />
            <Input type="number" step="0.01" value={newRow.PRICE} onChange={(e) => setNewRow({...newRow, PRICE: parseFloat(e.target.value)})} placeholder="Price" />
          </div>
          <Button onClick={handleAddClick} variant="primary" color="success" style={{width: 'auto', marginTop: '15px'}}>Create Record</Button>
        </div>
      )}

      {totalCount === 0 ? (
        <div className="message info">
          No data in master statement yet. Upload and merge some files to get started!
        </div>
      ) : (
        <>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>
                    <Input 
                      type="checkbox" 
                      checked={selectedRows.size === data.length && data.length > 0}
                      onChange={onToggleAll}
                    />
                  </th>
                  <th onClick={() => onSort('DATE')} className="sortable">Date {sortConfig?.key === 'DATE' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</th>
                  <th onClick={() => onSort('MERCHANT')} className="sortable">Merchant {sortConfig?.key === 'MERCHANT' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</th>
                  <th onClick={() => onSort('CATEGORY')} className="sortable">Category {sortConfig?.key === 'CATEGORY' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</th>
                  <th onClick={() => onSort('PRICE')} className="sortable">Price {sortConfig?.key === 'PRICE' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</th>
                  <th onClick={() => onSort('PAYMENT')} className="sortable">Payment {sortConfig?.key === 'PAYMENT' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.map((r) => (
                  <tr key={r.originalIndex}>
                    <td>
                      <Input 
                        type="checkbox" 
                        checked={selectedRows.has(r.originalIndex!)}
                        onChange={() => onToggleRow(r.originalIndex!)}
                      />
                    </td>
                    <td>
                      {editingIndex === r.originalIndex ? (
                        <Input type="date" value={editRow?.DATE} onChange={(e) => setEditRow({...editRow!, DATE: e.target.value})} className="inline-edit" />
                      ) : r.DATE}
                    </td>
                    <td>
                      {editingIndex === r.originalIndex ? (
                        <Input value={editRow?.MERCHANT} onChange={(e) => setEditRow({...editRow!, MERCHANT: e.target.value})} className="inline-edit" />
                      ) : r.MERCHANT}
                    </td>
                    <td>
                      {editingIndex === r.originalIndex ? (
                        <Select value={editRow?.CATEGORY} onChange={(e) => setEditRow({...editRow!, CATEGORY: e.target.value})} options={CATEGORY_OPTIONS} />
                      ) : r.CATEGORY}
                    </td>
                    <td>
                      {editingIndex === r.originalIndex ? (
                        <Input type="number" step="0.01" value={editRow?.PRICE} onChange={(e) => setEditRow({...editRow!, PRICE: parseFloat(e.target.value)})} className="inline-edit" />
                      ) : (typeof r.PRICE === 'number' ? r.PRICE.toFixed(2) : r.PRICE)}
                    </td>
                    <td>
                      {editingIndex === r.originalIndex ? (
                        <Select value={editRow?.PAYMENT} onChange={(e) => setEditRow({...editRow!, PAYMENT: e.target.value})} options={paymentTypes} />
                      ) : r.PAYMENT}
                    </td>
                    <td>
                      {editingIndex === r.originalIndex ? (
                        <div className="actions">
                          <Button onClick={() => handleUpdateClick(r.originalIndex!)} variant="primary" size="sm" color="success">Save</Button>
                          <Button onClick={() => setEditingIndex(null)} variant="secondary" size="sm">Cancel</Button>
                        </div>
                      ) : (
                        <div className="actions">
                          <Button onClick={() => handleEditClick(r)} variant="secondary" size="sm">Edit</Button>
                          <Button onClick={() => onDelete([r.originalIndex!])} variant="rollback" size="sm" color="error">Delete</Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="stats" style={{marginBottom: '1rem', marginTop: '1rem', textAlign: 'left'}}>
            Showing {data.length} of {totalCount} entries
          </div>
        </>
      )}
    </div>
  );
};
