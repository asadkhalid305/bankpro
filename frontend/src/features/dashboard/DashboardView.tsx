import {
  PlusCircle,
  TrendingUp,
  Wallet,
  Baby,
  PiggyBank,
  ArrowLeftRight,
  CreditCard,
  Globe,
  User,
  Heart,
  RotateCcw,
  Activity,
  BarChart3,
  History
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PageHeader } from '@/components/ui/PageHeader';
import { Input } from "@/components/ui/Input";
import { StatCard } from "@/components/ui/StatCard";
import { cn } from "@/lib/utils";
import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';

export const DashboardView = () => {
  const navigate = useNavigate();
  const [summary, setSummary] = useState<any>(null);

  const fmt = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Date Filters (Initialize with local date strings)
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    return fmt(new Date(d.getFullYear(), d.getMonth(), 1));
  });
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    return fmt(new Date(d.getFullYear(), d.getMonth() + 1, 0));
  });

  const [activeFilter, setActiveFilter] = useState('month');

  const fetchSummary = useCallback(async (start: string, end: string) => {
    const data = await api.get(`/dashboard/summary?start_date=${start}&end_date=${end}`);
    setSummary(data);
  }, []);

  useEffect(() => {
    fetchSummary(startDate, endDate);
  }, [startDate, endDate, fetchSummary]);

  const setPeriod = (type: string) => {
    const now = new Date();
    let start, end;

    setActiveFilter(type);

    switch (type) {
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
      case 'all':
        // Sensible all-time: from 2023 to end of current year
        start = new Date(2023, 0, 1);
        end = new Date(now.getFullYear(), 11, 31);
        break;
      default:
        return;
    }

    setStartDate(fmt(start));
    setEndDate(fmt(end));
  };

  const totalBalance = summary?.total_net_worth || 0;

  const formatEuro = (val: number) => {
    return (val || 0).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
  };

  const getPeriodLabel = () => {
    if (activeFilter === 'all') return "All Time";
    if (startDate && endDate) {
      const s = new Date(startDate);
      const e = new Date(endDate);
      return `${s.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${e.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    }
    return "Custom Period";
  };

  return (
    <div className="space-y-12 pb-12">
      <PageHeader
        title="Financial Dashboard"
        description="Comprehensive overview of your wealth and performance."
      >
        <Button onClick={() => navigate('/import')} className="shadow-lg">
          <PlusCircle className="mr-2 h-4 w-4" />
          Import Statement
        </Button>
      </PageHeader>

      {/* SECTION 1: GLOBAL WEALTH (Static Snapshot) */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 border-b pb-2">
          <Globe className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-bold tracking-tight">Wealth Snapshot</h2>
          <span className="text-xs text-muted-foreground ml-auto uppercase font-bold tracking-widest bg-muted px-2 py-0.5 rounded">All-Time Status</span>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <StatCard
            title="Total Net Worth"
            value={formatEuro(totalBalance)}
            description="Combined balance of all accounts"
            icon={Wallet}
            variant="primary"
          />
          <StatCard
            title="Personal Portfolio"
            value={formatEuro(summary?.investment_personal)}
            description="Current value of TR - Personal"
            icon={User}
            variant="success"
          />
          <StatCard
            title="Child Investment"
            value={formatEuro(summary?.investment_child)}
            description="Current value of TR - Child"
            icon={Heart}
            variant="purple"
          />
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-12">
          {/* Account Balances */}
          <Card className="lg:col-span-4 shadow-sm border-muted/40">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <PiggyBank className="w-4 h-4 text-primary" />
                Physical Accounts
              </CardTitle>
              <CardDescription className="text-xs">Current bank balances.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {summary?.accounts?.sort((a: any, b: any) => b.balance - a.balance).map((acc: any) => (
                <div key={acc.name} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/30 transition-all group">
                  <span className="text-sm text-foreground/80">{acc.name}</span>
                  <span className={cn("font-mono font-bold text-sm", acc.balance < 0 ? "text-red-500" : "text-emerald-500")}>
                    {formatEuro(acc.balance)}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Bucket Balances */}
          <Card className="lg:col-span-4 shadow-sm border-muted/40">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Baby className="w-4 h-4 text-blue-500" />
                Logical Buckets
              </CardTitle>
              <CardDescription className="text-xs">Allocation by purpose.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {summary?.buckets?.map((bucket: any) => (
                <div key={bucket.name} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-semibold text-foreground/80">{bucket.name}</span>
                    <span className="font-bold">{formatEuro(bucket.balance)}</span>
                  </div>
                  <div className="h-1 bg-muted rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-500",
                        bucket.name === 'Main' ? "bg-primary" :
                          bucket.name === 'Kindergeld' ? "bg-blue-500" : "bg-amber-500"
                      )}
                      style={{ width: `${Math.min(100, (Math.abs(bucket.balance) / (Math.abs(totalBalance) || 1)) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Recent Transactions */}
          <Card className="lg:col-span-4 shadow-sm border-muted/40">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                    <History className="w-4 h-4 text-primary" />
                    Latest Activity
                </CardTitle>
                <CardDescription className="text-xs">Most recent movements.</CardDescription>
              </div>
              <Button variant="ghost" size="sm" className="h-7 text-[10px] uppercase font-bold" onClick={() => navigate('/transactions')}>All</Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {summary?.recent_transactions?.map((t: any) => (
                  <div key={t.id} className="flex items-center justify-between group">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold truncate group-hover:text-primary transition-colors">{t.merchant}</p>
                      <p className="text-[10px] text-muted-foreground uppercase font-medium">{t.date}</p>
                    </div>
                    <div className={cn(
                      "text-[10px] font-bold ml-4 whitespace-nowrap px-1.5 py-0.5 rounded",
                      t.transaction_type === 'TRANSFER' ? "text-slate-500 bg-slate-50" :
                        t.amount < 0 ? "text-red-500 bg-red-50" : "text-emerald-500 bg-emerald-50"
                    )}>
                      {formatEuro(t.amount)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* SECTION 2: PERFORMANCE ANALYSIS (Dynamic View) */}
      <div className="space-y-6 pt-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-2">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg font-bold tracking-tight">Period Analysis</h2>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex bg-muted p-1 rounded-lg">
              {['month', 'quarter', 'year', 'all'].map((p) => (
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

        <div className="grid gap-4 md:grid-cols-4">
          <StatCard
            title="Total Income"
            value={formatEuro(summary?.monthly_income)}
            description={`Inflow: ${getPeriodLabel()}`}
            icon={TrendingUp}
            variant="success"
          />
          <StatCard
            title="Total Expenses"
            value={formatEuro(summary?.monthly_expenses)}
            description={`Outflow: ${getPeriodLabel()}`}
            icon={CreditCard}
            variant="destructive"
          />
          <StatCard
            title="Net Savings"
            value={formatEuro(summary?.monthly_savings)}
            description="Difference between In/Out"
            icon={Activity}
            variant={summary?.monthly_savings >= 0 ? "success" : "destructive"}
          />
          <StatCard
            title="Internal Flows"
            value={formatEuro(summary?.monthly_transfers)}
            description="Movements between accounts"
            icon={ArrowLeftRight}
            variant="info"
          />
        </div>

        {/* Spending Breakdown & Budgets */}
        <Card className="shadow-sm border-muted/40">
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              <span>Budget vs Actual Spending</span>
              <span className="text-[10px] uppercase font-bold text-muted-foreground">{getPeriodLabel()}</span>
            </CardTitle>
            <CardDescription className="text-xs">Monitor your spending across categories against monthly targets.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {summary?.categories?.sort((a: any, b: any) => {
                // Keep Uncategorized at the top if it has spending
                if (a.category === 'Uncategorized' && Math.abs(a.total) > 0) return -1;
                if (b.category === 'Uncategorized' && Math.abs(b.total) > 0) return 1;
                // Otherwise sort by spending (descending)
                return Math.abs(b.total) - Math.abs(a.total);
              }).map((cat: any) => {
                const spent = Math.abs(cat.total || 0);
                const budget = cat.budget || 0;
                const percent = budget > 0 ? Math.min(100, (spent / budget) * 100) : 0;
                const isOver = budget > 0 && spent > budget;
                const isUncategorized = cat.category === 'Uncategorized';
                
                return (
                  <div 
                    key={cat.category} 
                    className={cn(
                      "space-y-3 p-4 rounded-xl border transition-all cursor-pointer group/card",
                      isUncategorized ? "bg-amber-50/50 border-amber-200 shadow-sm hover:border-amber-400" : "bg-card/50 hover:bg-accent/5"
                    )}
                    onClick={() => navigate(`/transactions?category=${cat.category === 'Uncategorized' ? 'Unknown' : cat.category}`)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{cat.category}</span>
                        {isUncategorized && <span className="text-[8px] bg-amber-200 text-amber-700 px-1 rounded font-black uppercase">Action Required</span>}
                      </div>
                      <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded", 
                        isUncategorized ? "bg-amber-100 text-amber-700" :
                        isOver ? "bg-red-100 text-red-600" : "bg-emerald-100 text-emerald-600")}>
                        {isUncategorized ? "Needs Label" : isOver ? "Over Budget" : `${Math.round(percent)}% Used`}
                      </span>
                    </div>
                    
                    <div className="flex items-end justify-between gap-2">
                      <div className="flex flex-col">
                        <span className="text-lg font-bold">{formatEuro(spent)}</span>
                        <span className="text-[10px] text-muted-foreground">of {formatEuro(budget)}</span>
                      </div>
                      <div className="text-right">
                        <span className={cn("text-xs font-bold", isOver ? "text-red-500" : "text-emerald-500")}>
                          {isOver ? `+${formatEuro(spent - budget)}` : `${formatEuro(budget - spent)} left`}
                        </span>
                      </div>
                    </div>

                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-1000",
                          isOver ? "bg-red-500" : percent > 85 ? "bg-amber-500" : "bg-emerald-500"
                        )}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
