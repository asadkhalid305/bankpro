import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  X, 
  Check, 
  Edit3,
  LayoutList,
  CreditCard,
  TrendingUp,
  RotateCcw,
  Activity,
  Calculator
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Card, CardContent } from "@/components/ui/Card";
import { PageHeader } from '../../components/ui/PageHeader';
import { Badge } from '../../components/ui/Badge';
import { StatCard } from '../../components/ui/StatCard';
import { cn } from "@/lib/utils";
import { type FixedExpense, BUCKET_OPTIONS } from '../../types';

interface FixedExpensesViewProps {
  expenses: FixedExpense[];
  accounts: string[];
  categories: string[];
  onAdd: (expense: FixedExpense) => void;
  onUpdate: (expense: FixedExpense) => void;
  onDelete: (id: number) => void;
}

export const FixedExpensesView: React.FC<FixedExpensesViewProps> = ({
  expenses,
  accounts,
  categories,
  onAdd,
  onUpdate,
  onDelete
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editRow, setEditRow] = useState<FixedExpense | null>(null);

  const fmt = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Date Filters (Initialize with current month)
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    return fmt(new Date(d.getFullYear(), d.getMonth(), 1));
  });
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    return fmt(new Date(d.getFullYear(), d.getMonth() + 1, 0));
  });
  const [activeFilter, setActiveFilter] = useState('month');

  const [newExpense, setNewExpense] = useState<FixedExpense>({
    service: '',
    category: categories[0] || 'Essential',
    payment_account: accounts[0] || 'Deutsche Bank',
    period: 'Monthly',
    price: 0,
    bucket: 'Main'
  });

  const setPeriod = (type: string) => {
    const now = new Date();
    let start, end;
    setActiveFilter(type);
    switch(type) {
      case 'month':
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case 'quarter':
        const quarter = Math.floor(now.getMonth() / 3);
        start = new Date(now.getFullYear(), quarter * 3, 1);
        end = new Date(now.getFullYear(), (quarter + 1) * 3, 0);
        break;
      case 'year':
        start = new Date(now.getFullYear(), 0, 1);
        end = new Date(now.getFullYear(), 11, 31);
        break;
      default: return;
    }
    setStartDate(fmt(start));
    setEndDate(fmt(end));
  };

  const getDurationStats = () => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    
    return {
      days: diffDays,
      months: diffDays / 30.44,
      quarters: diffDays / 91.25,
      years: diffDays / 365.25
    };
  };

  const calculateStaticBase = (period: string) => {
    return expenses.filter(e => e.period === period).reduce((sum, e) => sum + e.price, 0);
  };

  const calculateTotalProjected = () => {
    const stats = getDurationStats();
    return expenses.reduce((sum, e) => {
      let multiplier = 0;
      if (e.period === 'Monthly') multiplier = stats.months;
      else if (e.period === 'Quarterly') multiplier = stats.quarters;
      else if (e.period === 'Yearly') multiplier = stats.years;
      return sum + (e.price * multiplier);
    }, 0);
  };

  const handleAdd = () => {
    if (!newExpense.service || newExpense.price <= 0) return;
    onAdd(newExpense);
    setNewExpense({
      service: '',
      category: categories[0] || 'Essential',
      payment_account: accounts[0] || 'Deutsche Bank',
      period: 'Monthly',
      price: 0,
      bucket: 'Main'
    });
    setShowAddForm(false);
  };

  const handleEditClick = (exp: FixedExpense) => {
    setEditingId(exp.id!);
    setEditRow({ ...exp });
  };

  const handleUpdateSave = () => {
    if (editRow) {
      onUpdate(editRow);
      setEditingId(null);
      setEditRow(null);
    }
  };

  const formatEuro = (val: number) => {
    return val.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
  };

  const getPeriodLabel = () => {
    const s = new Date(startDate);
    const e = new Date(endDate);
    return `${s.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${e.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  };

  const periods = ['Monthly', 'Quarterly', 'Yearly'];

  return (
    <div className="space-y-10 pb-12">
      <PageHeader 
        title="Fixed Expenses" 
        description="Overview of your recurring utilities, subscriptions, and major fixed costs."
      >
        <Button onClick={() => setShowAddForm(!showAddForm)} variant={showAddForm ? 'outline' : 'default'}>
          {showAddForm ? <X className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
          {showAddForm ? 'Cancel' : 'Add Expense'}
        </Button>
      </PageHeader>

      {/* SECTION 1: BASE CONFIGURATION (Static) */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 border-b pb-2">
          <Calculator className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-bold tracking-tight">Standard Base Costs</h2>
          <span className="text-xs text-muted-foreground ml-auto uppercase font-bold tracking-widest bg-muted px-2 py-0.5 rounded">All-Time Config</span>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard 
            title="Monthly Base Sum"
            value={formatEuro(calculateStaticBase('Monthly'))}
            description="Total cost of all monthly bills"
            icon={CreditCard}
            variant="primary"
          />
          <StatCard 
            title="Quarterly Base Sum"
            value={formatEuro(calculateStaticBase('Quarterly'))}
            description="Total cost of all quarterly bills"
            icon={CreditCard}
            variant="info"
          />
          <StatCard 
            title="Yearly Base Sum"
            value={formatEuro(calculateStaticBase('Yearly'))}
            description="Total cost of all yearly bills"
            icon={CreditCard}
            variant="success"
          />
        </div>
      </div>

      {/* SECTION 2: PROJECTION ANALYSIS (Dynamic) */}
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-2">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-destructive" />
            <h2 className="text-lg font-bold tracking-tight">Period Liability Projection</h2>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex bg-muted p-1 rounded-lg">
              {['month', 'quarter', 'year'].map((p) => (
                <Button
                  key={p}
                  variant={activeFilter === p ? 'default' : 'ghost'}
                  size="sm"
                  className="h-7 text-[10px] px-3 uppercase font-bold"
                  onClick={() => setPeriod(p)}
                >{p}</Button>
              ))}
            </div>

            <div className="flex items-center gap-2 ml-2 border-l pl-4 border-muted">
              <Input
                type="date"
                className="h-8 w-32 text-[10px]"
                value={startDate}
                onChange={(e) => { setStartDate(e.target.value); setActiveFilter('custom'); }}
              />
              <span className="text-muted-foreground text-[10px] uppercase font-bold">to</span>
              <Input
                type="date"
                className="h-8 w-32 text-[10px]"
                value={endDate}
                onChange={(e) => { setEndDate(e.target.value); setActiveFilter('custom'); }}
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                onClick={() => setPeriod('month')}
                title="Reset to current month"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <StatCard 
            title="Consolidated Projection"
            value={formatEuro(calculateTotalProjected())}
            description={`Combined liability for ${getPeriodLabel()}`}
            icon={TrendingUp}
            variant="destructive"
            className="md:col-span-3"
          />
        </div>
      </div>

      {/* Registry Table */}
      <Card>
        <CardContent className="p-0">
          {showAddForm && (
            <div className="p-6 border-b bg-muted/30 animate-in fade-in slide-in-from-top-2">
              <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
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
                      options={categories}
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
                    <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Bucket</label>
                    <Select 
                      value={newExpense.bucket} 
                      onChange={(e) => setNewExpense({...newExpense, bucket: e.target.value})}
                      options={BUCKET_OPTIONS}
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
                <Button onClick={handleAdd} className="md:col-start-6 w-full">Save Expense</Button>
              </div>
            </div>
          )}

          <div className="relative overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase bg-muted/50 text-muted-foreground border-b font-bold tracking-wider">
                <tr>
                  <th className="px-6 py-4">Service</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Bucket</th>
                  <th className="px-6 py-4">Payment Source</th>
                  <th className="px-6 py-4">Period</th>
                  <th className="px-6 py-4">Price</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {expenses.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground italic">
                      No fixed expenses defined.
                    </td>
                  </tr>
                )}
                {expenses.map((exp) => (
                  <tr key={exp.id} className={cn(
                    "hover:bg-muted/30 transition-colors",
                    editingId === exp.id && "bg-primary/5"
                  )}>
                    <td className="px-6 py-4">
                      {editingId === exp.id ? (
                        <Input 
                          value={editRow?.service} 
                          onChange={(e) => setEditRow({...editRow!, service: e.target.value})}
                          className="h-8 text-sm"
                        />
                      ) : (
                        <div className="flex items-center gap-3">
                          <div className="p-1.5 bg-primary/10 rounded">
                            <LayoutList className="w-4 h-4 text-primary" />
                          </div>
                          <span className="font-semibold text-foreground/90">{exp.service}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {editingId === exp.id ? (
                        <Select 
                          value={editRow?.category} 
                          onChange={(e) => setEditRow({...editRow!, category: e.target.value})}
                          options={categories}
                          className="h-8 text-xs"
                        />
                      ) : (
                        <Badge variant={exp.category === 'Essential' ? 'destructive' : 'default'}>
                          {exp.category}
                        </Badge>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {editingId === exp.id ? (
                        <Select 
                          value={editRow?.bucket} 
                          onChange={(e) => setEditRow({...editRow!, bucket: e.target.value})}
                          options={BUCKET_OPTIONS}
                          className="h-8 text-xs"
                        />
                      ) : (
                        <Badge variant="outline">
                          {exp.bucket}
                        </Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {editingId === exp.id ? (
                        <Select 
                          value={editRow?.payment_account} 
                          onChange={(e) => setEditRow({...editRow!, payment_account: e.target.value})}
                          options={accounts}
                          className="h-8 text-xs"
                        />
                      ) : (
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-3.5 h-3.5 opacity-50" />
                          {exp.payment_account}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {editingId === exp.id ? (
                        <Select 
                          value={editRow?.period} 
                          onChange={(e) => setEditRow({...editRow!, period: e.target.value as any})}
                          options={periods}
                          className="h-8 text-xs"
                        />
                      ) : (
                        <Badge variant="outline" className="border-primary/20 text-primary">
                          {exp.period}
                        </Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-foreground">
                      {editingId === exp.id ? (
                        <Input 
                          type="number"
                          step="0.01"
                          value={editRow?.price} 
                          onChange={(e) => setEditRow({...editRow!, price: parseFloat(e.target.value)})}
                          className="h-8 text-sm w-32"
                        />
                      ) : (
                        formatEuro(exp.price)
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        {editingId === exp.id ? (
                          <>
                            <Button onClick={handleUpdateSave} size="icon" variant="ghost" className="h-8 w-8 text-emerald-600">
                              <Check className="w-4 h-4" />
                            </Button>
                            <Button onClick={() => setEditingId(null)} size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground">
                              <X className="w-4 h-4" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button onClick={() => handleEditClick(exp)} size="icon" variant="ghost" className="h-8 w-8">
                              <Edit3 className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-destructive"
                              onClick={() => onDelete(exp.id!)}
                            >
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