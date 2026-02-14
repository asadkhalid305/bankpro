import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  X,
  PiggyBank
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Card, CardContent } from "@/components/ui/Card";
import { PageHeader } from '../../components/ui/PageHeader';
import { Badge } from '../../components/ui/Badge';
import { cn } from "@/lib/utils";
import { type Account } from '../../types';

interface AccountsManagerProps {
  accounts: Account[];
  buckets: string[];
  onAdd: (name: string, initialBalance: number, bucket: string, currency?: string) => void;
  onUpdate: (oldName: string, newName: string, initialBalance: number, bucket: string, currency?: string) => void;
  onDelete: (name: string) => void;
}

export const AccountsManager: React.FC<AccountsManagerProps> = ({
  accounts,
  buckets,
  onAdd,
  onUpdate,
  onDelete,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAccountName, setNewAccountName] = useState('');
  const [newInitialBalance, setNewInitialBalance] = useState<string>('0');
  const [newBucket, setNewBucket] = useState('Main');
  
  const [editingAccount, setEditingAccount] = useState<string | null>(null);
  const [editAccountName, setEditAccountName] = useState('');
  const [editInitialBalance, setEditInitialBalance] = useState<string>('0');
  const [editBucket, setEditBucket] = useState('Main');

  const handleAdd = () => {
    const balance = parseFloat(newInitialBalance);
    if (isNaN(balance)) return;
    onAdd(newAccountName, balance, newBucket);
    setNewAccountName('');
    setNewInitialBalance('0');
    setNewBucket('Main');
    setShowAddForm(false);
  };

  const handleUpdate = (oldName: string) => {
    const balance = parseFloat(editInitialBalance);
    if (isNaN(balance)) return;
    onUpdate(oldName, editAccountName, balance, editBucket);
    setEditingAccount(null);
  };

  const formatCurrency = (amount: number, currency: string = 'EUR') => {
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: currency }).format(amount);
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Physical Accounts" 
        description="Manage your bank accounts, wallets, and their initial balances."
      >
        <Button onClick={() => setShowAddForm(!showAddForm)} variant={showAddForm ? 'outline' : 'default'}>
          {showAddForm ? <X className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
          {showAddForm ? 'Cancel' : 'Add Account'}
        </Button>
      </PageHeader>

      <Card>
        <CardContent className="p-0">
          {showAddForm && (
            <div className="p-6 border-b bg-muted/30 animate-in fade-in slide-in-from-top-2">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Account Name</label>
                    <Input 
                      placeholder="e.g. Deutsche Bank" 
                      value={newAccountName} 
                      onChange={(e) => setNewAccountName(e.target.value)} 
                    />
                </div>
                <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Initial Balance</label>
                    <Input 
                      type="number"
                      step="0.01"
                      placeholder="0.00" 
                      value={newInitialBalance} 
                      onChange={(e) => setNewInitialBalance(e.target.value)} 
                    />
                </div>
                <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Logical Bucket</label>
                    <Select 
                      value={newBucket} 
                      onChange={(e) => setNewBucket(e.target.value)}
                      options={buckets}
                    />
                </div>
                <Button onClick={handleAdd} className="w-full">Create Account</Button>
              </div>
            </div>
          )}

          <div className="relative overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase bg-muted/50 text-muted-foreground border-b">
                <tr>
                  <th className="px-6 py-4 font-bold tracking-wider">Account Name</th>
                  <th className="px-6 py-4 font-bold tracking-wider">Initial Balance</th>
                  <th className="px-6 py-4 font-bold tracking-wider">Current Balance</th>
                  <th className="px-6 py-4 font-bold tracking-wider">Linked Bucket</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {accounts.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground italic">
                      No accounts defined.
                    </td>
                  </tr>
                )}
                {accounts.map(account => (
                  <tr key={account.name} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4">
                      {editingAccount === account.name ? (
                        <Input 
                          value={editAccountName} 
                          onChange={(e) => setEditAccountName(e.target.value)} 
                          className="h-8 text-sm"
                          autoFocus
                        />
                      ) : (
                        <div className="flex items-center gap-3">
                          <div className="p-1.5 bg-primary/10 rounded">
                            <PiggyBank className="w-4 h-4 text-primary" />
                          </div>
                          <span className="font-semibold text-foreground/90">{account.name}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 font-mono">
                      {editingAccount === account.name ? (
                        <Input 
                          type="number"
                          step="0.01"
                          value={editInitialBalance} 
                          onChange={(e) => setEditInitialBalance(e.target.value)} 
                          className="h-8 text-sm w-32"
                        />
                      ) : (
                        <span className="text-muted-foreground">{formatCurrency(account.initial_balance, account.currency)}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-mono font-bold">
                      <span className={account.current_balance < 0 ? "text-destructive" : "text-emerald-600"}>
                        {formatCurrency(account.current_balance, account.currency)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {editingAccount === account.name ? (
                        <Select 
                          value={editBucket} 
                          onChange={(e) => setEditBucket(e.target.value)} 
                          options={buckets}
                          className="h-8 text-xs w-32"
                        />
                      ) : (
                        <Badge variant={account.bucket === 'Kindergeld' ? 'info' : 'default'}>{account.bucket}</Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        {editingAccount === account.name ? (
                          <>
                            <Button onClick={() => handleUpdate(account.name)} size="icon" variant="ghost" className="h-8 w-8 text-emerald-600">
                              <Check className="w-4 h-4" />
                            </Button>
                            <Button onClick={() => setEditingAccount(null)} size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground">
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
                                setEditBucket(account.bucket || 'Main');
                              }} 
                              size="icon" 
                              variant="ghost"
                              className="h-8 w-8"
                            >
                              <Edit3 className="w-4 h-4" />
                            </Button>
                            <Button onClick={() => onDelete(account.name)} size="icon" variant="ghost" className="h-8 w-8 text-destructive">
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
