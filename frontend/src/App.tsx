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
import { BucketsManager } from './features/buckets/BucketsManager';
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
import { useCategories } from './hooks/useCategories';
import { useBuckets } from './hooks/useBuckets';

function App() {
  const location = useLocation();
  const path = location.pathname;
  
  const upload = useUpload();
  const backups = useBackups();
  const accounts = useAccounts();
  const master = useMasterData();
  const mappings = useMappings();
  const categories = useCategories();
  const buckets = useBuckets();

  // Load initial data
  useEffect(() => {
    accounts.fetchAccounts();
    categories.fetchCategories();
    buckets.fetchBuckets();
  }, [accounts.fetchAccounts, categories.fetchCategories, buckets.fetchBuckets]);

  // Load view-specific data based on URL
  useEffect(() => {
    if (path.startsWith('/transactions') || path === '/') master.fetchMasterData();
    if (path.startsWith('/mappings')) mappings.fetchMappings();
    if (path.startsWith('/backups')) backups.fetchBackups();
    if (path.startsWith('/accounts')) accounts.fetchAccounts();
    if (path.startsWith('/buckets')) buckets.fetchBuckets();
  }, [path, master.fetchMasterData, mappings.fetchMappings, backups.fetchBackups, accounts.fetchAccounts, buckets.fetchBuckets]);

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
              categories={categories.categories}
              buckets={buckets.buckets.map(b => b.name)}
              search={mappings.search}
              onSearchChange={mappings.setSearch}
              categoryFilter={mappings.categoryFilter}
              onCategoryFilterChange={mappings.setCategoryFilter}
              sortConfig={mappings.sortConfig}
              onSort={mappings.toggleSort}
              selectedRows={mappings.selectedRows}
              onToggleRow={mappings.toggleSelection}
              onToggleAll={() => mappings.toggleAllSelection(mappings.getSortedMappings().map(m => m.pattern))}
              onDelete={mappings.deleteMappings}
              onUpdate={mappings.updateMapping}
              onAdd={mappings.addMapping}
            />
          } />

          <Route path="/transactions" element={
            <MasterStatement 
              data={master.getFilteredData()}
              totalCount={master.data.length}
              categories={categories.categories}
              buckets={buckets.buckets.map(b => b.name)}
              paymentTypes={accounts.accounts.map(a => a.name)}
              search={master.search}
              onSearchChange={master.setSearch}
              categoryFilter={master.categoryFilter}
              onCategoryFilterChange={master.setCategoryFilter}
              accountFilter={master.accountFilter}
              onAccountFilterChange={master.setAccountFilter}
              bucketFilter={master.bucketFilter}
              onBucketFilterChange={master.setBucketFilter}
              sortConfig={master.sortConfig}
              onSort={master.toggleSort}
              selectedRows={master.selectedRows}
              onToggleRow={master.toggleSelection}
              onToggleAll={() => master.toggleAllSelection(master.getFilteredData().map(r => r.id!))}
              onDelete={master.deleteRows}
              onUpdate={master.updateRow}
              onAdd={master.addRow}
            />
          } />

          <Route path="/accounts" element={
            <AccountsManager 
              accounts={accounts.accounts}
              buckets={buckets.buckets.map(b => b.name)}
              onAdd={accounts.addAccount}
              onUpdate={accounts.updateAccount}
              onDelete={accounts.deleteAccount}
            />
          } />

          <Route path="/buckets" element={
            <BucketsManager 
              buckets={buckets.buckets}
              onSave={buckets.saveBuckets}
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
              {(upload.status === 'idle' || upload.status === 'uploading') && (
                <UploadSection 
                  file={upload.file}
                  status={upload.status}
                  onFileChange={upload.handleFileChange}
                  onUpload={upload.uploadFile}
                  createNewFile={upload.createNewFile}
                  setCreateNewFile={upload.setCreateNewFile}
                />
              )}

              {upload.status === 'review' && upload.stagedData && (
                <ReviewSection 
                  stagedData={upload.stagedData}
                  selectedTransactions={upload.selectedTransactions}
                  categories={categories.categories}
                  buckets={buckets.buckets.map(b => b.name)}
                  onCancel={() => { upload.resetStatus(); }}
                  onMerge={upload.mergeTransactions}
                  onCategoryChange={upload.updateCategory}
                  onBucketChange={upload.updateBucket}
                  onTypeChange={upload.updateType}
                  onToggleSelect={upload.toggleTransactionSelection}
                  onToggleAll={upload.toggleAllTransactions}
                />
              )}

              {(upload.status === 'success' || upload.status === 'new_file_created') && (
                <Card className="max-w-md mx-auto mt-12">
                  <CardHeader>
                     <CardTitle className={upload.status === 'success' ? "text-emerald-600" : "text-blue-600"}>
                        {upload.status === 'success' ? "Import Successful!" : "New File Created!"}
                     </CardTitle>
                     <CardDescription>{upload.message}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {upload.status === 'success' && (
                      <Button onClick={() => window.open('/api/download', '_blank')} className="w-full">
                        📥 Download Master File
                      </Button>
                    )}
                    <Button onClick={() => upload.resetStatus()} className="w-full">
                      🔄 Process Another Statement
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
                      <div className="flex gap-4 mt-6">
                        <Button onClick={() => upload.resetStatus()}>
                          Try Again
                        </Button>
                        <Button onClick={() => { master.fetchMasterData(); window.location.href = '/'; }} variant="outline">
                          Back to Dashboard
                        </Button>
                      </div>
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
