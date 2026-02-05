import React, { useState } from 'react';
import { CATEGORY_OPTIONS, type SortConfig } from '../../types';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';

interface MappingKnowledgeBaseProps {
  mappings: [string, string][];
  search: string;
  onSearchChange: (val: string) => void;
  categoryFilter: string;
  onCategoryFilterChange: (val: string) => void;
  sortConfig: SortConfig<{ merchant: string; category: string }> | null;
  onSort: (key: 'merchant' | 'category') => void;
  selectedRows: Set<string>;
  onToggleRow: (merchant: string) => void;
  onToggleAll: () => void;
  onDelete: (merchants: string[]) => void;
  onUpdate: (oldMerchant: string | null, newMerchant: string, newCategory: string) => void;
  onAdd: (merchant: string, category: string) => void;
}

export const MappingKnowledgeBase: React.FC<MappingKnowledgeBaseProps> = ({
  mappings,
  search,
  onSearchChange,
  categoryFilter,
  onCategoryFilterChange,
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
  const [newMerchant, setNewMerchant] = useState('');
  const [newCategory, setNewCategory] = useState('Unknown'); // Matches App.tsx default
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editMerchant, setEditMerchant] = useState('');
  const [editCategory, setEditCategory] = useState('');

  const handleAdd = () => {
    onAdd(newMerchant, newCategory);
    setNewMerchant('');
    setNewCategory('Unknown');
    setShowAddForm(false);
  };

  const handleEditClick = (merchant: string, category: string) => {
    setEditingKey(merchant);
    setEditMerchant(merchant);
    setEditCategory(category);
  };

  const handleUpdateClick = (oldMerchant: string) => {
    onUpdate(oldMerchant, editMerchant, editCategory);
    setEditingKey(null);
  };

  return (
    <div className="mappings-section">
      <div className="section-header">
        <div>
          <h2>Intelligence Knowledge Base</h2>
          <p className="disclaimer">💡 Changes here apply only to future uploads and will not modify your master file history.</p>
        </div>
        <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
          <Select 
            value={categoryFilter}
            onChange={(e) => onCategoryFilterChange(e.target.value)}
            style={{width: 'auto'}}
          >
             <option value="All">All Categories</option>
             {CATEGORY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
          </Select>
          <Input 
            type="text" 
            placeholder="Search merchant or category..." 
            className="search-input"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
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
            {showAddForm ? '✖️ Cancel Add' : '➕ Add New Mapping'}
          </Button>
        </div>
      </div>

      {showAddForm && (
        <div className="add-form card">
          <h3>Add New Mapping</h3>
          <div className="form-fields" style={{display: 'flex', gap: '10px', flexWrap: 'wrap'}}>
            <Input type="text" value={newMerchant} onChange={(e) => setNewMerchant(e.target.value)} placeholder="Merchant Name" className="inline-edit" style={{flex: 1}} />
            <Select value={newCategory} onChange={(e) => setNewCategory(e.target.value)} options={CATEGORY_OPTIONS} style={{flex: 1}} />
          </div>
          <Button onClick={handleAdd} variant="primary" color="success" style={{width: 'auto', marginTop: '15px'}}>Create Mapping</Button>
        </div>
      )}

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>
                <Input 
                  type="checkbox" 
                  checked={selectedRows.size === mappings.length && mappings.length > 0}
                  onChange={onToggleAll}
                />
              </th>
              <th onClick={() => onSort('merchant')} className="sortable">
                Merchant (Pattern) {sortConfig?.key === 'merchant' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => onSort('category')} className="sortable">
                Assigned Category {sortConfig?.key === 'category' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {mappings.map(([merchant, category]) => (
              <tr key={merchant}>
                  <td>
                    <Input 
                      type="checkbox" 
                      checked={selectedRows.has(merchant)}
                      onChange={() => onToggleRow(merchant)}
                    />
                  </td>
                  <td>
                    {editingKey === merchant ? (
                      <Input value={editMerchant} onChange={(e) => setEditMerchant(e.target.value)} className="inline-edit" />
                    ) : merchant}
                  </td>
                  <td>
                    {editingKey === merchant ? (
                      <Select value={editCategory} onChange={(e) => setEditCategory(e.target.value)} options={CATEGORY_OPTIONS} />
                    ) : category}
                  </td>
                  <td>
                    {editingKey === merchant ? (
                      <div className="actions">
                        <Button onClick={() => handleUpdateClick(merchant)} variant="primary" size="sm" color="success">Save</Button>
                        <Button onClick={() => setEditingKey(null)} variant="secondary" size="sm">Cancel</Button>
                      </div>
                    ) : (
                      <div className="actions">
                        <Button onClick={() => handleEditClick(merchant, category)} variant="secondary" size="sm">Edit</Button>
                        <Button onClick={() => onDelete([merchant])} variant="rollback" size="sm" color="error">Delete</Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
