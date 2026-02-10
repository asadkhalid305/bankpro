import { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { UploadSection } from './features/upload/UploadSection';
import { ReviewSection } from './features/review/ReviewSection';
import { BackupsSection } from './features/backups/BackupsSection';
import { AccountsManager } from './features/accounts/AccountsManager';
import { MasterStatement } from './features/master/MasterStatement';
import { MappingKnowledgeBase } from './features/mappings/MappingKnowledgeBase';
import { DashboardView } from './features/dashboard/DashboardView';
import { SettingsView } from './features/settings/SettingsView';
import { Button } from './components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Loader2, AlertCircle } from 'lucide-react';
import { ThemeProvider } from './components/theme/ThemeProvider';

// Hooks
import { useUpload } from './hooks/useUpload';
import { useBackups } from './hooks/useBackups';
import { useAccounts } from './hooks/useAccounts';
import { useMasterData } from './hooks/useMasterData';
import { useMappings } from './hooks/useMappings';

function App() {
  const location = useLocation();
  const path = location.pathname;
  
  const upload = useUpload();
  const backups = useBackups();
  const accounts = useAccounts();
  const master = useMasterData();
  const mappings = useMappings();

  // Load initial data
  useEffect(() => {
    accounts.fetchAccounts();
  }, [accounts.fetchAccounts]);

  // Load view-specific data based on URL
  useEffect(() => {
    if (path.startsWith('/transactions') || path === '/') master.fetchMasterData();
    if (path.startsWith('/mappings')) mappings.fetchMappings();
    if (path.startsWith('/backups')) backups.fetchBackups();
    if (path.startsWith('/accounts')) accounts.fetchAccounts();
  }, [path, master.fetchMasterData, mappings.fetchMappings, backups.fetchBackups, accounts.fetchAccounts]);

  // Sync upload status to navigation (optional, or handle via protected route logic)
  /* 
     NOTE: We might want to redirect to /import if upload is active, 
     but standard routing usually dictates the URL drives the view.
     For now, we'll let the user navigate manually or use the router.
  */

  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <DashboardLayout>
        <Routes>
          <Route path="/" element={
            <DashboardView 
              masterCount={master.data.length}
            />
          } />

          <Route path="/mappings" element={
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
          } />

          <Route path="/transactions" element={
            <MasterStatement 
              data={master.getFilteredData()}
              totalCount={master.data.length}
              paymentTypes={accounts.accounts.map(a => a.name)}
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
          } />

          <Route path="/accounts" element={
            <AccountsManager 
              accounts={accounts.accounts}
              onAdd={accounts.addAccount}
              onUpdate={accounts.updateAccount}
              onDelete={accounts.deleteAccount}
            />
          } />

          <Route path="/backups" element={
            <BackupsSection 
              backups={backups.backups}
              onPreview={backups.previewBackup}
              previewData={backups.previewData}
              selectedBackup={backups.selectedBackup}
              onRestore={(f) => {
                backups.restoreBackup(f).then(success => {
                  if (success) {
                    master.fetchMasterData();
                  }
                });
              }}
              onClosePreview={backups.closePreview}
            />
          } />
          
          <Route path="/settings" element={
            <SettingsView />
          } />

          <Route path="/import" element={
            <>
              {upload.status !== 'review' && upload.status !== 'success' && upload.status !== 'error' && upload.status !== 'merging' && (
                <UploadSection 
                  file={upload.file}
                  status={upload.status}
                  onFileChange={upload.handleFileChange}
                  onUpload={upload.uploadFile}
                />
              )}

              {upload.status === 'review' && upload.stagedData && (
                <ReviewSection 
                  stagedData={upload.stagedData}
                  selectedTransactions={upload.selectedTransactions}
                  onCancel={() => { upload.resetStatus(); }}
                  onMerge={upload.mergeTransactions}
                  onCategoryChange={upload.updateCategory}
                  onToggleSelect={upload.toggleTransactionSelection}
                  onToggleAll={upload.toggleAllTransactions}
                />
              )}

              {upload.status === 'success' && (
                <Card className="max-w-md mx-auto mt-12">
                  <CardHeader>
                     <CardTitle className="text-emerald-600">Import Successful!</CardTitle>
                     <CardDescription>{upload.message}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button onClick={() => window.open('/api/download', '_blank')} className="w-full">
                      📥 Download Master File
                    </Button>
                    <Button onClick={() => window.location.href = '/transactions'} variant="outline" className="w-full">
                      View All Transactions
                    </Button>
                    <Button onClick={() => { upload.resetStatus(); window.location.href = '/'; }} variant="ghost" className="w-full">
                      Back to Dashboard
                    </Button>
                  </CardContent>
                </Card>
              )}

              {(upload.status === 'error' || upload.status === 'merging') && (
                <div className="flex flex-col items-center justify-center p-12 text-center">
                  {upload.status === 'merging' ? (
                    <>
                      <Loader2 className="w-12 h-12 mb-4 animate-spin text-primary" />
                      <p className="text-xl font-medium">Merging your data...</p>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-12 h-12 mb-4 text-destructive" />
                      <p className="text-xl font-medium text-destructive">{upload.message}</p>
                      <Button onClick={() => { master.fetchMasterData(); window.location.href = '/'; }} className="mt-6">
                        Back to Safety
                      </Button>
                    </>
                  )}
                </div>
              )}
            </>
          } />

          {/* Catch all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </DashboardLayout>
    </ThemeProvider>
  );
}

export default App;