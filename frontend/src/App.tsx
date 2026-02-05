import { useState, useEffect } from 'react';
import './App.css';

interface Transaction {
  DATE: string;
  MERCHANT: string;
  CATEGORY: string;
  PAYMENT: string;
  PRICE: number;
  is_duplicate?: boolean;
}

interface Metadata {
  source: string;
  start_date: string;
  end_date: string;
  initial_balance: number | null;
  final_balance: number | null;
}

interface UploadResponse {
  metadata: Metadata;
  transactions: Transaction[];
  categories: string[];
  payment_types: string[]; // Added
}

interface Backup {
  filename: string;
  date: string;
  size: string;
}

function App() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'review' | 'merging' | 'success' | 'error' | 'backups' | 'mappings' | 'master' | 'payment_types'>('master');
  const [message, setMessage] = useState('');
  const [stagedData, setStagedData] = useState<UploadResponse | null>(null);
  const [selectedTransactions, setSelectedTransactions] = useState<number[]>([]);
  const [backups, setBackups] = useState<Backup[]>([]);
  const [previewData, setPreviewData] = useState<Transaction[] | null>(null);
  const [selectedBackup, setSelectedBackup] = useState<string | null>(null);
  const [confirmText, setConfirmText] = useState('');
  
  // Master data state
  const [masterData, setMasterData] = useState<Transaction[]>([]);
  const [masterSearch, setMasterSearch] = useState('');
  const [masterCategoryFilter, setMasterCategoryFilter] = useState('All');
  const [masterPaymentFilter, setMasterPaymentFilter] = useState('All'); // Added
  const [masterSortConfig, setMasterSortConfig] = useState<{ key: keyof Transaction; direction: 'asc' | 'desc' } | null>({ key: 'DATE', direction: 'desc' });
  const [editingMasterIndex, setEditingMasterIndex] = useState<number | null>(null);
  const [editMasterRow, setEditMasterRow] = useState<Transaction | null>(null);
  const [selectedMasterRows, setSelectedMasterRows] = useState<Set<number>>(new Set());
  const [showAddMasterForm, setShowAddMasterForm] = useState(false);
  const [newMasterRow, setNewMasterRow] = useState<Transaction>({
    DATE: new Date().toISOString().split('T')[0],
    MERCHANT: '',
    CATEGORY: 'Unknown',
    PRICE: 0,
    PAYMENT: 'Other'
  });

  // Payment Types state
  const [paymentTypes, setPaymentTypes] = useState<string[]>([]);
  const [showAddPaymentTypeForm, setShowAddPaymentTypeForm] = useState(false);
  const [newPaymentTypeName, setNewPaymentTypeName] = useState('');
  const [editingPaymentType, setEditingPaymentType] = useState<string | null>(null);
  const [editPaymentTypeName, setEditPaymentTypeName] = useState('');

  // Mapping management state
  const [allMappings, setAllMappings] = useState<Record<string, string>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editMerchant, setEditMerchant] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [selectedMappingRows, setSelectedMappingRows] = useState<Set<string>>(new Set());
  const [mappingCategoryFilter, setMappingCategoryFilter] = useState('All');
  const [showAddMappingForm, setShowAddMappingForm] = useState(false);
  const [newMappingMerchant, setNewMappingMerchant] = useState('');
  const [newMappingCategory, setNewMappingCategory] = useState('Unknown');
  
  // Sorting state
  const [sortConfig, setSortConfig] = useState<{ key: 'merchant' | 'category'; direction: 'asc' | 'desc' } | null>(null);

  // Load initial data on mount
  useEffect(() => {
    fetchPaymentTypes();
    if (status === 'master') {
      fetchMasterData();
    }
  }, [status]); // Only re-fetch if status becomes master.

  const fetchPaymentTypes = async () => {
    try {
      const response = await fetch('/api/payment_types');
      const data = await response.json();
      setPaymentTypes(data);
    } catch (error) {
      alert("Failed to fetch payment types");
      setStatus('error');
    }
  };

  const handleAddPaymentType = async () => {
    if (!newPaymentTypeName.trim()) {
      alert("Payment type name cannot be empty.");
      return;
    }
    try {
      const response = await fetch('/api/payment_types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ new_name: newPaymentTypeName })
      });
      if (response.ok) {
        setShowAddPaymentTypeForm(false);
        setNewPaymentTypeName('');
        fetchPaymentTypes();
      } else {
        const errorData = await response.json();
        alert(`Failed to add payment type: ${errorData.detail || 'Unknown error'}`);
      }
    } catch (error) {
      alert("Failed to add payment type: Network error");
    }
  };

  const handleUpdatePaymentType = async (oldName: string) => {
    if (!editPaymentTypeName.trim()) {
      alert("Payment type name cannot be empty.");
      return;
    }
    try {
      const response = await fetch('/api/payment_types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ old_name: oldName, new_name: editPaymentTypeName })
      });
      if (response.ok) {
        setEditingPaymentType(null);
        fetchPaymentTypes();
      } else {
        const errorData = await response.json();
        alert(`Failed to update payment type: ${errorData.detail || 'Unknown error'}`);
      }
    } catch (error) {
      alert("Failed to update payment type: Network error");
    }
  };

  const handleDeletePaymentType = async (typeName: string) => {
    if (!window.confirm(`Are you sure you want to delete payment type '${typeName}'?`)) return;
    try {
      const response = await fetch(`/api/payment_types/${encodeURIComponent(typeName)}`, { method: 'DELETE' });
      if (response.ok) {
        fetchPaymentTypes();
      } else {
        const errorData = await response.json();
        alert(`Failed to delete payment type: ${errorData.detail || 'Unknown error'}`);
      }
    } catch (error) {
      alert("Failed to delete payment type: Network error");
    }
  };

  const fetchMasterData = async () => {
    try {
      const response = await fetch('/api/master');
      const data = await response.json();
      setMasterData(data);
      if (status !== 'master') setStatus('master'); // Only set status if not already master
    } catch (error) {
      alert("Failed to fetch master data");
      setStatus('error'); // If master fails, go to error state
    }
  };

  const getFilteredMasterData = () => {
    // Include original index for editing
    let items = masterData.map((item, index) => ({ ...item, originalIndex: index }));
    
    items = items.filter(item => 
      (item.MERCHANT.toLowerCase().includes(masterSearch.toLowerCase()) ||
       item.CATEGORY.toLowerCase().includes(masterSearch.toLowerCase()) ||
       item.PAYMENT.toLowerCase().includes(masterSearch.toLowerCase())) && // Include Payment in search
      (masterCategoryFilter === 'All' || item.CATEGORY === masterCategoryFilter) &&
      (masterPaymentFilter === 'All' || item.PAYMENT === masterPaymentFilter) // Filter by Payment
    );

    if (masterSortConfig) {
      items.sort((a, b) => {
        const valA = String(a[masterSortConfig.key]) || ''; // Convert to string for comparison
        const valB = String(b[masterSortConfig.key]) || ''; // Convert to string for comparison
        if (valA < valB) return masterSortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return masterSortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return items;
  };

  const handleMasterUpdate = async (originalIndex: number) => {
    if (!editMasterRow) return;
    try {
      const response = await fetch('/api/master/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          index: originalIndex,
          ...editMasterRow
        })
      });
      if (response.ok) {
        setEditingMasterIndex(null);
        setEditMasterRow(null);
        fetchMasterData(); // Refresh master data after update
      } else {
        const errorData = await response.json();
        alert(`Failed to update master row: ${errorData.detail || 'Unknown error'}`);
      }
    } catch (error) {
      alert("Failed to update master row: Network error");
    }
  };

  const handleAddMasterRow = async () => {
    if (!newMasterRow.MERCHANT || !newMasterRow.DATE || !newMasterRow.CATEGORY || newMasterRow.PRICE === undefined || newMasterRow.PAYMENT === undefined) {
      alert("Please fill all fields for the new record.");
      return;
    }
    try {
      const response = await fetch('/api/master/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMasterRow)
      });
      if (response.ok) {
        setShowAddMasterForm(false);
        setNewMasterRow({ DATE: new Date().toISOString().split('T')[0], MERCHANT: '', CATEGORY: 'Unknown', PRICE: 0, PAYMENT: 'Other' });
        fetchMasterData(); // Refresh master data
      } else {
        const errorData = await response.json();
        alert(`Failed to add new master row: ${errorData.detail || 'Unknown error'}`);
      }
    } catch (error) {
      alert("Failed to add new master row: Network error");
    }
  };

  const handleMasterDelete = async (originalIndex: number | number[]) => {
    const indicesToDelete = Array.isArray(originalIndex) ? originalIndex : [originalIndex];
    if (!window.confirm(`Are you sure you want to delete ${indicesToDelete.length} transaction(s) from your master statement?`)) return;
    try {
      const response = await fetch(`/api/master/bulk_delete`, { 
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ indices: indicesToDelete })
      });
      if (response.ok) {
        setSelectedMasterRows(new Set()); // Clear selection
        fetchMasterData(); // Refresh master data after deletion
      } else {
        const errorData = await response.json();
        alert(`Failed to delete master row(s): ${errorData.detail || 'Unknown error'}`);
      }
    } catch (error) {
      alert("Failed to delete master row(s): Network error");
    }
  };

  const handleToggleMasterRow = (originalIndex: number) => {
    const newSelection = new Set(selectedMasterRows);
    if (newSelection.has(originalIndex)) {
      newSelection.delete(originalIndex);
    } else {
      newSelection.add(originalIndex);
    }
    setSelectedMasterRows(newSelection);
  };

  const handleToggleAllMasterRows = () => {
    if (selectedMasterRows.size === getFilteredMasterData().length && getFilteredMasterData().length > 0) {
      setSelectedMasterRows(new Set()); // Deselect all
    } else {
      const allIndices = new Set(getFilteredMasterData().map(row => row.originalIndex));
      setSelectedMasterRows(allIndices);
    }
  };

  const handleMasterSort = (key: keyof Transaction) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (masterSortConfig && masterSortConfig.key === key && masterSortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setMasterSortConfig({ key, direction });
  };

  const fetchMappings = async () => {
    try {
      const response = await fetch('/api/mappings');
      const data = await response.json();
      setAllMappings(data);
      setStatus('mappings');
    } catch (error) {
      alert("Failed to fetch mappings");
      setStatus('error');
    }
  };

  const handleUpdateMapping = async (oldMerchant: string | null) => {
    try {
      const response = await fetch('/api/mappings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchant: editMerchant,
          category: editCategory,
          old_merchant: oldMerchant
        })
      });
      if (response.ok) {
        setEditingKey(null);
        fetchMappings();
      } else {
        const errorData = await response.json();
        alert(`Failed to update mapping: ${errorData.detail || 'Unknown error'}`);
      }
    } catch (error) {
      alert("Failed to update mapping: Network error");
    }
  };

  const handleAddMapping = async () => {
    if (!newMappingMerchant) {
      alert("Merchant name cannot be empty.");
      return;
    }
    try {
      const response = await fetch('/api/mappings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchant: newMappingMerchant,
          category: newMappingCategory,
          old_merchant: null // Indicate this is a new addition
        })
      });
      if (response.ok) {
        setShowAddMappingForm(false);
        setNewMappingMerchant('');
        setNewMappingCategory('Unknown');
        fetchMappings();
      } else {
        const errorData = await response.json();
        alert(`Failed to add new mapping: ${errorData.detail || 'Unknown error'}`);
      }
    } catch (error) {
      alert("Failed to add new mapping: Network error");
    }
  };

  const handleDeleteMapping = async (merchantsToDelete: string | string[]) => {
    const merchants = Array.isArray(merchantsToDelete) ? merchantsToDelete : [merchantsToDelete];
    if (!window.confirm(`Are you sure you want to delete ${merchants.length} mapping(s)?`)) return;
    try {
      const response = await fetch(`/api/mappings/bulk_delete`, { 
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ merchants: merchants })
      });
      if (response.ok) {
        setSelectedMappingRows(new Set()); // Clear selection
        fetchMappings();
      } else {
        const errorData = await response.json();
        alert(`Failed to delete mapping(s): ${errorData.detail || 'Unknown error'}`);
      }
    } catch (error) {
      alert("Failed to delete mapping(s): Network error");
    }
  };

  const handleToggleMappingRow = (merchant: string) => {
    const newSelection = new Set(selectedMappingRows);
    if (newSelection.has(merchant)) {
      newSelection.delete(merchant);
    } else {
      newSelection.add(merchant);
    }
    setSelectedMappingRows(newSelection);
  };

  const handleToggleAllMappingRows = () => {
    const sortedMappings = getSortedMappings();
    if (selectedMappingRows.size === sortedMappings.length && sortedMappings.length > 0) {
      setSelectedMappingRows(new Set()); // Deselect all
    } else {
      const allMerchants = new Set(sortedMappings.map(([merchant]) => merchant));
      setSelectedMappingRows(allMerchants);
    }
  };

  const requestSort = (key: 'merchant' | 'category') => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortedMappings = () => {
    let items = Object.entries(allMappings).filter(([merchant, category]) => {
      const matchesSearch = merchant.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = mappingCategoryFilter === 'All' || category === mappingCategoryFilter;
      return matchesSearch && matchesFilter;
    });
    
    if (sortConfig !== null) {
      items.sort((a, b) => {
        const valA = sortConfig.key === 'merchant' ? a[0] : a[1];
        const valB = sortConfig.key === 'merchant' ? b[0] : b[1];
        
        if (valA.toLowerCase() < valB.toLowerCase()) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (valA.toLowerCase() > valB.toLowerCase()) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return items;
  };

  const handleCategoryChange = (index: number, newCategory: string) => {
    if (!stagedData) return;
    const updatedTransactions = [...stagedData.transactions];
    updatedTransactions[index].CATEGORY = newCategory;
    setStagedData({ ...stagedData, transactions: updatedTransactions });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setStatus('idle');
      setMessage('');
      setStagedData(null);
    }
  };

  const handleUpload = async () => {
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
        // Clear input for next time
        setFile(null);
        const fileInput = document.getElementById('fileInput') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
        
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
  };

  const handleMerge = async () => {
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
  };

  const fetchBackups = async () => {
    try {
      const response = await fetch('/api/backups');
      const data = await response.json();
      setBackups(data);
      setStatus('backups');
    } catch (error) {
      alert("Failed to fetch backups");
      setStatus('error');
    }
  };

  const handlePreview = async (filename: string) => {
    try {
      const response = await fetch(`/api/backups/${filename}/preview`);
      const data = await response.json();
      if (response.ok) {
        setPreviewData(data);
        setSelectedBackup(filename);
        setConfirmText('');
      } else {
        alert(`Failed to load preview: ${data.detail || 'Unknown error'}`);
      }
    } catch (error) {
      alert(`Failed to load preview: ${error instanceof Error ? error.message : 'Network error'}`);
    }
  };

  const handleRestore = async () => {
    if (confirmText !== 'RESTORE' || !selectedBackup) return;
    
    try {
      const response = await fetch(`/api/rollback?filename=${selectedBackup}`, { method: 'POST' });
      if (response.ok) {
        alert("System restored successfully!");
        setPreviewData(null);
        setSelectedBackup(null);
        fetchMasterData(); // Refresh master data after restore
      } else {
        const errorData = await response.json();
        alert(`Restore failed: ${errorData.detail || 'Unknown error'}`);
      }
    } catch (error) {
      alert("Restore failed: Network error");
    }
  };

  const toggleSelect = (index: number) => {
    setSelectedTransactions(prev => 
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  return (
    <div className="container">
      <div className={`card ${status !== 'idle' && status !== 'uploading' ? 'full-width' : ''}`}>
        <header>
          <h1>🏦 Bank Statement Processor</h1>
          <div className="header-actions">
            {status !== 'idle' && (
              <button className="primary-btn sm" onClick={() => setStatus('idle')} style={{marginRight: '15px', width: 'auto'}}>➕ Import Statement</button>
            )}
            {status !== 'master' && (
              <button className="rollback-btn" onClick={fetchMasterData} style={{marginRight: '10px'}}>📊 Master Statement</button>
            )}
            {status !== 'mappings' && (
              <button className="rollback-btn" onClick={fetchMappings} style={{marginRight: '10px'}}>🧠 Knowledge Base</button>
            )}
            {status !== 'backups' && (
              <button className="rollback-btn" onClick={fetchBackups} style={{marginRight: '10px'}}>📂 Manage Backups</button>
            )}
            {status !== 'payment_types' && (
              <button className="rollback-btn" onClick={() => { fetchPaymentTypes(); setStatus('payment_types'); }} style={{marginRight: '10px'}}>💳 Payment Types</button>
            )}
          </div>
        </header>

        {status === 'mappings' && (
          <div className="mappings-section">
            <div className="section-header">
              <div>
                <h2>Intelligence Knowledge Base</h2>
                <p className="disclaimer">💡 Changes here apply only to future uploads and will not modify your master file history.</p>
              </div>
              <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                <select 
                  className="category-select" 
                  value={mappingCategoryFilter}
                  onChange={(e) => setMappingCategoryFilter(e.target.value)}
                  style={{width: 'auto'}}
                >
                  <option value="All">All Categories</option>
                  {['Benefit', 'Bill', 'Conversion', 'Dependant', 'Extra', 'Food & Outing', 'Gifts', 'Grocery', 'Investment', 'Medical', 'Office', 'Salary', 'Shopping', 'Transport', 'Vacation', 'Car', 'Unknown'].map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <input 
                  type="text" 
                  placeholder="Search merchant or category..." 
                  className="search-input"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {selectedMappingRows.size > 0 && (
                  <button 
                    onClick={() => handleDeleteMapping(Array.from(selectedMappingRows))} 
                    className="primary-btn error sm"
                    style={{width: 'auto'}}
                  >
                    🗑️ Delete Selected ({selectedMappingRows.size})
                  </button>
                )}
                <button 
                  onClick={() => setShowAddMappingForm(!showAddMappingForm)} 
                  className="secondary-btn sm"
                  style={{width: 'auto'}}
                >
                  {showAddMappingForm ? '✖️ Cancel Add' : '➕ Add New Mapping'}
                </button>
              </div>
            </div>

            {showAddMappingForm && (
              <div className="add-form card">
                <h3>Add New Mapping</h3>
                <div className="form-fields" style={{display: 'flex', gap: '10px', flexWrap: 'wrap'}}>
                  <input type="text" value={newMappingMerchant} onChange={(e) => setNewMappingMerchant(e.target.value)} placeholder="Merchant Name" className="inline-edit" style={{flex: 1}} />
                  <select value={newMappingCategory} onChange={(e) => setNewMappingCategory(e.target.value)} className="category-select" style={{flex: 1}}>
                    {['Benefit', 'Bill', 'Conversion', 'Dependant', 'Extra', 'Food & Outing', 'Gifts', 'Grocery', 'Investment', 'Medical', 'Office', 'Salary', 'Shopping', 'Transport', 'Vacation', 'Car', 'Unknown'].map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <button onClick={handleAddMapping} className="primary-btn success" style={{width: 'auto', marginTop: '15px'}}>Create Mapping</button>
              </div>
            )}

            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>
                      <input 
                        type="checkbox" 
                        checked={selectedMappingRows.size === getSortedMappings().length && getSortedMappings().length > 0}
                        onChange={handleToggleAllMappingRows}
                      />
                    </th>
                    <th onClick={() => requestSort('merchant')} className="sortable">
                      Merchant (Pattern) {sortConfig?.key === 'merchant' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th onClick={() => requestSort('category')} className="sortable">
                      Assigned Category {sortConfig?.key === 'category' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {getSortedMappings().map(([merchant, category]) => (
                    <tr key={merchant}>
                        <td>
                          <input 
                            type="checkbox" 
                            checked={selectedMappingRows.has(merchant)}
                            onChange={() => handleToggleMappingRow(merchant)}
                          />
                        </td>
                        <td>
                          {editingKey === merchant ? (
                            <input value={editMerchant} onChange={(e) => setEditMerchant(e.target.value)} className="inline-edit" />
                          ) : merchant}
                        </td>
                        <td>
                          {editingKey === merchant ? (
                            <select value={editCategory} onChange={(e) => setEditCategory(e.target.value)} className="category-select">
                              {['Benefit', 'Bill', 'Conversion', 'Dependant', 'Extra', 'Food & Outing', 'Gifts', 'Grocery', 'Investment', 'Medical', 'Office', 'Salary', 'Shopping', 'Transport', 'Vacation', 'Car', 'Unknown'].map(c => (
                                <option key={c} value={c}>{c}</option>
                              ))}
                            </select>
                          ) : category}
                        </td>
                        <td>
                          {editingKey === merchant ? (
                            <div className="actions">
                              <button onClick={() => handleUpdateMapping(merchant)} className="primary-btn success sm">Save</button>
                              <button onClick={() => setEditingKey(null)} className="secondary-btn sm">Cancel</button>
                            </div>
                          ) : (
                            <div className="actions">
                              <button onClick={() => {
                                setEditingKey(merchant);
                                setEditMerchant(merchant);
                                setEditCategory(category);
                              }} className="secondary-btn sm">Edit</button>
                              <button onClick={() => handleDeleteMapping(merchant)} className="rollback-btn sm error-text">Delete</button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {status === 'master' && (
          <div className="master-section">
            <div className="section-header">
              <div>
                <h2>Master Statement</h2>
                <p className="disclaimer">📊 Showing all historical records from Final_Statement.xlsx</p>
              </div>
              <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                <div className="filter-group">
                  <select 
                    className="category-select" 
                    value={masterCategoryFilter}
                    onChange={(e) => setMasterCategoryFilter(e.target.value)}
                    style={{width: 'auto', marginRight: '10px'}}
                  >
                    <option value="All">All Categories</option>
                    {['Benefit', 'Bill', 'Conversion', 'Dependant', 'Extra', 'Food & Outing', 'Gifts', 'Grocery', 'Investment', 'Medical', 'Office', 'Salary', 'Shopping', 'Transport', 'Vacation', 'Car', 'Unknown'].map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <select 
                    className="category-select" 
                    value={masterPaymentFilter}
                    onChange={(e) => setMasterPaymentFilter(e.target.value)}
                    style={{width: 'auto', marginRight: '10px'}}
                  >
                    <option value="All">All Payments</option>
                    {paymentTypes.map(pt => (
                      <option key={pt} value={pt}>{pt}</option>
                    ))}
                  </select>
                  <input 
                    type="text" 
                    placeholder="Search merchant..." 
                    className="search-input"
                    value={masterSearch}
                    onChange={(e) => setMasterSearch(e.target.value)}
                  />
                </div>
                {selectedMasterRows.size > 0 && (
                  <button 
                    onClick={() => handleMasterDelete(Array.from(selectedMasterRows))} 
                    className="primary-btn error sm"
                    style={{width: 'auto'}}
                  >
                    🗑️ Delete Selected ({selectedMasterRows.size})
                  </button>
                )}
                <button 
                  onClick={() => setShowAddMasterForm(!showAddMasterForm)} 
                  className="secondary-btn sm"
                  style={{width: 'auto'}}
                >
                  {showAddMasterForm ? '✖️ Cancel Add' : '➕ Add New Record'}
                </button>
              </div>
            </div>

            {showAddMasterForm && (
              <div className="add-form card">
                <h3>Add New Master Record</h3>
                <div className="form-fields">
                  <input type="date" value={newMasterRow.DATE} onChange={(e) => setNewMasterRow({...newMasterRow, DATE: e.target.value})} placeholder="Date" />
                  <input type="text" value={newMasterRow.MERCHANT} onChange={(e) => setNewMasterRow({...newMasterRow, MERCHANT: e.target.value})} placeholder="Merchant" />
                  <select value={newMasterRow.CATEGORY} onChange={(e) => setNewMasterRow({...newMasterRow, CATEGORY: e.target.value})} className="category-select">
                    {['Benefit', 'Bill', 'Conversion', 'Dependant', 'Extra', 'Food & Outing', 'Gifts', 'Grocery', 'Investment', 'Medical', 'Office', 'Salary', 'Shopping', 'Transport', 'Vacation', 'Car', 'Unknown'].map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <select value={newMasterRow.PAYMENT} onChange={(e) => setNewMasterRow({...newMasterRow, PAYMENT: e.target.value})} className="category-select">
                    {paymentTypes.map(pt => (
                      <option key={pt} value={pt}>{pt}</option>
                    ))}
                  </select>
                  <input type="number" step="0.01" value={newMasterRow.PRICE} onChange={(e) => setNewMasterRow({...newMasterRow, PRICE: parseFloat(e.target.value)})} placeholder="Price" />
                </div>
                <button onClick={handleAddMasterRow} className="primary-btn success" style={{width: 'auto', marginTop: '15px'}}>Create Record</button>
              </div>
            )}

            {masterData.length === 0 ? (
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
                          <input 
                            type="checkbox" 
                            checked={selectedMasterRows.size === getFilteredMasterData().length && getFilteredMasterData().length > 0}
                            onChange={handleToggleAllMasterRows}
                          />
                        </th>
                        <th onClick={() => handleMasterSort('DATE')} className="sortable">Date {masterSortConfig?.key === 'DATE' && (masterSortConfig.direction === 'asc' ? '↑' : '↓')}</th>
                        <th onClick={() => handleMasterSort('MERCHANT')} className="sortable">Merchant {masterSortConfig?.key === 'MERCHANT' && (masterSortConfig.direction === 'asc' ? '↑' : '↓')}</th>
                        <th onClick={() => handleMasterSort('CATEGORY')} className="sortable">Category {masterSortConfig?.key === 'CATEGORY' && (masterSortConfig.direction === 'asc' ? '↑' : '↓')}</th>
                        <th onClick={() => handleMasterSort('PRICE')} className="sortable">Price {masterSortConfig?.key === 'PRICE' && (masterSortConfig.direction === 'asc' ? '↑' : '↓')}</th>
                        <th onClick={() => handleMasterSort('PAYMENT')} className="sortable">Payment {masterSortConfig?.key === 'PAYMENT' && (masterSortConfig.direction === 'asc' ? '↑' : '↓')}</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getFilteredMasterData().map((r) => (
                        <tr key={r.originalIndex}>
                          <td>
                            <input 
                              type="checkbox" 
                              checked={selectedMasterRows.has(r.originalIndex)}
                              onChange={() => handleToggleMasterRow(r.originalIndex)}
                            />
                          </td>
                          <td>
                            {editingMasterIndex === r.originalIndex ? (
                              <input type="date" value={editMasterRow?.DATE} onChange={(e) => setEditMasterRow({...editMasterRow!, DATE: e.target.value})} className="inline-edit" />
                            ) : r.DATE}
                          </td>
                          <td>
                            {editingMasterIndex === r.originalIndex ? (
                              <input value={editMasterRow?.MERCHANT} onChange={(e) => setEditMasterRow({...editMasterRow!, MERCHANT: e.target.value})} className="inline-edit" />
                            ) : r.MERCHANT}
                          </td>
                          <td>
                            {editingMasterIndex === r.originalIndex ? (
                              <select value={editMasterRow?.CATEGORY} onChange={(e) => setEditMasterRow({...editMasterRow!, CATEGORY: e.target.value})} className="category-select">
                                {['Benefit', 'Bill', 'Conversion', 'Dependant', 'Extra', 'Food & Outing', 'Gifts', 'Grocery', 'Investment', 'Medical', 'Office', 'Salary', 'Shopping', 'Transport', 'Vacation', 'Car', 'Unknown'].map(c => (
                                  <option key={c} value={c}>{c}</option>
                                ))}
                              </select>
                            ) : r.CATEGORY}
                          </td>
                          <td>
                            {editingMasterIndex === r.originalIndex ? (
                              <input type="number" step="0.01" value={editMasterRow?.PRICE} onChange={(e) => setEditMasterRow({...editMasterRow!, PRICE: parseFloat(e.target.value)})} className="inline-edit" />
                            ) : (typeof r.PRICE === 'number' ? r.PRICE.toFixed(2) : r.PRICE)}
                          </td>
                          <td>
                            {editingMasterIndex === r.originalIndex ? (
                              <select value={editMasterRow?.PAYMENT} onChange={(e) => setEditMasterRow({...editMasterRow!, PAYMENT: e.target.value})} className="category-select">
                                {paymentTypes.map(pt => (
                                  <option key={pt} value={pt}>{pt}</option>
                                ))}
                              </select>
                            ) : r.PAYMENT}
                          </td>
                          <td>
                            {editingMasterIndex === r.originalIndex ? (
                              <div className="actions">
                                <button onClick={() => handleMasterUpdate(r.originalIndex)} className="primary-btn success sm">Save</button>
                                <button onClick={() => setEditingMasterIndex(null)} className="secondary-btn sm">Cancel</button>
                              </div>
                            ) : (
                              <div className="actions">
                                <button onClick={() => {
                                  setEditingMasterIndex(r.originalIndex);
                                  setEditMasterRow(r);
                                }} className="secondary-btn sm">Edit</button>
                                <button onClick={() => handleMasterDelete(r.originalIndex)} className="rollback-btn sm error-text">Delete</button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="stats" style={{marginBottom: '1rem', marginTop: '1rem', textAlign: 'left'}}>
                  Showing {getFilteredMasterData().length} of {masterData.length} entries
                </div>
              </>
            )}
          </div>
        )}

        {(status === 'idle' || status === 'uploading') && (
          <div className="upload-section">
            <div className="upload-area">
              <input type="file" id="fileInput" onChange={handleFileChange} />
              <label htmlFor="fileInput" className="file-label">
                {file ? <span>📄 {file.name}</span> : <span>Click to Select Statement (PDF/XLSX)</span>}
              </label>
            </div>
            <button onClick={handleUpload} disabled={!file || status === 'uploading'} className="primary-btn">
              {status === 'uploading' ? 'Parsing...' : 'Upload & Review'}
            </button>
          </div>
        )}

        {status === 'review' && stagedData && (
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
                      <input 
                        type="checkbox" 
                        checked={selectedTransactions.length === stagedData.transactions.length}
                        onChange={() => {
                          if (selectedTransactions.length === stagedData.transactions.length) {
                            setSelectedTransactions([]);
                          } else {
                            setSelectedTransactions(stagedData.transactions.map((_, i) => i));
                          }
                        }}
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
                        <input 
                          type="checkbox" 
                          checked={selectedTransactions.includes(i)} 
                          onChange={() => toggleSelect(i)}
                        />
                      </td>
                      <td>{t.DATE}</td>
                      <td className="desc-cell">{t.MERCHANT}</td>
                      <td>
                        <select 
                          value={t.CATEGORY} 
                          onChange={(e) => handleCategoryChange(i, e.target.value)}
                          className="category-select"
                        >
                          {stagedData.categories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </td>
                      <td>{t.PRICE.toFixed(2)}</td>
                      <td>{t.is_duplicate ? '⚠️ DUPLICATE' : '✅ NEW'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="actions">
              <button onClick={() => setStatus('idle')} className="secondary-btn">Cancel</button>
              <button onClick={handleMerge} className="primary-btn success">
                Confirm & Merge {selectedTransactions.length} Rows
              </button>
            </div>
          </div>
        )}

        {status === 'backups' && (
          <div className="backups-section">
            <h2>Backup History</h2>
            <div className="backup-list">
              {backups.length === 0 && <p>No backups found.</p>}
              {backups.map(b => (
                <div key={b.filename} className="backup-item">
                  <div className="backup-info">
                    <strong>{b.date}</strong>
                    <span>{b.filename} ({b.size})</span>
                  </div>
                  <button onClick={() => handlePreview(b.filename)} className="rollback-btn">Preview</button>
                </div>
              ))}
            </div>
            {previewData && (
              <div className="modal-overlay">
                <div className="modal">
                  <h3>Preview: {selectedBackup}</h3>
                  <div className="table-container mini">
                    <table>
                      <thead>
                        <tr><th>Date</th><th>Merchant</th><th>Category</th><th>Price</th></tr>
                      </thead>
                      <tbody>
                        {previewData.map((r, i) => (
                          <tr key={i}>
                            <td>{r.DATE}</td>
                            <td>{r.MERCHANT}</td>
                            <td>{r.CATEGORY}</td>
                            <td>{r.PRICE}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="restore-confirm">
                    <p className="warning">⚠️ This will overwrite your current statement with this version.</p>
                    <div className="input-group">
                      <label>Type <strong>RESTORE</strong></label>
                      <input 
                        type="text" 
                        value={confirmText} 
                        onChange={(e) => setConfirmText(e.target.value)}
                        placeholder="..."
                      />
                    </div>
                    <div className="actions">
                      <button onClick={() => setPreviewData(null)} className="secondary-btn">Close</button>
                      <button 
                        onClick={handleRestore} 
                        className="primary-btn error"
                        disabled={confirmText !== 'RESTORE'}
                      >
                        Execute
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {status === 'payment_types' && (
          <div className="payment-types-section">
            <div className="section-header">
              <div>
                <h2>Manage Payment Types</h2>
                <p className="disclaimer">💳 Add, edit or delete payment methods available in the app.</p>
              </div>
              <button 
                onClick={() => setShowAddPaymentTypeForm(!showAddPaymentTypeForm)} 
                className="secondary-btn sm"
                style={{width: 'auto'}}
              >
                {showAddPaymentTypeForm ? '✖️ Cancel Add' : '➕ Add New Payment Type'}
              </button>
            </div>

            {showAddPaymentTypeForm && (
              <div className="add-form card">
                <h3>Add New Payment Type</h3>
                <div className="form-fields" style={{display: 'flex', gap: '10px', flexWrap: 'wrap'}}>
                  <input type="text" value={newPaymentTypeName} onChange={(e) => setNewPaymentTypeName(e.target.value)} placeholder="New Payment Type Name" className="inline-edit" style={{flex: 1}} />
                </div>
                <button onClick={handleAddPaymentType} className="primary-btn success" style={{width: 'auto', marginTop: '15px'}}>Create Payment Type</button>
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
                        {editingPaymentType === pt ? (
                          <input value={editPaymentTypeName} onChange={(e) => setEditPaymentTypeName(e.target.value)} className="inline-edit" />
                        ) : pt}
                      </td>
                      <td>
                        {editingPaymentType === pt ? (
                          <div className="actions">
                            <button onClick={() => handleUpdatePaymentType(pt)} className="primary-btn success sm">Save</button>
                            <button onClick={() => setEditingPaymentType(null)} className="secondary-btn sm">Cancel</button>
                          </div>
                        ) : (
                          <div className="actions">
                            <button onClick={() => {
                              setEditingPaymentType(pt);
                              setEditPaymentTypeName(pt);
                            }} className="secondary-btn sm">Edit</button>
                            <button onClick={() => handleDeletePaymentType(pt)} className="rollback-btn sm error-text">Delete</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {status === 'success' && (
          <div className="success-section">
            <div className="message success">{message}</div>
            <div className="button-group">
              <button onClick={() => window.open('/api/download', '_blank')} className="download-btn">
                📥 Download Master File
              </button>
              <button onClick={fetchMasterData} className="secondary-btn">View Master Statement</button>
            </div>
          </div>
        )}

        {(status === 'error' || status === 'merging') && (
          <div className="message info">
            {status === 'merging' ? 'Merging data...' : message}
            {status === 'error' && <button onClick={fetchMasterData}>Go to Master Statement</button>}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;