import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  Tag, 
  Check, 
  X, 
  Edit3,
  AlertCircle
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { PageHeader } from '../../components/ui/PageHeader';
import { cn } from "@/lib/utils";

interface CategoriesManagerProps {
  categories: string[];
  onAdd: (name: string) => Promise<boolean>;
  onUpdate: (oldName: string, newName: string) => Promise<boolean>;
  onDelete: (name: string) => Promise<boolean>;
}

export const CategoriesManager: React.FC<CategoriesManagerProps> = ({
  categories,
  onAdd,
  onUpdate,
  onDelete
}) => {
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingName, setEditingName] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const handleAdd = async () => {
    if (!newCategoryName.trim()) return;
    const success = await onAdd(newCategoryName.trim());
    if (success) setNewCategoryName('');
  };

  const handleEditClick = (name: string) => {
    setEditingName(name);
    setEditValue(name);
  };

  const handleUpdate = async () => {
    if (!editingName || !editValue.trim() || editingName === editValue) {
      setEditingName(null);
      return;
    }
    const success = await onUpdate(editingName, editValue.trim());
    if (success) setEditingName(null);
  };

  return (
    <div className="space-y-8 pb-12">
      <PageHeader 
        title="Category Manager" 
        description="Organize your spending by defining and managing expense categories."
      />

      <div className="grid gap-8 md:grid-cols-12">
        {/* ADD CATEGORY */}
        <div className="md:col-span-4 space-y-6">
          <Card className="border-primary/20 shadow-lg">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Plus className="w-4 h-4 text-primary" />
                New Category
              </CardTitle>
              <CardDescription>Create a new category for classification.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Name</label>
                <Input 
                  placeholder="e.g. Subscriptions" 
                  value={newCategoryName} 
                  onChange={(e) => setNewCategoryName(e.target.value)} 
                  onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                />
              </div>
              <Button onClick={handleAdd} className="w-full" disabled={!newCategoryName.trim()}>
                Add Category
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-muted/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs uppercase tracking-widest text-muted-foreground font-bold flex items-center gap-2">
                <AlertCircle className="w-3 h-3" />
                Note
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground leading-relaxed">
              Renaming a category will automatically update all existing transactions, rules, and budgets associated with it. 
              Be careful when deleting categories that are currently in use.
            </CardContent>
          </Card>
        </div>

        {/* CATEGORY LIST */}
        <div className="md:col-span-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Active Categories</CardTitle>
              <CardDescription>View and manage your current expense classifications.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y border-t">
                {categories.length === 0 ? (
                  <div className="p-12 text-center text-muted-foreground italic">
                    No categories defined.
                  </div>
                ) : (
                  categories.sort().map((cat) => (
                    <div key={cat} className={cn(
                      "flex items-center justify-between p-4 hover:bg-muted/30 transition-all group",
                      editingName === cat && "bg-primary/5"
                    )}>
                      <div className="flex items-center gap-4 flex-1">
                        <div className="p-2 bg-muted rounded-lg group-hover:bg-primary/10 transition-colors">
                          <Tag className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                        
                        {editingName === cat ? (
                          <div className="flex items-center gap-2 flex-1 max-w-sm">
                            <Input 
                              value={editValue} 
                              onChange={(e) => setEditValue(e.target.value)}
                              className="h-8 text-sm"
                              autoFocus
                              onKeyDown={(e) => e.key === 'Enter' && handleUpdate()}
                            />
                            <Button onClick={handleUpdate} size="icon" variant="ghost" className="h-8 w-8 text-emerald-600">
                              <Check className="w-4 h-4" />
                            </Button>
                            <Button onClick={() => setEditingName(null)} size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground">
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ) : (
                          <span className="font-semibold text-foreground/80 tracking-wide uppercase text-sm">{cat}</span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8" 
                          onClick={() => handleEditClick(cat)}
                          disabled={['Unknown', 'Salary', 'Benefit'].includes(cat)}
                        >
                          <Edit3 className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-destructive"
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to delete "${cat}"? This might leave some transactions uncategorized.`)) {
                              onDelete(cat);
                            }
                          }}
                          disabled={['Unknown', 'Salary', 'Benefit'].includes(cat)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};