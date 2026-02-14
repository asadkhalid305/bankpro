import React, { useState } from 'react';
import { 
  Search, 
  Download, 
  Trash2, 
  Plus, 
  Edit3, 
  Check, 
  X, 
  ChevronUp, 
  ChevronDown,
  Filter,
  RotateCcw
} from 'lucide-react';import { TYPE_OPTIONS, type Transaction, type SortConfig } from '../../types';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { PageHeader } from '../../components/ui/PageHeader';
import { Badge } from '../../components/ui/Badge';
import { api } from '../../lib/api';
import { cn } from "@/lib/utils";

interface MasterStatementProps {
  data: Transaction[];
  totalCount: number;
  categories: string[];
  buckets: string[];
  paymentTypes: string[];
  search: string;
  onSearchChange: (val: string) => void;
  categoryFilter: string;
  onCategoryFilterChange: (val: string) => void;
  accountFilter: string;
  onAccountFilterChange: (val: string) => void;
  bucketFilter: string;
  onBucketFilterChange: (val: string) => void;
  sortConfig: SortConfig<Transaction> | null;
  onSort: (key: keyof Transaction) => void;
  selectedRows: Set<number>;
  onToggleRow: (id: number) => void;
  onToggleAll: () => void;
  onDelete: (ids: number[]) => void;
  onUpdate: (id: number, updates: Partial<Transaction>) => void;
  onAdd: (row: Partial<Transaction>) => void;
}

