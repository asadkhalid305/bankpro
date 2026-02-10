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
  Globe,
  Coins
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import type { Account } from '../../types/Account';

interface AccountsManagerProps {
  accounts: Account[];
  onAdd: (name: string, initialBalance: number, currency?: string) => void;
  onUpdate: (oldName: string, newName: string, initialBalance: number, currency?: string) => void;
  onDelete: (name: string) => void;
}

export const AccountsManager: React.FC<AccountsManagerProps> = ({
  accounts,
  onAdd,
  onUpdate,
  onDelete,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAccountName, setNewAccountName] = useState('');
  const [newInitialBalance, setNewInitialBalance] = useState<string>('0');
  
  const [editingAccount, setEditingAccount] = useState<string | null>(null);
  const [editAccountName, setEditAccountName] = useState('');
  const [editInitialBalance, setEditInitialBalance] = useState<string>('0');

  const handleAdd = () => {
    const balance = parseFloat(newInitialBalance);
    if (isNaN(balance)) {
        alert("Invalid initial balance");
        return;
    }
    onAdd(newAccountName, balance);
    setNewAccountName('');
    setNewInitialBalance('0');
    setShowAddForm(false);
  };

  const handleUpdate = (oldName: string) => {
    const balance = parseFloat(editInitialBalance);
    if (isNaN(balance)) {
        alert("Invalid initial balance");
        return;
    }
    onUpdate(oldName, editAccountName, balance);
    setEditingAccount(null);
  };

  const getAccountStyle = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('cash')) return { icon: Banknote, color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' };
    if (n.includes('bank') || n.includes('sparkasse') || n.includes('deutsche')) return { icon: Landmark, color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' };
    if (n.includes('paypal') || n.includes('wise') || n.includes('revolut')) return { icon: Globe, color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' };
    if (n.includes('visa') || n.includes('mastercard') || n.includes('amex')) return { icon: CreditCard, color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' };
    if (n.includes('apple') || n.includes('google') || n.includes('pay')) return { icon: Smartphone, color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400' };
    
    return { icon: Wallet, color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' };
  };

  const formatCurrency = (amount: number, currency: string = 'EUR') => {
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: currency }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Accounts</h1>
          <p className="text-sm text-muted-foreground flex items-center mt-1">
            <Coins className="w-4 h-4 mr-2" />
            Manage your bank accounts, wallets, and payment methods.
          </p>
        </div>
        <div className="flex items-center gap-2">
           <Button onClick={() => setShowAddForm(!showAddForm)} variant={showAddForm ? 'outline' : 'default'} size="sm">
            {showAddForm ? <X className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
            {showAddForm ? 'Cancel' : 'Add Account'}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="space-y-1">
            <h3 className="font-semibold leading-none tracking-tight">Your Accounts</h3>
            <p className="text-sm text-muted-foreground">Configure accounts and their initial balances.</p>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {showAddForm && (
            <div className="p-4 border-b bg-muted/30 animate-in fade-in slide-in-from-top-2">
              <div className="flex gap-2 items-end">
                <div className="grid gap-1.5 flex-1">
                    <label className="text-xs font-medium text-muted-foreground">Account Name</label>
                    <Input 
                    placeholder="e.g. Deutsche Bank" 
                    value={newAccountName} 
                    onChange={(e) => setNewAccountName(e.target.value)} 
                    />
                </div>
                <div className="grid gap-1.5 w-32">
                    <label className="text-xs font-medium text-muted-foreground">Initial Balance</label>
                    <Input 
                    type="number"
                    step="0.01"
                    placeholder="0.00" 
                    value={newInitialBalance} 
                    onChange={(e) => setNewInitialBalance(e.target.value)} 
                    />
                </div>
                <Button onClick={handleAdd} className="shrink-0">Create</Button>
              </div>
            </div>
          )}

          <div className="divide-y">
            {accounts.length === 0 && (
              <div className="p-12 text-center text-muted-foreground italic">
                No accounts defined.
              </div>
            )}
            {accounts.map(account => {
              const style = getAccountStyle(account.name);
              const Icon = style.icon;
              const isEditing = editingAccount === account.name;

              return (
                <div key={account.name} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-4 flex-1">
                    <div className={cn("p-2 rounded-lg", style.color)}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                      {isEditing ? (
                        <>
                            <Input 
                                value={editAccountName} 
                                onChange={(e) => setEditAccountName(e.target.value)} 
                                className="h-8 text-sm"
                                autoFocus
                            />
                             <Input 
                                type="number"
                                step="0.01"
                                value={editInitialBalance} 
                                onChange={(e) => setEditInitialBalance(e.target.value)} 
                                className="h-8 text-sm w-32"
                            />
                             <div className="text-sm text-muted-foreground italic">
                                Updating...
                            </div>
                        </>
                      ) : (
                        <>
                            <p className="font-medium text-sm">{account.name}</p>
                            <div className="text-sm">
                                <span className="text-muted-foreground mr-2">Initial:</span>
                                {formatCurrency(account.initial_balance, account.currency)}
                            </div>
                            <div className="text-sm font-semibold">
                                <span className="text-muted-foreground mr-2 font-normal">Current:</span>
                                <span className={account.current_balance < 0 ? "text-destructive" : "text-emerald-600"}>
                                    {formatCurrency(account.current_balance, account.currency)}
                                </span>
                            </div>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    {isEditing ? (
                      <>
                        <Button onClick={() => handleUpdate(account.name)} size="icon" variant="ghost" className="text-emerald-600">
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button onClick={() => setEditingAccount(null)} size="icon" variant="ghost" className="text-muted-foreground">
                          <X className="w-4 h-4" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button 
                          onClick={() => {
                            setEditingAccount(account.name);
                            setEditAccountName(account.name);
                            setEditInitialBalance(account.initial_balance.toString());
                          }} 
                          size="icon" 
                          variant="ghost"
                        >
                          <Edit3 className="w-4 h-4" />
                        </Button>
                        <Button onClick={() => onDelete(account.name)} size="icon" variant="ghost" className="text-destructive">
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
