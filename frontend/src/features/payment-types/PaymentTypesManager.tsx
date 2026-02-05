import React, { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

interface PaymentTypesManagerProps {
  paymentTypes: string[];
  onAdd: (name: string) => void;
  onUpdate: (oldName: string, newName: string) => void;
  onDelete: (name: string) => void;
  onClose: () => void;
}

export const PaymentTypesManager: React.FC<PaymentTypesManagerProps> = ({
  paymentTypes,
  onAdd,
  onUpdate,
  onDelete,
  onClose
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTypeName, setNewTypeName] = useState('');
  const [editingType, setEditingType] = useState<string | null>(null);
  const [editTypeName, setEditTypeName] = useState('');

  const handleAdd = () => {
    onAdd(newTypeName);
    setNewTypeName('');
    setShowAddForm(false);
  };

  const handleUpdate = (oldName: string) => {
    onUpdate(oldName, editTypeName);
    setEditingType(null);
  };

  return (
    <div className="payment-types-section">
      <div className="section-header">
        <div>
          <h2>Manage Payment Types</h2>
          <p className="disclaimer">💳 Add, edit or delete payment methods available in the app.</p>
        </div>
        <Button 
          onClick={() => setShowAddForm(!showAddForm)} 
          variant="secondary"
          size="sm"
          style={{width: 'auto'}}
        >
          {showAddForm ? '✖️ Cancel Add' : '➕ Add New Payment Type'}
        </Button>
      </div>

      {showAddForm && (
        <div className="add-form card">
          <h3>Add New Payment Type</h3>
          <div className="form-fields" style={{display: 'flex', gap: '10px', flexWrap: 'wrap'}}>
            <Input 
              type="text" 
              value={newTypeName} 
              onChange={(e) => setNewTypeName(e.target.value)} 
              placeholder="New Payment Type Name" 
              className="inline-edit" 
              style={{flex: 1}} 
            />
          </div>
          <Button onClick={handleAdd} variant="primary" color="success" style={{width: 'auto', marginTop: '15px'}}>
            Create Payment Type
          </Button>
        </div>
      )}

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Payment Type</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paymentTypes.map(pt => (
              <tr key={pt}>
                <td>
                  {editingType === pt ? (
                    <Input value={editTypeName} onChange={(e) => setEditTypeName(e.target.value)} className="inline-edit" />
                  ) : pt}
                </td>
                <td>
                  {editingType === pt ? (
                    <div className="actions">
                      <Button onClick={() => handleUpdate(pt)} variant="primary" size="sm" color="success">Save</Button>
                      <Button onClick={() => setEditingType(null)} variant="secondary" size="sm">Cancel</Button>
                    </div>
                  ) : (
                    <div className="actions">
                      <Button onClick={() => {
                        setEditingType(pt);
                        setEditTypeName(pt);
                      }} variant="secondary" size="sm">Edit</Button>
                      <Button onClick={() => onDelete(pt)} variant="rollback" size="sm" color="error">Delete</Button>
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