export const MasterStatement: React.FC<MasterStatementProps> = ({
  data,
  totalCount,
  categories,
  buckets,
  paymentTypes,
  search,
  onSearchChange,
  categoryFilter,
  onCategoryFilterChange,
  accountFilter,
  onAccountFilterChange,
  bucketFilter,
  onBucketFilterChange,
  sortConfig,
  onSort,
  selectedRows,
  onToggleRow,
  onToggleAll,
  onDelete,
  onUpdate,
  onAdd
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editRow, setEditRow] = useState<Partial<Transaction>>({});

  const [newRow, setNewRow] = useState<Partial<Transaction>>({
    date: new Date().toISOString().split('T')[0],
    merchant: '',
    details: '',
    category: 'Unknown',
    amount: 0,
    account: paymentTypes[0] || 'Cash',
    bucket: 'Main',
    transaction_type: 'EXPENSE'
  });

  const handleEditClick = (row: Transaction) => {
    setEditingId(row.id!);
    setEditRow(row);
  };

  const handleUpdateSave = (id: number) => {
    onUpdate(id, editRow);
    setEditingId(null);
  };

  const handleAddClick = () => {
    onAdd(newRow);
    setNewRow({
      date: new Date().toISOString().split('T')[0],
      merchant: '',
      details: '',
      category: 'Unknown',
      amount: 0,
      account: paymentTypes[0] || 'Cash',
      bucket: 'Main',
      transaction_type: 'EXPENSE'
    });
    setShowAddForm(false);
  };

  const SortIcon = ({ column }: { column: keyof Transaction }) => {
    if (sortConfig?.key !== column) return null;
    return sortConfig.direction === 'asc' ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Transaction Log"
        description="Central database of all your financial records and movements."
      >
        <Button onClick={() => setShowAddForm(!showAddForm)} variant={showAddForm ? 'outline' : 'default'}>
          {showAddForm ? <X className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
          {showAddForm ? 'Cancel' : 'Manual Entry'}
        </Button>
        <Button variant="outline" onClick={() => window.open(`${api.baseUrl}/export/targetV2`, '_blank')}>
          <Download className="w-4 h-4 mr-2" />
          Export
        </Button>
      </PageHeader>

      <Card>
        <CardHeader className="p-4 border-b">
          <div className="flex flex-col gap-4 md:grid md:grid-cols-12 md:items-center">
            <div className="relative col-span-4">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search history..."
                className="pl-9"
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
              />
            </div>
                        <div className="col-span-8 flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
                          <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
                          <Select 
                            value={bucketFilter} 
                            onChange={(e) => onBucketFilterChange(e.target.value)}
                            className="w-[140px] shrink-0"
                          >
                            <option value="All">All Buckets</option>
                            {buckets.map(b => <option key={b} value={b}>{b}</option>)}
                          </Select>
                          <Select 
                            value={accountFilter} 
                            onChange={(e) => onAccountFilterChange(e.target.value)}
                            className="w-[140px] shrink-0"
                          >
                            <option value="All">All Accounts</option>
                            {paymentTypes.map(c => <option key={c} value={c}>{c}</option>)}
                          </Select>
                          <Select 
                            value={categoryFilter} 
                            onChange={(e) => onCategoryFilterChange(e.target.value)}
                            className="w-[140px] shrink-0"
                          >
                            <option value="All">All Categories</option>
                            {categories.map(c => <option key={c} value={c}>{c}</option>)}
                          </Select>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-9 px-2 text-muted-foreground hover:text-foreground"
                            onClick={() => {
                              onSearchChange('');
                              onBucketFilterChange('All');
                              onAccountFilterChange('All');
                              onCategoryFilterChange('All');
                            }}
                            title="Clear all filters"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </Button>
                        </div>            {selectedRows.size > 0 && (
              <Button
                variant="destructive"
                size="sm"
                className="col-span-full mt-2"
                onClick={() => onDelete(Array.from(selectedRows))}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Selected ({selectedRows.size})
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {showAddForm && (
            <div className="p-6 border-b bg-muted/30 animate-in fade-in slide-in-from-top-2">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-9 items-end">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Date</label>
                  <Input type="date" value={newRow.date} onChange={(e) => setNewRow({ ...newRow, date: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Merchant</label>
                  <Input placeholder="Who" value={newRow.merchant} onChange={(e) => setNewRow({ ...newRow, merchant: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Type</label>
                  <Select value={newRow.transaction_type} onChange={(e) => setNewRow({ ...newRow, transaction_type: e.target.value as any })} options={TYPE_OPTIONS} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Details</label>
                  <Input placeholder="Ref/Order#" value={newRow.details} onChange={(e) => setNewRow({ ...newRow, details: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Amount</label>
                  <Input type="number" step="0.01" value={newRow.amount} onChange={(e) => setNewRow({ ...newRow, amount: parseFloat(e.target.value) })} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Account</label>
                  <Select value={newRow.account} onChange={(e) => setNewRow({ ...newRow, account: e.target.value })} options={paymentTypes} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Bucket</label>
                  <Select value={newRow.bucket} onChange={(e) => setNewRow({ ...newRow, bucket: e.target.value })} options={buckets} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Category</label>
                  <Select value={newRow.category} onChange={(e) => setNewRow({ ...newRow, category: e.target.value })} options={categories} />
                </div>
                <Button onClick={handleAddClick} className="w-full">Save Entry</Button>
              </div>
            </div>
          )}

          <div className="relative overflow-x-auto">
            <table className="w-full text-sm text-left table-fixed">
              <thead className="text-xs uppercase bg-muted/50 text-muted-foreground border-b font-bold tracking-wider">
                <tr>
                  <th className="px-6 py-4 w-12 text-center">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-primary focus:ring-primary"
                      checked={selectedRows.size === data.length && data.length > 0}
                      onChange={onToggleAll}
                    />
                  </th>
                  <th onClick={() => onSort('date')} className="px-6 py-4 cursor-pointer hover:text-foreground transition-colors w-[110px]">
                    <div className="flex items-center">Date <SortIcon column="date" /></div>
                  </th>
                  <th onClick={() => onSort('merchant')} className="px-6 py-4 cursor-pointer hover:text-foreground transition-colors w-[18%]">
                    <div className="flex items-center">Merchant <SortIcon column="merchant" /></div>
                  </th>
                  <th onClick={() => onSort('transaction_type')} className="px-6 py-4 cursor-pointer hover:text-foreground transition-colors w-[100px]">
                    <div className="flex items-center">Type <SortIcon column="transaction_type" /></div>
                  </th>
                  <th onClick={() => onSort('details')} className="px-6 py-4 cursor-pointer hover:text-foreground transition-colors w-[15%]">
                    <div className="flex items-center">Details <SortIcon column="details" /></div>
                  </th>
                  <th onClick={() => onSort('category')} className="px-6 py-4 cursor-pointer hover:text-foreground transition-colors w-[130px]">
                    <div className="flex items-center">Category <SortIcon column="category" /></div>
                  </th>
                  <th onClick={() => onSort('bucket')} className="px-6 py-4 cursor-pointer hover:text-foreground transition-colors w-[110px]">
                    <div className="flex items-center">Bucket <SortIcon column="bucket" /></div>
                  </th>
                  <th onClick={() => onSort('amount')} className="px-6 py-4 cursor-pointer hover:text-foreground transition-colors w-[110px]">
                    <div className="flex items-center">Amount <SortIcon column="amount" /></div>
                  </th>
                  <th onClick={() => onSort('account')} className="px-6 py-4 cursor-pointer hover:text-foreground transition-colors w-[120px]">
                    <div className="flex items-center">Account <SortIcon column="account" /></div>
                  </th>
                  <th className="px-6 py-4 text-right w-[100px]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {data.map((r) => (
                  <tr key={r.id} className={cn(
                    "hover:bg-muted/30 transition-colors",
                    selectedRows.has(r.id!) && "bg-primary/5",
                    r.transaction_type === 'TRANSFER' && "bg-blue-50/20 dark:bg-blue-900/5"
                  )}>
                    <td className="px-6 py-4 text-center">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-primary focus:ring-primary"
                        checked={selectedRows.has(r.id!)}
                        onChange={() => onToggleRow(r.id!)}
                      />
                    </td>
                    <td className="px-6 py-4 text-xs text-muted-foreground whitespace-nowrap font-medium">
                      {editingId === r.id ? (
                        <Input type="date" className="h-8 text-xs px-1" value={editRow.date} onChange={e => setEditRow({ ...editRow, date: e.target.value })} />
                      ) : r.date}
                    </td>
                    <td className="px-6 py-4">
                      {editingId === r.id ? (
                        <Input className="h-8 text-xs" value={editRow.merchant} onChange={e => setEditRow({ ...editRow, merchant: e.target.value })} />
                      ) : (
                        <div className="font-semibold text-foreground/90 break-words leading-tight">{r.merchant}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {editingId === r.id ? (
                        <Select value={editRow.transaction_type} onChange={e => setEditRow({ ...editRow, transaction_type: e.target.value as any })} options={TYPE_OPTIONS} className="h-8 text-[10px] font-bold" />
                      ) : (
                        <Badge variant={r.transaction_type === 'EXPENSE' ? 'destructive' : r.transaction_type === 'INCOME' ? 'success' : 'info'}>
                          {r.transaction_type}
                        </Badge>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {editingId === r.id ? (
                        <Input className="h-8 text-xs" value={editRow.details} onChange={e => setEditRow({ ...editRow, details: e.target.value })} />
                      ) : (
                        <div className="text-[10px] text-muted-foreground truncate" title={r.details}>{r.details || "-"}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {editingId === r.id ? (
                        <Select value={editRow.category} onChange={e => setEditRow({ ...editRow, category: e.target.value })} options={categories} className="h-8 text-xs" />
                      ) : (
                        <Badge variant="default">{r.category}</Badge>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {editingId === r.id ? (
                        <Select value={editRow.bucket} onChange={e => setEditRow({ ...editRow, bucket: e.target.value })} options={buckets} className="h-8 text-xs" />
                      ) : (
                        <Badge variant={r.bucket === 'Kindergeld' ? 'info' : 'default'}>{r.bucket}</Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 font-mono font-bold whitespace-nowrap">
                      {editingId === r.id ? (
                        <Input type="number" step="0.01" className="h-8 text-xs" value={editRow.amount} onChange={e => setEditRow({ ...editRow, amount: parseFloat(e.target.value) })} />
                      ) : (
                        <span className={cn(
                          r.transaction_type === 'TRANSFER' ? "text-slate-500" :
                            r.amount < 0 ? "text-red-600" : "text-emerald-600"
                        )}>
                          {r.amount.toFixed(2)} €
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-muted-foreground">
                      {editingId === r.id ? (
                        <Select value={editRow.account} onChange={e => setEditRow({ ...editRow, account: e.target.value })} options={paymentTypes} className="h-8 text-xs" />
                      ) : r.account}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1">
                        {editingId === r.id ? (
                          <>
                            <Button onClick={() => handleUpdateSave(r.id!)} size="icon" variant="ghost" className="h-8 w-8 text-emerald-600">
                              <Check className="w-4 h-4" />
                            </Button>
                            <Button onClick={() => setEditingId(null)} size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground">
                              <X className="w-4 h-4" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button onClick={() => handleEditClick(r)} size="icon" variant="ghost" className="h-8 w-8">
                              <Edit3 className="w-4 h-4" />
                            </Button>
                            <Button onClick={() => onDelete([r.id!])} size="icon" variant="ghost" className="text-destructive h-8 w-8">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {data.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <Search className="w-8 h-8 opacity-20" />
              </div>
              <p className="text-lg font-medium">No results found</p>
              <p className="text-sm">Try adjusting your filters or importing more data.</p>
            </div>
          )}
        </CardContent>
        <CardHeader className="p-4 border-t bg-muted/20">
          <div className="text-xs text-muted-foreground font-semibold uppercase tracking-widest">
            Total Records: {totalCount} | Filtered: {data.length}
          </div>
        </CardHeader>
      </Card>
    </div>
  );
};