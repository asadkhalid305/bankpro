import React, { useState } from 'react';
import { 
  Search, 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  X, 
  Brain,
  ChevronUp,
  ChevronDown,
  RotateCcw
} from 'lucide-react';
import { type SortConfig } from '../../types';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { PageHeader } from '../../components/ui/PageHeader';
import { Badge } from '../../components/ui/Badge';
import { cn } from "@/lib/utils";
import { type Mapping } from '../../hooks/useMappings';

interface MappingKnowledgeBaseProps {
  mappings: Mapping[];
  categories: string[];
  buckets: string[];
  search: string;
  onSearchChange: (val: string) => void;
  categoryFilter: string;
  onCategoryFilterChange: (val: string) => void;
  sortConfig: SortConfig<Mapping> | null;
  onSort: (key: keyof Mapping) => void;
  selectedRows: Set<string>;
  onToggleRow: (pattern: string) => void;
  onToggleAll: () => void;
  onDelete: (patterns: string[]) => void;
  onUpdate: (oldPattern: string | null, newPattern: string, newCategory: string, bucket: string) => void;
  onAdd: (pattern: string, category: string, bucket: string) => void;
}

export const MappingKnowledgeBase: React.FC<MappingKnowledgeBaseProps> = ({
  mappings,
  categories,
  buckets,
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
  const [newPattern, setNewPattern] = useState('');
  const [newCategory, setNewCategory] = useState('Unknown');
  const [newBucket, setNewBucket] = useState('Main');
  
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editPattern, setEditPattern] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editBucket, setEditBucket] = useState('');

  const handleAdd = () => {
    onAdd(newPattern, newCategory, newBucket);
    setNewPattern('');
    setNewCategory('Unknown');
    setNewBucket('Main');
    setShowAddForm(false);
  };

  const handleEditClick = (m: Mapping) => {
    setEditingKey(m.pattern);
    setEditPattern(m.pattern);
    setEditCategory(m.category);
    setEditBucket(m.bucket);
  };

  const handleUpdateClick = (oldPattern: string) => {
    onUpdate(oldPattern, editPattern, editCategory, editBucket);
    setEditingKey(null);
  };

  const SortIcon = ({ column }: { column: keyof Mapping }) => {
    if (sortConfig?.key !== column) return null;
    return sortConfig.direction === 'asc' ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />;
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Categorization Rules" 
        description="Patterns used to automatically assign categories and buckets to your transactions."
      >
        <Button onClick={() => setShowAddForm(!showAddForm)} variant={showAddForm ? 'outline' : 'default'}>
          {showAddForm ? <X className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
          {showAddForm ? 'Cancel' : 'New Rule'}
        </Button>
      </PageHeader>

      <Card>
        <CardHeader className="p-4 border-b">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search rules..."
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
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </Select>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-9 px-2 text-muted-foreground hover:text-foreground"
                onClick={() => {
                  onSearchChange('');
                  onCategoryFilterChange('All');
                }}
                title="Clear all filters"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
            </div>
            {selectedRows.size > 0 && (
              <Button 
                variant="destructive" 
                size="sm" 
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
              <div className="grid grid-cols-1 gap-4 md:grid-cols-4 items-end">
                <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Pattern</label>
                    <Input placeholder="e.g. REWE" value={newPattern} onChange={(e) => setNewPattern(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Category</label>
                    <Select value={newCategory} onChange={(e) => setNewCategory(e.target.value)} options={categories} />
                </div>
                <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Bucket</label>
                    <Select value={newBucket} onChange={(e) => setNewBucket(e.target.value)} options={buckets} />
                </div>
                <Button onClick={handleAdd} className="w-full">Create Rule</Button>
              </div>
            </div>
          )}

          <div className="relative overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase bg-muted/50 text-muted-foreground border-b">
                <tr>
                  <th className="px-6 py-4 w-12">
                    <input 
                      type="checkbox" 
                      className="rounded border-gray-300 text-primary focus:ring-primary"
                      checked={selectedRows.size === mappings.length && mappings.length > 0}
                      onChange={onToggleAll}
                    />
                  </th>
                  <th onClick={() => onSort('pattern')} className="px-6 py-4 cursor-pointer hover:text-foreground transition-colors">
                    <div className="flex items-center">Pattern <SortIcon column="pattern" /></div>
                  </th>
                  <th onClick={() => onSort('category')} className="px-6 py-4 cursor-pointer hover:text-foreground transition-colors">
                    <div className="flex items-center">Category <SortIcon column="category" /></div>
                  </th>
                  <th onClick={() => onSort('bucket')} className="px-6 py-4 cursor-pointer hover:text-foreground transition-colors">
                    <div className="flex items-center">Bucket <SortIcon column="bucket" /></div>
                  </th>
                  <th className="px-6 py-4 text-right w-24">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {mappings.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground italic">
                      No categorization rules found.
                    </td>
                  </tr>
                )}
                {mappings.map((m) => (
                  <tr key={m.pattern} className={cn(
                    "hover:bg-muted/30 transition-colors",
                    selectedRows.has(m.pattern) && "bg-primary/5"
                  )}>
                    <td className="px-6 py-4">
                      <input 
                        type="checkbox" 
                        className="rounded border-gray-300 text-primary focus:ring-primary"
                        checked={selectedRows.has(m.pattern)}
                        onChange={() => onToggleRow(m.pattern)}
                      />
                    </td>
                    <td className="px-6 py-4 font-mono text-xs">
                      {editingKey === m.pattern ? (
                        <Input value={editPattern} onChange={(e) => setEditPattern(e.target.value)} className="h-8" />
                      ) : m.pattern}
                    </td>
                    <td className="px-6 py-4">
                      {editingKey === m.pattern ? (
                        <Select value={editCategory} onChange={(e) => setEditCategory(e.target.value)} options={categories} className="h-8 text-xs" />
                      ) : (
                        <Badge variant="default">{m.category}</Badge>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {editingKey === m.pattern ? (
                        <Select value={editBucket} onChange={(e) => setEditBucket(e.target.value)} options={buckets} className="h-8 text-xs" />
                      ) : (
                        <Badge variant={m.bucket === 'Kindergeld' ? 'info' : 'default'}>{m.bucket}</Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        {editingKey === m.pattern ? (
                          <>
                            <Button onClick={() => handleUpdateClick(m.pattern)} size="icon" variant="ghost" className="h-8 w-8 text-emerald-600">
                              <Check className="w-4 h-4" />
                            </Button>
                            <Button onClick={() => setEditingKey(null)} size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground">
                              <X className="w-4 h-4" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button onClick={() => handleEditClick(m)} size="icon" variant="ghost" className="h-8 w-8">
                              <Edit3 className="w-4 h-4" />
                            </Button>
                            <Button onClick={() => onDelete([m.pattern])} size="icon" variant="ghost" className="h-8 w-8 text-destructive">
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
        </CardContent>
      </Card>
    </div>
  );
};
