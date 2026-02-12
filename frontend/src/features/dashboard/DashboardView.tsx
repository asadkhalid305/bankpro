import {
  PlusCircle,
  ArrowUpRight,
  TrendingUp,
  Wallet,
  Baby,
  PiggyBank,
  ArrowLeftRight,
  CreditCard
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PageHeader } from '@/components/ui/PageHeader';
import { cn } from "@/lib/utils";
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

const StatCard = ({ title, value, description, icon: Icon, trend, trendType }: {
  title: string;
  value: string | number;
  description: string;
  icon: React.ElementType;
  trend?: string;
  trendType?: 'positive' | 'negative' | 'neutral';
}) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
      <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{title}</CardTitle>
      <Icon className="w-4 h-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      <p className="text-[10px] text-muted-foreground mt-1 text-nowrap truncate">
        {description}
      </p>
    </CardContent>
  </Card>
);

export const DashboardView = () => {
  const navigate = useNavigate();
  const [summary, setSummary] = useState<any>(null);

  useEffect(() => {
    api.get('/dashboard/summary').then(setSummary);
  }, []);

  const totalBalance = summary?.buckets?.reduce((acc: number, b: any) => acc + b.balance, 0) || 0;

  return (
    <div className="space-y-8 pb-12">
      <PageHeader
        title="Dashboard"
        description="Comprehensive overview of your financial health and activity."
      >
        <Button onClick={() => navigate('/import')} className="shadow-lg">
          <PlusCircle className="mr-2 h-4 w-4" />
          Import
        </Button>
      </PageHeader>

      {/* Main Highlights */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Net Worth"
          value={`${totalBalance.toFixed(2)} €`}
          description="Combined balance of all accounts"
          icon={Wallet}
        />
        <StatCard
          title="Expenses (Month)"
          value={`${(summary?.monthly_expenses || 0).toFixed(2)} €`}
          description="Total spending in February"
          icon={CreditCard}
          trendType="negative"
        />
        <StatCard
          title="Investments"
          value={`${(summary?.investment_value || 0).toFixed(2)} €`}
          description="Total principal invested"
          icon={TrendingUp}
          trendType="positive"
        />
        <StatCard
          title="Monthly Transfers"
          value={`${(summary?.monthly_transfers || 0).toFixed(2)} €`}
          description="Internal movements this month"
          icon={ArrowLeftRight}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-12">
        {/* Account Balances */}
        <Card className="lg:col-span-4 shadow-sm border-muted/40">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <PiggyBank className="w-5 h-5 text-primary" />
              Physical Accounts
            </CardTitle>
            <CardDescription>Current balance per bank source.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {summary?.accounts?.sort((a: any, b: any) => b.balance - a.balance).map((acc: any) => (
              <div key={acc.name} className="flex items-center justify-between p-2.5 rounded-lg border border-transparent hover:bg-muted/30 hover:border-muted transition-all">
                <span className="font-medium text-sm text-foreground/80">{acc.name}</span>
                <span className={cn("font-mono font-bold text-sm", acc.balance < 0 ? "text-red-500" : "text-emerald-500")}>
                  {acc.balance.toFixed(2)} €
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Bucket Balances */}
        <Card className="lg:col-span-4 shadow-sm border-muted/40">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Baby className="w-5 h-5 text-blue-500" />
              Logical Buckets
            </CardTitle>
            <CardDescription>Allocation across purposes.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {summary?.buckets?.map((bucket: any) => (
              <div key={bucket.name} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-semibold text-foreground/80">{bucket.name}</span>
                  <span className="font-bold">{bucket.balance.toFixed(2)} €</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
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
              <CardTitle className="text-lg">Recent Activity</CardTitle>
              <CardDescription>Latest log entries.</CardDescription>
            </div>
            <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => navigate('/transactions')}>View All</Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {summary?.recent_transactions?.map((t: any) => (
                <div key={t.id} className="flex items-center justify-between group">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">{t.merchant}</p>
                    <p className="text-[10px] text-muted-foreground uppercase">{t.date} • {t.account}</p>
                  </div>
                  <div className={cn(
                    "text-xs font-bold ml-4 whitespace-nowrap",
                    t.transaction_type === 'TRANSFER' ? "text-slate-400" :
                      t.amount < 0 ? "text-red-500" : "text-emerald-500"
                  )}>
                    {t.amount.toFixed(2)} €
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Spending Breakdown */}
      <Card className="shadow-sm border-muted/40">
        <CardHeader>
          <CardTitle className="text-lg">Top Spending Categories</CardTitle>
          <CardDescription>Where your money went this month.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-5">
            {summary?.categories?.sort((a: any, b: any) => a.total - b.total).slice(0, 10).map((cat: any) => (
              <div key={cat.category} className="p-3 border rounded-xl bg-card/50 hover:border-primary/30 transition-all group">
                <p className="text-[10px] font-bold uppercase text-muted-foreground mb-1 truncate">{cat.category}</p>
                <p className="text-lg font-bold text-red-500 group-hover:scale-105 transition-transform">{Math.abs(cat.total).toFixed(2)} €</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
