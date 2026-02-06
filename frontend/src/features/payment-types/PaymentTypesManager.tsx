import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  X,
  CreditCard,
  Banknote,
  Landmark,
  Wallet,
  Smartphone,
  Globe
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

interface PaymentTypesManagerProps {
  paymentTypes: string[];
  onAdd: (name: string) => void;
  onUpdate: (oldName: string, newName: string) => void;
  onDelete: (name: string) => void;
}

export const PaymentTypesManager: React.FC<PaymentTypesManagerProps> = ({
  paymentTypes,
  onAdd,
  onUpdate,
  onDelete,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTypeName, setNewTypeName] = useState('');
  const [editingType, setEditingType] = useState<string | null>(null);
  const [editTypeName, setEditTypeName] = useState('');

  const handleAdd = () => {
    onAdd(newTypeName);
    setNewTypeName('');
    setShowAddForm(false);
  };

  const handleUpdate = (oldName: string) => {
    onUpdate(oldName, editTypeName);
    setEditingType(null);
  };

  const getPaymentStyle = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('cash')) return { icon: Banknote, color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' };
    if (n.includes('bank') || n.includes('sparkasse') || n.includes('deutsche')) return { icon: Landmark, color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' };
    if (n.includes('paypal') || n.includes('wise') || n.includes('revolut')) return { icon: Globe, color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' };
    if (n.includes('visa') || n.includes('mastercard') || n.includes('amex')) return { icon: CreditCard, color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' };
    if (n.includes('apple') || n.includes('google') || n.includes('pay')) return { icon: Smartphone, color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400' };
    
    return { icon: Wallet, color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' };
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Payment Methods</h1>
          <p className="text-sm text-muted-foreground flex items-center mt-1">
            <CreditCard className="w-4 h-4 mr-2" />
            Manage accounts and cards used for your transactions.
          </p>
        </div>
        <div className="flex items-center gap-2">
           <Button onClick={() => setShowAddForm(!showAddForm)} variant={showAddForm ? 'outline' : 'default'} size="sm">
            {showAddForm ? <X className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
            {showAddForm ? 'Cancel' : 'Add Payment Type'}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="space-y-1">
            <h3 className="font-semibold leading-none tracking-tight">Available Methods</h3>
            <p className="text-sm text-muted-foreground">Configure the identifiers used to group your spending habits.</p>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {showAddForm && (
            <div className="p-4 border-b bg-muted/30 animate-in fade-in slide-in-from-top-2">
              <div className="flex gap-2">
                <Input 
                  placeholder="New Payment Type (e.g. AMEX Gold)" 
                  value={newTypeName} 
                  onChange={(e) => setNewTypeName(e.target.value)} 
                />
                <Button onClick={handleAdd} className="shrink-0">Create</Button>
              </div>
            </div>
          )}

          <div className="divide-y">
            {paymentTypes.length === 0 && (
              <div className="p-12 text-center text-muted-foreground italic">
                No payment methods defined.
              </div>
            )}
            {paymentTypes.map(pt => {
              const style = getPaymentStyle(pt);
              const Icon = style.icon;
              return (
                <div key={pt} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-4 flex-1">
                    <div className={cn("p-2 rounded-lg", style.color)}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      {editingType === pt ? (
                        <Input 
                          value={editTypeName} 
                          onChange={(e) => setEditTypeName(e.target.value)} 
                          className="max-w-xs h-8 text-sm"
                          autoFocus
                        />
                      ) : (
                        <p className="font-medium text-sm">{pt}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {editingType === pt ? (
                      <>
                        <Button onClick={() => handleUpdate(pt)} size="icon" variant="ghost" className="text-emerald-600">
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button onClick={() => setEditingType(null)} size="icon" variant="ghost" className="text-muted-foreground">
                          <X className="w-4 h-4" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button 
                          onClick={() => {
                            setEditingType(pt);
                            setEditTypeName(pt);
                          }} 
                          size="icon" 
                          variant="ghost"
                        >
                          <Edit3 className="w-4 h-4" />
                        </Button>
                        <Button onClick={() => onDelete(pt)} size="icon" variant="ghost" className="text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
