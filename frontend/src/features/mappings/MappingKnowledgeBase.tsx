import React, { useState } from 'react';
import { 
  Search, 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  X, 
  Brain,
  Info,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { CATEGORY_OPTIONS, type SortConfig } from '../../types';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

interface MappingKnowledgeBaseProps {
  mappings: [string, string][];
  search: string;
  onSearchChange: (val: string) => void;
  categoryFilter: string;
  onCategoryFilterChange: (val: string) => void;
  sortConfig: SortConfig<{ merchant: string; category: string }> | null;
  onSort: (key: 'merchant' | 'category') => void;
  selectedRows: Set<string>;
  onToggleRow: (merchant: string) => void;
  onToggleAll: () => void;
  onDelete: (merchants: string[]) => void;
  onUpdate: (oldMerchant: string | null, newMerchant: string, newCategory: string) => void;
  onAdd: (merchant: string, category: string) => void;
}

export const MappingKnowledgeBase: React.FC<MappingKnowledgeBaseProps> = ({
  mappings,
  search,
  onSearchChange,
  categoryFilter,
  onCategoryFilterChange,
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
  const [newMerchant, setNewMerchant] = useState('');
  const [newCategory, setNewCategory] = useState('Unknown');
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editMerchant, setEditMerchant] = useState('');
  const [editCategory, setEditCategory] = useState('');

  const handleAdd = () => {
    onAdd(newMerchant, newCategory);
    setNewMerchant('');
    setNewCategory('Unknown');
    setShowAddForm(false);
  };

  const handleEditClick = (merchant: string, category: string) => {
    setEditingKey(merchant);
    setEditMerchant(merchant);
    setEditCategory(category);
  };

  const handleUpdateClick = (oldMerchant: string) => {
    onUpdate(oldMerchant, editMerchant, editCategory);
    setEditingKey(null);
  };

  const SortIcon = ({ column }: { column: 'merchant' | 'category' }) => {
    if (sortConfig?.key !== column) return null;
    return sortConfig.direction === 'asc' ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mappings</h1>
          <p className="text-sm text-muted-foreground flex items-center mt-1">
            <Brain className="w-4 h-4 mr-2 text-primary" />
            Define patterns to automatically categorize future transactions.
          </p>
        </div>
        <div className="flex items-center gap-2">
           <Button onClick={() => setShowAddForm(!showAddForm)} variant={showAddForm ? 'outline' : 'default'} size="sm">
            {showAddForm ? <X className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
            {showAddForm ? 'Cancel' : 'New Mapping'}
          </Button>
        </div>
      </div>

      <div className="bg-blue-50/50 border border-blue-200 dark:bg-blue-950/20 dark:border-blue-900/30 p-4 rounded-lg flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
        <p className="text-sm text-blue-900 dark:text-blue-300">
          <strong>Pro-tip:</strong> Changes here apply only to future uploads and will not modify your master file history.
        </p>
      </div>

      <Card>
        <CardHeader className="p-4 border-b">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search merchants or categories..."
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
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <Input placeholder="Merchant Pattern (e.g. STARBUCKS)" value={newMerchant} onChange={(e) => setNewMerchant(e.target.value)} />
                <Select value={newCategory} onChange={(e) => setNewCategory(e.target.value)} options={CATEGORY_OPTIONS} />
                <Button onClick={handleAdd} className="w-full">Create Mapping</Button>
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
                      checked={selectedRows.size === mappings.length && mappings.length > 0}
                      onChange={onToggleAll}
                    />
                  </th>
                  <th onClick={() => onSort('merchant')} className="px-6 py-3 cursor-pointer hover:text-foreground transition-colors group">
                    <div className="flex items-center">Merchant Pattern <SortIcon column="merchant" /></div>
                  </th>
                  <th onClick={() => onSort('category')} className="px-6 py-3 cursor-pointer hover:text-foreground transition-colors group">
                    <div className="flex items-center">Assigned Category <SortIcon column="category" /></div>
                  </th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {mappings.map(([merchant, category]) => (
                  <tr key={merchant} className={cn(
                    "hover:bg-muted/30 transition-colors",
                    selectedRows.has(merchant) && "bg-primary/5"
                  )}>
                    <td className="px-6 py-4">
                      <input 
                        type="checkbox" 
                        className="rounded border-gray-300 text-primary focus:ring-primary"
                        checked={selectedRows.has(merchant)}
                        onChange={() => onToggleRow(merchant)}
                      />
                    </td>
                    <td className="px-6 py-4 font-medium font-mono text-xs">
                      {editingKey === merchant ? (
                        <Input value={editMerchant} onChange={(e) => setEditMerchant(e.target.value)} />
                      ) : merchant}
                    </td>
                    <td className="px-6 py-4">
                      {editingKey === merchant ? (
                        <Select value={editCategory} onChange={(e) => setEditCategory(e.target.value)} options={CATEGORY_OPTIONS} />
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          {category}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {editingKey === merchant ? (
                        <div className="flex justify-end gap-2">
                          <Button onClick={() => handleUpdateClick(merchant)} size="icon" variant="ghost" className="text-emerald-600">
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button onClick={() => setEditingKey(null)} size="icon" variant="ghost" className="text-muted-foreground">
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex justify-end gap-2">
                          <Button onClick={() => handleEditClick(merchant, category)} size="icon" variant="ghost">
                            <Edit3 className="w-4 h-4" />
                          </Button>
                          <Button onClick={() => onDelete([merchant])} size="icon" variant="ghost" className="text-destructive">
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
          {mappings.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
              <Brain className="w-12 h-12 mb-4 opacity-20" />
              <p>No mappings found. Add your first logic pattern!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
