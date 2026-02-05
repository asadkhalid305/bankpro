import { useState } from 'react';
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
}

interface Backup {
  filename: string;
  date: string;
  size: string;
}

function App() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'review' | 'merging' | 'success' | 'error' | 'backups' | 'mappings'>('idle');
  const [message, setMessage] = useState('');
  const [stagedData, setStagedData] = useState<UploadResponse | null>(null);
  const [selectedTransactions, setSelectedTransactions] = useState<number[]>([]);
  const [backups, setBackups] = useState<Backup[]>([]);
  const [previewData, setPreviewData] = useState<Transaction[] | null>(null);
  const [selectedBackup, setSelectedBackup] = useState<string | null>(null);
  const [confirmText, setConfirmText] = useState('');
  
  // Mapping management state
  const [allMappings, setAllMappings] = useState<Record<string, string>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editMerchant, setEditMerchant] = useState('');
  const [editCategory, setEditCategory] = useState('');
  
  // Sorting state
  const [sortConfig, setSortConfig] = useState<{ key: 'merchant' | 'category'; direction: 'asc' | 'desc' } | null>(null);

  const fetchMappings = async () => {
    const response = await fetch('/api/mappings');
    const data = await response.json();
    setAllMappings(data);
    setStatus('mappings');
  };

  const handleUpdateMapping = async (oldMerchant: string | null) => {
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
    }
  };

  const handleDeleteMapping = async (merchant: string) => {
    if (!window.confirm(`Delete mapping for ${merchant}?`)) return;
    const response = await fetch(`/api/mappings/${encodeURIComponent(merchant)}`, { method: 'DELETE' });
    if (response.ok) fetchMappings();
  };

  const requestSort = (key: 'merchant' | 'category') => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortedMappings = () => {
    const items = Object.entries(allMappings).filter(([merchant, category]) => 
      merchant.toLowerCase().includes(searchTerm.toLowerCase()) ||
      category.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
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
        setStatus('idle');
      }
    } catch (error) {
      alert("Restore failed");
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
            <button className="rollback-btn" onClick={fetchMappings} style={{marginRight: '10px'}}>🧠 Knowledge Base</button>
            <button className="rollback-btn" onClick={fetchBackups}>📂 Manage Backups</button>
          </div>
        </header>

        {status === 'mappings' && (
          <div className="mappings-section">
            <div className="section-header">
              <div>
                <h2>Intelligence Knowledge Base</h2>
                <p className="disclaimer">💡 Changes here apply only to future uploads and will not modify your master file history.</p>
              </div>
              <input 
                type="text" 
                placeholder="Search merchant or category..." 
                className="search-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
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
                          {editingKey === merchant ? (
                            <input value={editMerchant} onChange={(e) => setEditMerchant(e.target.value)} className="inline-edit" />
                          ) : merchant}
                        </td>
                        <td>
                          {editingKey === merchant ? (
                            <select value={editCategory} onChange={(e) => setEditCategory(e.target.value)} className="category-select">
                              {['Benefit', 'Bill', 'Conversion', 'Dependant', 'Extra', 'Food & Outing', 'Gifts', 'Grocery', 'Investment', 'Medical', 'Office', 'Salary', 'Shopping', 'Transport', 'Vacation', 'Car'].map(c => (
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
            <button onClick={() => setStatus('idle')} className="secondary-btn">Back to Dashboard</button>
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
            <button onClick={() => setStatus('idle')} className="secondary-btn" style={{marginTop: '1rem'}}>Back</button>
          </div>
        )}

        {status === 'success' && (
          <div className="success-section">
            <div className="message success">{message}</div>
            <div className="button-group">
              <button onClick={() => window.open('/api/download', '_blank')} className="download-btn">
                📥 Download Master File
              </button>
              <button onClick={() => setStatus('idle')} className="secondary-btn">Process Another</button>
            </div>
          </div>
        )}

        {(status === 'error' || status === 'merging') && (
          <div className="message info">
            {status === 'merging' ? 'Merging data...' : message}
            {status === 'error' && <button onClick={() => setStatus('idle')}>Try Again</button>}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;