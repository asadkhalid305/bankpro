import { useState, useEffect } from 'react';
import './App.css';
import { Layout } from './components/layout/Layout';
import { Header } from './components/layout/Header';
import { UploadSection } from './features/upload/UploadSection';
import { ReviewSection } from './features/review/ReviewSection';
import { BackupsSection } from './features/backups/BackupsSection';
import { PaymentTypesManager } from './features/payment-types/PaymentTypesManager';
import { MasterStatement } from './features/master/MasterStatement';
import { MappingKnowledgeBase } from './features/mappings/MappingKnowledgeBase';
import { Button } from './components/ui/Button';

// Hooks
import { useUpload } from './hooks/useUpload';
import { useBackups } from './hooks/useBackups';
import { usePaymentTypes } from './hooks/usePaymentTypes';
import { useMasterData } from './hooks/useMasterData';
import { useMappings } from './hooks/useMappings';

function App() {
  const [view, setView] = useState<'master' | 'mappings' | 'backups' | 'payment_types' | 'upload'>('master');
  
  const upload = useUpload();
  const backups = useBackups();
  const pt = usePaymentTypes();
  const master = useMasterData();
  const mappings = useMappings();

  // Load initial data
  useEffect(() => {
    pt.fetchPaymentTypes();
  }, [pt.fetchPaymentTypes]);

  // Load view-specific data
  useEffect(() => {
    if (view === 'master') master.fetchMasterData();
    if (view === 'mappings') mappings.fetchMappings();
    if (view === 'backups') backups.fetchBackups();
    if (view === 'payment_types') pt.fetchPaymentTypes();
  }, [view, master.fetchMasterData, mappings.fetchMappings, backups.fetchBackups, pt.fetchPaymentTypes]);

  // Sync upload status to view
  useEffect(() => {
    if (upload.status !== 'idle') {
      setView('upload');
    }
  }, [upload.status]);

  const handleSetStatus = (status: string) => {
    if (status === 'idle') {
      upload.resetStatus(); // Ensure upload hook resets
      setView('upload'); // 'idle' in old app meant showing upload screen
    } else {
      setView(status as any);
      upload.resetStatus();
    }
  };

  const getStatusString = () => {
    if (view === 'upload') return upload.status; // 'idle', 'uploading', 'review', etc.
    return view;
  };

  return (
    <Layout isFullWidth={view !== 'upload' || upload.status !== 'idle'}>
      <Header 
        status={getStatusString()} 
        onSetStatus={handleSetStatus}
        onFetchMaster={() => setView('master')}
        onFetchMappings={() => setView('mappings')}
        onFetchBackups={() => setView('backups')}
        onFetchPaymentTypes={() => { pt.fetchPaymentTypes(); setView('payment_types'); }}
      />

      {/* Mappings View */}
      {view === 'mappings' && (
        <MappingKnowledgeBase 
          mappings={mappings.getSortedMappings()}
          search={mappings.search}
          onSearchChange={mappings.setSearch}
          categoryFilter={mappings.categoryFilter}
          onCategoryFilterChange={mappings.setCategoryFilter}
          sortConfig={mappings.sortConfig}
          onSort={mappings.toggleSort}
          selectedRows={mappings.selectedRows}
          onToggleRow={mappings.toggleSelection}
          onToggleAll={() => mappings.toggleAllSelection(mappings.getSortedMappings().map(m => m[0]))}
          onDelete={mappings.deleteMappings}
          onUpdate={mappings.updateMapping}
          onAdd={mappings.addMapping}
        />
      )}

      {/* Master View */}
      {view === 'master' && (
        <MasterStatement 
          data={master.getFilteredData()}
          totalCount={master.data.length}
          paymentTypes={pt.paymentTypes}
          search={master.search}
          onSearchChange={master.setSearch}
          categoryFilter={master.categoryFilter}
          onCategoryFilterChange={master.setCategoryFilter}
          paymentFilter={master.paymentFilter}
          onPaymentFilterChange={master.setPaymentFilter}
          sortConfig={master.sortConfig}
          onSort={master.toggleSort}
          selectedRows={master.selectedRows}
          onToggleRow={master.toggleSelection}
          onToggleAll={() => master.toggleAllSelection(master.getFilteredData().map(r => r.originalIndex!))}
          onDelete={master.deleteRows}
          onUpdate={master.updateRow}
          onAdd={master.addRow}
        />
      )}

      {/* Payment Types View */}
      {view === 'payment_types' && (
        <PaymentTypesManager 
          paymentTypes={pt.paymentTypes}
          onAdd={pt.addPaymentType}
          onUpdate={pt.updatePaymentType}
          onDelete={pt.deletePaymentType}
          onClose={() => setView('master')}
        />
      )}

      {/* Backups View */}
      {view === 'backups' && (
        <BackupsSection 
          backups={backups.backups}
          onPreview={backups.previewBackup}
          previewData={backups.previewData}
          selectedBackup={backups.selectedBackup}
          onRestore={(f) => {
            backups.restoreBackup(f).then(success => {
              if (success) {
                master.fetchMasterData(); // Refresh master data
                // Stay on backups or go to master? Original went home or stayed.
              }
            });
          }}
          onClosePreview={backups.closePreview}
        />
      )}

      {/* Upload Flow (The 'idle' and 'uploading' states of old App) */}
      {view === 'upload' && upload.status !== 'review' && upload.status !== 'success' && upload.status !== 'error' && upload.status !== 'merging' && (
        <UploadSection 
          file={upload.file}
          status={upload.status}
          onFileChange={upload.handleFileChange}
          onUpload={upload.uploadFile}
        />
      )}

      {/* Review Section */}
      {view === 'upload' && upload.status === 'review' && upload.stagedData && (
        <ReviewSection 
          stagedData={upload.stagedData}
          selectedTransactions={upload.selectedTransactions}
          onCancel={() => { upload.resetStatus(); setView('master'); }}
          onMerge={upload.mergeTransactions}
          onCategoryChange={upload.updateCategory}
          onToggleSelect={upload.toggleTransactionSelection}
          onToggleAll={upload.toggleAllTransactions}
        />
      )}

      {/* Success View */}
      {view === 'upload' && upload.status === 'success' && (
        <div className="success-section">
          <div className="message success">{upload.message}</div>
          <div className="button-group">
            <Button onClick={() => window.open('/api/download', '_blank')} variant="download">
              📥 Download Master File
            </Button>
            <Button onClick={() => { master.fetchMasterData(); setView('master'); }} variant="secondary">
              View Master Statement
            </Button>
          </div>
        </div>
      )}

      {/* Error/Merging Info View */}
      {(upload.status === 'error' || upload.status === 'merging') && (
        <div className="message info">
          {upload.status === 'merging' ? 'Merging data...' : upload.message}
          {upload.status === 'error' && (
            <Button onClick={() => { master.fetchMasterData(); setView('master'); }} style={{marginTop: '1rem'}}>
              Go to Master Statement
            </Button>
          )}
        </div>
      )}

    </Layout>
  );
}

export default App;