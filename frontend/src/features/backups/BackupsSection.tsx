import React from 'react';
import { 
  FileStack, 
  RotateCcw, 
  X,
  History,
  Calendar,
  Database
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { PageHeader } from '../../components/ui/PageHeader';
import { Badge } from '../../components/ui/Badge';
import { cn } from "@/lib/utils";
import type { Backup } from '../../types';

interface BackupsSectionProps {
  backups: Backup[];
  onPreview: (filename: string) => void;
  previewData: any[] | null;
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
  return (
    <div className="space-y-6">
      <PageHeader 
        title="System Backups" 
        description="Access historical snapshots of your master statement and restore previous versions."
      />

      <div className="grid gap-6 lg:grid-cols-12">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
                <History className="w-5 h-5 text-primary" />
                Backup History
            </CardTitle>
            <CardDescription>Generated every time you merge new data.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y max-h-[600px] overflow-y-auto">
              {backups.length === 0 && (
                <div className="p-12 text-center text-muted-foreground italic">
                  No backups found yet.
                </div>
              )}
              {backups.map((backup) => (
                <div 
                  key={backup.filename} 
                  className={cn(
                    "flex flex-col p-4 hover:bg-muted/30 transition-colors cursor-pointer group",
                    selectedBackup === backup.filename && "bg-primary/5 border-l-2 border-primary"
                  )}
                  onClick={() => onPreview(backup.filename)}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-sm truncate">{backup.filename}</span>
                    <Badge variant="default">{backup.size}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3 mr-1" />
                      {backup.date}
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-emerald-600" onClick={(e) => { e.stopPropagation(); onRestore(backup.filename); }}>
                            <RotateCcw className="w-3.5 h-3.5" />
                        </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-8">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                  <Database className="w-5 h-5 text-primary" />
                  Backup Preview
              </CardTitle>
              <CardDescription>
                {selectedBackup ? `Viewing contents of ${selectedBackup}` : 'Select a backup from the list to see its contents.'}
              </CardDescription>
            </div>
            {previewData && (
              <Button size="icon" variant="ghost" onClick={onClosePreview}>
                <X className="w-4 h-4" />
              </Button>
            )}
          </CardHeader>
          <CardContent className="p-0">
            {!previewData ? (
              <div className="flex flex-col items-center justify-center py-32 text-muted-foreground bg-muted/10">
                <FileStack className="w-12 h-12 mb-4 opacity-20" />
                <p>No backup selected for preview</p>
              </div>
            ) : (
              <div className="relative overflow-x-auto max-h-[550px]">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs uppercase bg-muted/50 text-muted-foreground border-b font-bold sticky top-0 z-10">
                    <tr>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Merchant</th>
                      <th className="px-4 py-3">Category</th>
                      <th className="px-4 py-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {previewData.map((row, i) => (
                      <tr key={i} className="hover:bg-muted/20">
                        <td className="px-4 py-3 text-xs">{row.DATE || row.date}</td>
                        <td className="px-4 py-3 font-medium text-xs truncate max-w-[200px]">{row.MERCHANT || row.merchant}</td>
                        <td className="px-4 py-3 text-xs">
                            <Badge variant="default">{row.CATEGORY || row.category}</Badge>
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-xs">
                          {(row.PRICE || row.amount || 0).toFixed(2)} €
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};