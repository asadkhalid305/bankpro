import React from 'react';
import type { UploadResponse } from '../../types';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { FileText, Calendar, Rows, Check, X } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/Card";
import { PageHeader } from '../../components/ui/PageHeader';
import { Badge } from '../../components/ui/Badge';
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
  onTypeChange: (index: number, newType: string) => void;
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
      <PageHeader
        title="Review Imports"
        description="Verify and fine-tune your transactions before they are committed to the database."
      >
        <Button onClick={onCancel} variant="outline">
          <X className="w-4 h-4 mr-2" /> Cancel Import
        </Button>
        <Button onClick={onMerge} size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20">
          <Check className="w-5 h-5 mr-2" />
          Confirm & Merge ({selectedTransactions.length})
        </Button>
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4 flex items-center gap-3">
            <FileText className="w-8 h-8 text-primary opacity-60" />
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Source</p>
              <p className="text-sm font-semibold truncate max-w-[120px]">{stagedData.metadata.source}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Calendar className="w-8 h-8 text-slate-400" />
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Period</p>
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
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Statement Rows</p>
              <p className="text-sm font-semibold">{stagedData.data.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className={cn(selectedTransactions.length > 0 ? "border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20 dark:border-emerald-900/30" : "")}>
          <CardContent className="p-4 flex items-center gap-3">
            <Check className={cn("w-8 h-8", selectedTransactions.length > 0 ? "text-emerald-500" : "text-slate-300")} />
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Selected</p>
              <p className="text-sm font-semibold">{selectedTransactions.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="relative overflow-x-auto">
            <table className="w-full text-sm text-left table-fixed">
              <thead className="text-xs uppercase bg-muted/50 text-muted-foreground border-b font-bold tracking-wider">
                <tr>
                  <th className="px-6 py-4 w-12 text-center">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-primary focus:ring-primary"
                      checked={selectedTransactions.length === stagedData.data.length}
                      onChange={onToggleAll}
                    />
                  </th>
                  <th className="px-6 py-4 font-bold w-[110px]">Date</th>
                  <th className="px-6 py-4 font-bold w-[18%]">Merchant</th>
                  <th className="px-6 py-4 font-bold w-[15%]">Details</th>
                  <th className="px-6 py-4 font-bold w-[100px]">Type</th>
                  <th className="px-6 py-4 font-bold w-[120px]">Bucket</th>
                  <th className="px-6 py-4 font-bold w-[130px]">Category</th>
                  <th className="px-6 py-4 font-bold w-[110px]">Amount</th>
                  <th className="px-6 py-4 font-bold text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {stagedData.data.map((t, i) => (
                  <tr key={i} className={cn(
                    "hover:bg-muted/30 transition-colors",
                    t.is_duplicate ? "bg-red-50/50 dark:bg-red-950/10" : "",
                    t.transaction_type === 'TRANSFER' ? "bg-blue-50/20 dark:bg-blue-900/5" : ""
                  )}>
                    <td className="px-6 py-4 text-center">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-primary focus:ring-primary"
                        checked={selectedTransactions.includes(i)}
                        onChange={() => onToggleSelect(i)}
                      />
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-muted-foreground whitespace-nowrap">{t.date}</td>
                    <td className="px-6 py-4 font-semibold text-foreground/90 max-w-[150px] truncate" title={t.merchant}>{t.merchant}</td>
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
                    <td className="px-6 py-4 font-mono font-bold whitespace-nowrap">
                      <span className={t.amount < 0 ? "text-red-600" : "text-emerald-600"}>
                        {t.amount.toFixed(2)} €
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {t.is_duplicate ? (
                        <Badge variant="destructive">Dup</Badge>
                      ) : (
                        <Badge variant="success">New</Badge>
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
