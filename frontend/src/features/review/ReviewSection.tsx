import React from 'react';
import type { UploadResponse } from '../../types';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { AlertCircle, CheckCircle2, FileText, Calendar, Rows, Check } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import { TYPE_OPTIONS } from '../../types';

interface ReviewSectionProps {
  stagedData: UploadResponse;
  selectedTransactions: number[];
  categories: string[];
  buckets: string[];
  onCancel: () => void;
  onMerge: () => void;
  onCategoryChange: (index: number, newCategory: string) => void;
  onBucketChange: (index: number, newBucket: string) => void;
  onTypeChange: (index: number, newType: any) => void;
  onToggleSelect: (index: number) => void;
  onToggleAll: () => void;
}

export const ReviewSection: React.FC<ReviewSectionProps> = ({
  stagedData,
  selectedTransactions,
  categories,
  buckets,
  onCancel,
  onMerge,
  onCategoryChange,
  onBucketChange,
  onTypeChange,
  onToggleSelect,
  onToggleAll
}) => {
  if (!stagedData.data || !stagedData.metadata) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Review Imports</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Verify categorized transactions before merging them into your master file.
            <span className="block mt-1 font-medium text-amber-600 dark:text-amber-400">
              ⚠️ No changes have been saved to the database yet.
            </span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={onCancel} variant="outline">Re-upload / Cancel</Button>
          <Button onClick={onMerge} size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 shadow-lg shadow-emerald-500/20">
            <Check className="w-5 h-5 mr-2" />
            Confirm & Merge ({selectedTransactions.length})
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4 flex items-center gap-3">
            <FileText className="w-8 h-8 text-primary opacity-60" />
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Source</p>
              <p className="text-sm font-semibold truncate max-w-[120px]">{stagedData.metadata.source}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Calendar className="w-8 h-8 text-slate-400" />
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Period</p>
              <p className="text-sm font-semibold">
                {stagedData.metadata.start_date} to {stagedData.metadata.end_date}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Rows className="w-8 h-8 text-slate-400" />
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Rows</p>
              <p className="text-sm font-semibold">{stagedData.data.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className={cn(selectedTransactions.length > 0 ? "border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20 dark:border-emerald-900/30" : "")}>
          <CardContent className="p-4 flex items-center gap-3">
            <CheckCircle2 className={cn("w-8 h-8", selectedTransactions.length > 0 ? "text-emerald-500" : "text-slate-300")} />
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">To Import</p>
              <p className="text-sm font-semibold">{selectedTransactions.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="relative overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase bg-muted/50 text-muted-foreground border-b">
                <tr>
                  <th className="px-6 py-3 w-4">
                    <input 
                      type="checkbox" 
                      className="rounded border-gray-300 text-primary focus:ring-primary"
                      checked={selectedTransactions.length === stagedData.data.length}
                      onChange={onToggleAll}
                    />
                  </th>
                  <th className="px-6 py-3 font-medium">Date</th>
                  <th className="px-6 py-3 font-medium">Merchant</th>
                  <th className="px-6 py-3 font-medium">Details</th>
                  <th className="px-6 py-3 font-medium">Type</th>
                  <th className="px-6 py-3 font-medium">Bucket</th>
                  <th className="px-6 py-3 font-medium">Category</th>
                  <th className="px-6 py-3 font-medium">Amount</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {stagedData.data.map((t, i) => (
                  <tr key={i} className={cn(
                    "hover:bg-muted/30 transition-colors",
                    t.is_duplicate ? "bg-red-50/50 dark:bg-red-950/10" : "",
                    t.transaction_type === 'TRANSFER' ? "bg-blue-50/20 dark:bg-blue-900/5" : ""
                  )}>
                    <td className="px-6 py-4">
                      <input 
                        type="checkbox" 
                        className="rounded border-gray-300 text-primary focus:ring-primary"
                        checked={selectedTransactions.includes(i)} 
                        onChange={() => onToggleSelect(i)}
                      />
                    </td>
                    <td className="px-6 py-4 text-xs whitespace-nowrap">{t.date}</td>
                    <td className="px-6 py-4 font-medium max-w-[150px] truncate" title={t.merchant}>{t.merchant}</td>
                    <td className="px-6 py-4 text-[10px] text-muted-foreground max-w-[200px] truncate" title={t.details}>
                        {t.details || "-"}
                    </td>
                    <td className="px-6 py-4">
                      <Select 
                        value={t.transaction_type} 
                        onChange={(e) => onTypeChange(i, e.target.value)}
                        options={TYPE_OPTIONS}
                        className="h-8 text-[10px] font-bold max-w-[100px]"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <Select 
                        value={t.bucket} 
                        onChange={(e) => onBucketChange(i, e.target.value)}
                        options={buckets}
                        className="h-8 text-xs max-w-[120px]"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <Select 
                        value={t.category} 
                        onChange={(e) => onCategoryChange(i, e.target.value)}
                        options={categories}
                        className="h-8 text-xs max-w-[150px]"
                      />
                    </td>
                    <td className="px-6 py-4 font-mono font-medium whitespace-nowrap">
                       <span className={t.amount < 0 ? "text-red-600" : "text-emerald-600"}>
                         {t.amount.toFixed(2)} €
                       </span>
                    </td>
                    <td className="px-6 py-4">
                      {t.is_duplicate ? (
                        <span className="inline-flex items-center text-[10px] font-semibold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
                          Dup
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-[10px] font-semibold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">
                          New
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};