import React, { useState } from 'react';
import { Plus, Trash2, Wallet, Baby, ShieldCheck, X } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PageHeader } from '../../components/ui/PageHeader';
import { type Bucket } from '../../hooks/useBuckets';

interface BucketsManagerProps {
  buckets: Bucket[];
  onSave: (buckets: Bucket[]) => void;
}

export const BucketsManager: React.FC<BucketsManagerProps> = ({ buckets, onSave }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newBucket, setNewBucket] = useState('');
  const [newInitialBalance, setNewInitialBalance] = useState<string>('0');

  const addBucket = () => {
    if (newBucket && !buckets.find(b => b.name === newBucket)) {
      onSave([...buckets, { name: newBucket, initial_balance: parseFloat(newInitialBalance) || 0 }]);
      setNewBucket('');
      setNewInitialBalance('0');
      setShowAddForm(false);
    }
  };

  const deleteBucket = (name: string) => {
    if (name === 'Main') return;
    onSave(buckets.filter(b => b.name !== name));
  };

  const updateBucketBalance = (name: string, balance: string) => {
    const parsed = parseFloat(balance) || 0;
    onSave(buckets.map(b => b.name === name ? { ...b, initial_balance: parsed } : b));
  };

  const getIcon = (name: string) => {
    if (name === 'Main') return <Wallet className="w-4 h-4 text-emerald-500" />;
    if (name === 'Kindergeld') return <Baby className="w-4 h-4 text-blue-500" />;
    return <ShieldCheck className="w-4 h-4 text-amber-500" />;
  };

  const formatCurrency = (amount: number = 0) => {
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(amount);
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Logical Buckets" 
        description="Manage how your money is logically separated regardless of physical bank accounts."
      >
        <Button onClick={() => setShowAddForm(!showAddForm)} variant={showAddForm ? 'outline' : 'default'}>
          {showAddForm ? <X className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
          {showAddForm ? 'Cancel' : 'Add Bucket'}
        </Button>
      </PageHeader>

      <Card>
        <CardContent className="p-0">
          {showAddForm && (
            <div className="p-6 border-b bg-muted/30 animate-in fade-in slide-in-from-top-2">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end max-w-2xl">
                <div className="space-y-1.5 flex-1">
                    <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Bucket Name</label>
                    <Input 
                      placeholder="e.g. Travel, Emergency" 
                      value={newBucket}
                      onChange={(e) => setNewBucket(e.target.value)}
                    />
                </div>
                <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Initial Logical Balance</label>
                    <Input 
                      type="number"
                      step="0.01"
                      placeholder="0.00" 
                      value={newInitialBalance}
                      onChange={(e) => setNewInitialBalance(e.target.value)}
                    />
                </div>
                <Button onClick={addBucket}>Create Bucket</Button>
              </div>
            </div>
          )}

          <div className="relative overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase bg-muted/50 text-muted-foreground border-b">
                <tr>
                  <th className="px-6 py-4 font-bold tracking-wider">Bucket Name</th>
                  <th className="px-6 py-4 font-bold tracking-wider">Initial Logical Balance</th>
                  <th className="px-6 py-4 font-bold tracking-wider">Purpose</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {buckets.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground italic">
                      No buckets defined.
                    </td>
                  </tr>
                )}
                {buckets.map((bucket) => (
                  <tr key={bucket.name} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-1.5 bg-muted rounded">
                          {getIcon(bucket.name)}
                        </div>
                        <span className="font-semibold text-foreground/90">{bucket.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Input 
                          type="number"
                          step="0.01"
                          className="h-8 w-32 font-mono text-sm"
                          value={bucket.initial_balance || 0}
                          onChange={(e) => updateBucketBalance(bucket.name, e.target.value)}
                        />
                        <span className="text-xs text-muted-foreground font-mono">
                          ({formatCurrency(bucket.initial_balance)})
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {bucket.description || 'Logical separation of funds'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-destructive h-8 w-8"
                        disabled={bucket.name === 'Main'}
                        onClick={() => deleteBucket(bucket.name)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      
      <div className="p-4 bg-muted/50 rounded-lg border border-dashed text-xs text-muted-foreground">
        <strong>💡 Pro-tip:</strong> To maintain logical balance, if you add an initial balance to one bucket (e.g. +7,025€ for Kindergeld), 
        consider deducting the same amount from your "Main" bucket (e.g. -7,025€) so that your total logical net worth remains consistent 
        with your physical bank balances.
      </div>
    </div>
  );
};
