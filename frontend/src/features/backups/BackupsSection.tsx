import React from 'react';
import type { Backup, Transaction } from '../../types';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { History, FileArchive, ArrowRight, AlertTriangle, Search, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

interface BackupsSectionProps {
  backups: Backup[];
  onPreview: (filename: string) => void;
  previewData: Transaction[] | null;
  selectedBackup: string | null;
  onRestore: (filename: string) => void;
  onClosePreview: () => void;
}

export const BackupsSection: React.FC<BackupsSectionProps> = ({
  backups,
  onPreview,
  previewData,
  selectedBackup,
  onRestore,
  onClosePreview
}) => {
  const [confirmText, setConfirmText] = React.useState('');

  const handleRestoreClick = () => {
    if (selectedBackup && confirmText === 'RESTORE') {
      onRestore(selectedBackup);
      setConfirmText('');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">System Backups</h1>
          <p className="text-sm text-muted-foreground flex items-center mt-1">
            <History className="w-4 h-4 mr-2" />
            Automatic snapshots of your master statement.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Backup History</CardTitle>
          <CardDescription>Select a version to preview and restore your data.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {backups.length === 0 && (
              <div className="p-12 text-center text-muted-foreground italic">
                No backups found yet. They are created automatically after each import.
              </div>
            )}
            {backups.map(b => (
              <div key={b.filename} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    <FileArchive className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{b.date}</p>
                    <p className="text-xs text-muted-foreground font-mono">{b.filename} • {b.size}</p>
                  </div>
                </div>
                <Button onClick={() => onPreview(b.filename)} variant="outline" size="sm">
                  Preview <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Modal 
        isOpen={!!previewData} 
        onClose={onClosePreview}
        title={`Restore point identified`}
        size="lg"
        footer={
          <>
            <Button onClick={onClosePreview} variant="ghost">Cancel</Button>
            <Button 
                onClick={handleRestoreClick} 
                variant="destructive"
                disabled={confirmText !== 'RESTORE'}
            >
                Restore Statement
            </Button>
          </>
        }
      >
        <div className="space-y-6">
          <div className="bg-orange-50 border border-orange-100 dark:bg-orange-950/20 dark:border-orange-900/30 p-4 rounded-lg flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400 mt-0.5 shrink-0" />
            <div className="text-sm text-orange-800 dark:text-orange-300">
              <p className="font-semibold">Destructive Action</p>
              <p>Restoring will permanently overwrite your current <code>master_statement.xlsx</code> with this version.</p>
            </div>
          </div>

          <div className="space-y-3">
             <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center">
                  <Search className="w-4 h-4 mr-2" /> Preview Sample
                </h4>
                <span className="text-xs text-muted-foreground">{selectedBackup}</span>
             </div>
             <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-muted text-muted-foreground border-b">
                    <tr>
                      <th className="px-4 py-2">Date</th>
                      <th className="px-4 py-2">Merchant</th>
                      <th className="px-4 py-2">Category</th>
                      <th className="px-4 py-2 text-right">Price</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {previewData?.map((r, i) => (
                      <tr key={i} className="hover:bg-muted/30">
                        <td className="px-4 py-2 whitespace-nowrap">{r.DATE}</td>
                        <td className="px-4 py-2 font-medium truncate max-w-[150px]">{r.MERCHANT}</td>
                        <td className="px-4 py-2">
                           <span className="px-1.5 py-0.5 bg-secondary text-secondary-foreground rounded">{r.CATEGORY}</span>
                        </td>
                        <td className="px-4 py-2 text-right font-mono">{r.PRICE}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
             </div>
          </div>

          <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
              <label className="text-sm font-medium">To confirm restoration, type <strong>RESTORE</strong> below:</label>
              <div className="relative">
                <Input 
                  type="text" 
                  value={confirmText} 
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="RESTORE"
                  className={cn(
                    "uppercase tracking-widest font-bold text-center",
                    confirmText === 'RESTORE' && "border-emerald-500 focus-visible:ring-emerald-500"
                  )}
                />
                {confirmText === 'RESTORE' && (
                  <Check className="absolute right-3 top-2.5 w-5 h-5 text-emerald-500 animate-in zoom-in" />
                )}
              </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};
