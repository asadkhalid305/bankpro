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
  ChevronDown 
} from 'lucide-react';
import { CATEGORY_OPTIONS, type Transaction, type SortConfig } from '../../types';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

interface MasterStatementProps {
  data: (Transaction & { originalIndex: number })[];
  totalCount: number;
  paymentTypes: string[];
  search: string;
  onSearchChange: (val: string) => void;
  categoryFilter: string;
  onCategoryFilterChange: (val: string) => void;
  paymentFilter: string;
  onPaymentFilterChange: (val: string) => void;
  sortConfig: SortConfig<Transaction> | null;
  onSort: (key: keyof Transaction) => void;
  selectedRows: Set<number>;
  onToggleRow: (index: number) => void;
  onToggleAll: () => void;
  onDelete: (indices: number[]) => void;
  onUpdate: (index: number, row: Transaction) => void;
  onAdd: (row: Transaction) => void;
}

export const MasterStatement: React.FC<MasterStatementProps> = ({
  data,
  totalCount,
  paymentTypes,
  search,
  onSearchChange,
  categoryFilter,
  onCategoryFilterChange,
  paymentFilter,
  onPaymentFilterChange,
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
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editRow, setEditRow] = useState<Transaction | null>(null);
  const [newRow, setNewRow] = useState<Transaction>({
    DATE: new Date().toISOString().split('T')[0],
    MERCHANT: '',
    CATEGORY: 'Unknown',
    PRICE: 0,
    PAYMENT: 'Other'
  });

  const handleEditClick = (row: Transaction & { originalIndex: number }) => {
    setEditingIndex(row.originalIndex);
    setEditRow(row);
  };

  const handleUpdateClick = (originalIndex: number) => {
    if (editRow) {
      onUpdate(originalIndex, editRow);
      setEditingIndex(null);
      setEditRow(null);
    }
  };

  const handleAddClick = () => {
    onAdd(newRow);
    setNewRow({ DATE: new Date().toISOString().split('T')[0], MERCHANT: '', CATEGORY: 'Unknown', PRICE: 0, PAYMENT: 'Other' });
    setShowAddForm(false);
  };

  const SortIcon = ({ column }: { column: keyof Transaction }) => {
    if (sortConfig?.key !== column) return null;
    return sortConfig.direction === 'asc' ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Transactions</h1>
          <p className="text-sm text-muted-foreground">
            Manage your historical records and financial data.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setShowAddForm(!showAddForm)} variant={showAddForm ? 'outline' : 'default'} size="sm">
            {showAddForm ? <X className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
            {showAddForm ? 'Cancel' : 'Add Record'}
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.open('/api/download', '_blank')}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="p-4 border-b">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search merchants..."
                className="pl-9"
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Select 
                value={categoryFilter} 
                onChange={(e) => onCategoryFilterChange(e.target.value)}
                className="w-[180px]"
              >
                <option value="All">All Categories</option>
                {CATEGORY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
              </Select>
              <Select 
                value={paymentFilter} 
                onChange={(e) => onPaymentFilterChange(e.target.value)}
                className="w-[180px]"
              >
                <option value="All">All Payments</option>
                {paymentTypes.map(c => <option key={c} value={c}>{c}</option>)}
              </Select>
            </div>
            {selectedRows.size > 0 && (
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={() => onDelete(Array.from(selectedRows))}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete ({selectedRows.size})
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {showAddForm && (
            <div className="p-4 border-b bg-muted/30 animate-in fade-in slide-in-from-top-2">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
                <Input type="date" value={newRow.DATE} onChange={(e) => setNewRow({...newRow, DATE: e.target.value})} />
                <Input placeholder="Merchant" value={newRow.MERCHANT} onChange={(e) => setNewRow({...newRow, MERCHANT: e.target.value})} />
                <Select value={newRow.CATEGORY} onChange={(e) => setNewRow({...newRow, CATEGORY: e.target.value})} options={CATEGORY_OPTIONS} />
                <Select value={newRow.PAYMENT} onChange={(e) => setNewRow({...newRow, PAYMENT: e.target.value})} options={paymentTypes} />
                <div className="flex gap-2">
                  <Input type="number" step="0.01" placeholder="Price" value={newRow.PRICE} onChange={(e) => setNewRow({...newRow, PRICE: parseFloat(e.target.value)})} />
                  <Button onClick={handleAddClick} size="icon" className="shrink-0"><Check className="w-4 h-4" /></Button>
                </div>
              </div>
            </div>
          )}

          <div className="relative overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase bg-muted/50 text-muted-foreground border-b">
                <tr>
                  <th className="px-6 py-3 w-4">
                    <input 
                      type="checkbox" 
                      className="rounded border-gray-300 text-primary focus:ring-primary"
                      checked={selectedRows.size === data.length && data.length > 0}
                      onChange={onToggleAll}
                    />
                  </th>
                  <th onClick={() => onSort('DATE')} className="px-6 py-3 cursor-pointer hover:text-foreground transition-colors group whitespace-nowrap w-[120px]">
                    <div className="flex items-center">Date <SortIcon column="DATE" /></div>
                  </th>
                  <th onClick={() => onSort('MERCHANT')} className="px-6 py-3 cursor-pointer hover:text-foreground transition-colors whitespace-nowrap">
                    <div className="flex items-center">Merchant <SortIcon column="MERCHANT" /></div>
                  </th>
                  <th onClick={() => onSort('CATEGORY')} className="px-6 py-3 cursor-pointer hover:text-foreground transition-colors whitespace-nowrap w-[150px]">
                    <div className="flex items-center">Category <SortIcon column="CATEGORY" /></div>
                  </th>
                  <th onClick={() => onSort('PRICE')} className="px-6 py-3 cursor-pointer hover:text-foreground transition-colors whitespace-nowrap w-[120px]">
                    <div className="flex items-center">Price <SortIcon column="PRICE" /></div>
                  </th>
                  <th onClick={() => onSort('PAYMENT')} className="px-6 py-3 cursor-pointer hover:text-foreground transition-colors whitespace-nowrap w-[150px]">
                    <div className="flex items-center">Payment <SortIcon column="PAYMENT" /></div>
                  </th>
                  <th className="px-6 py-3 text-right whitespace-nowrap w-[100px]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {data.map((r) => (
                  <tr key={r.originalIndex} className={cn(
                    "hover:bg-muted/30 transition-colors",
                    selectedRows.has(r.originalIndex!) && "bg-primary/5"
                  )}>
                    <td className="px-6 py-4">
                      <input 
                        type="checkbox" 
                        className="rounded border-gray-300 text-primary focus:ring-primary"
                        checked={selectedRows.has(r.originalIndex!)}
                        onChange={() => onToggleRow(r.originalIndex!)}
                      />
                    </td>
                    <td className="px-6 py-4 font-medium">
                      {editingIndex === r.originalIndex ? (
                        <Input type="date" value={editRow?.DATE} onChange={(e) => setEditRow({...editRow!, DATE: e.target.value})} />
                      ) : r.DATE}
                    </td>
                    <td className="px-6 py-4 max-w-[300px]" title={r.MERCHANT}>
                      {editingIndex === r.originalIndex ? (
                        <Input value={editRow?.MERCHANT} onChange={(e) => setEditRow({...editRow!, MERCHANT: e.target.value})} />
                      ) : (
                         <div className="truncate font-medium text-foreground/90">{r.MERCHANT}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {editingIndex === r.originalIndex ? (
                        <Select value={editRow?.CATEGORY} onChange={(e) => setEditRow({...editRow!, CATEGORY: e.target.value})} options={CATEGORY_OPTIONS} />
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          {r.CATEGORY}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-mono font-medium">
                      {editingIndex === r.originalIndex ? (
                        <Input type="number" step="0.01" value={editRow?.PRICE} onChange={(e) => setEditRow({...editRow!, PRICE: parseFloat(e.target.value)})} />
                      ) : (
                        <span className={cn(
                          r.PRICE < 0 ? "text-red-600" : "text-emerald-600"
                        )}>
                           {typeof r.PRICE === 'number' ? r.PRICE.toFixed(2) : r.PRICE}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {editingIndex === r.originalIndex ? (
                        <Select value={editRow?.PAYMENT} onChange={(e) => setEditRow({...editRow!, PAYMENT: e.target.value})} options={paymentTypes} />
                      ) : r.PAYMENT}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {editingIndex === r.originalIndex ? (
                        <div className="flex justify-end gap-2">
                          <Button onClick={() => handleUpdateClick(r.originalIndex!)} size="icon" variant="ghost" className="text-emerald-600">
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button onClick={() => setEditingIndex(null)} size="icon" variant="ghost" className="text-muted-foreground">
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex justify-end gap-2">
                          <Button onClick={() => handleEditClick(r)} size="icon" variant="ghost">
                            <Edit3 className="w-4 h-4" />
                          </Button>
                          <Button onClick={() => onDelete([r.originalIndex!])} size="icon" variant="ghost" className="text-destructive">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {data.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
              <Check className="w-12 h-12 mb-4 opacity-20" />
              <p>No transactions found matching your criteria.</p>
            </div>
          )}
        </CardContent>
        <CardHeader className="p-4 border-t bg-muted/20">
           <div className="text-xs text-muted-foreground">
             Showing {data.length} of {totalCount} total records in database.
           </div>
        </CardHeader>
      </Card>
    </div>
  );
};
