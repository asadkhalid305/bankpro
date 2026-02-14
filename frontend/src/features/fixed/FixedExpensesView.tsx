import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  X, 
  Check, 
  Wallet, 
  CalendarClock,
  LayoutList,
  Tags,
  CreditCard,
  Euro
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { PageHeader } from '../../components/ui/PageHeader';
import { Badge } from '../../components/ui/Badge';
import { cn } from "@/lib/utils";
import { type FixedExpense } from '../../types';

interface FixedExpensesViewProps {
  expenses: FixedExpense[];
  accounts: string[];
  categories: string[];
  onAdd: (expense: FixedExpense) => void;
  onDelete: (id: number) => void;
}

export const FixedExpensesView: React.FC<FixedExpensesViewProps> = ({
  expenses,
  accounts,
  categories,
  onAdd,
  onDelete
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newExpense, setNewExpense] = useState<FixedExpense>({
    service: '',
    category: 'Essential',
    payment_account: accounts[0] || 'Deutsche Bank',
    period: 'Monthly',
    price: 0
  });

  const handleAdd = () => {
    if (!newExpense.service || newExpense.price <= 0) return;
    onAdd(newExpense);
    setNewExpense({
      service: '',
      category: 'Essential',
      payment_account: accounts[0] || 'Deutsche Bank',
      period: 'Monthly',
      price: 0
    });
    setShowAddForm(false);
  };

  const calculateTotal = (period: string) => {
    return expenses
      .filter(e => e.period === period)
      .reduce((sum, e) => sum + e.price, 0);
  };

  const formatEuro = (val: number) => {
    return val.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
  };

  const periods = ['Monthly', 'Quarterly', 'Yearly'];

  return (
    <div className="space-y-8">
      <PageHeader 
        title="Fixed Expenses" 
        description="Overview of your recurring utilities, subscriptions, and major fixed costs."
      >
        <Button onClick={() => setShowAddForm(!showAddForm)} variant={showAddForm ? 'outline' : 'default'}>
          {showAddForm ? <X className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
          {showAddForm ? 'Cancel' : 'Add Expense'}
        </Button>
      </PageHeader>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {periods.map(p => (
          <Card key={p} className="border-l-4 border-l-primary">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{p} Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatEuro(calculateTotal(p))}</div>
              <p className="text-[10px] text-muted-foreground mt-1 uppercase font-medium">Aggregate {p.toLowerCase()} outflow</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          {showAddForm && (
            <div className="p-6 border-b bg-muted/30 animate-in fade-in slide-in-from-top-2">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Service Name</label>
                    <Input 
                      placeholder="e.g. House Rent" 
                      value={newExpense.service} 
                      onChange={(e) => setNewExpense({...newExpense, service: e.target.value})} 
                    />
                </div>
                <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Category</label>
                    <Select 
                      value={newExpense.category} 
                      onChange={(e) => setNewExpense({...newExpense, category: e.target.value})}
                      options={['Essential', 'Transport', 'Entertainment', 'Shopping', 'Personal']}
                    />
                </div>
                <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Payment Account</label>
                    <Select 
                      value={newExpense.payment_account} 
                      onChange={(e) => setNewExpense({...newExpense, payment_account: e.target.value})}
                      options={accounts}
                    />
                </div>
                <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Period</label>
                    <Select 
                      value={newExpense.period} 
                      onChange={(e) => setNewExpense({...newExpense, period: e.target.value as any})}
                      options={periods}
                    />
                </div>
                <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Price</label>
                    <Input 
                      type="number"
                      step="0.01"
                      placeholder="0.00" 
                      value={newExpense.price} 
                      onChange={(e) => setNewExpense({...newExpense, price: parseFloat(e.target.value)})} 
                    />
                </div>
                <Button onClick={handleAdd} className="md:col-start-5 w-full">Save Expense</Button>
              </div>
            </div>
          )}

          <div className="relative overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase bg-muted/50 text-muted-foreground border-b font-bold tracking-wider">
                <tr>
                  <th className="px-6 py-4">Service</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Payment Source</th>
                  <th className="px-6 py-4">Period</th>
                  <th className="px-6 py-4">Price</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {expenses.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground italic">
                      No fixed expenses defined.
                    </td>
                  </tr>
                )}
                {expenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-1.5 bg-primary/10 rounded">
                          <LayoutList className="w-4 h-4 text-primary" />
                        </div>
                        <span className="font-semibold text-foreground/90">{exp.service}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={exp.category === 'Essential' ? 'destructive' : 'default'}>
                        {exp.category}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-3.5 h-3.5 opacity-50" />
                        {exp.payment_account}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="outline" className="border-primary/20 text-primary">
                        {exp.period}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-foreground">
                      {formatEuro(exp.price)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-destructive"
                        onClick={() => onDelete(exp.id!)}
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
    </div>
  );
};
