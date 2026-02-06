import { 
  PlusCircle, 
  ArrowUpRight, 
  Clock, 
  AlertCircle, 
  FileCheck2,
  TrendingUp,
  Brain
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { useNavigate } from 'react-router-dom';

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
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className="w-4 h-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      <p className="text-xs text-muted-foreground mt-1">
        {description}
      </p>
      {trend && (
        <div className={cn(
          "flex items-center mt-2 text-xs font-medium",
          trendType === 'positive' ? "text-emerald-500" : trendType === 'negative' ? "text-red-500" : "text-slate-500"
        )}>
          {trendType === 'positive' ? <TrendingUp className="w-3 h-3 mr-1" /> : null}
          {trend}
        </div>
      )}
    </CardContent>
  </Card>
);

interface DashboardViewProps {
  masterCount: number;
}

export const DashboardView = ({ masterCount }: DashboardViewProps) => {
  const navigate = useNavigate();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Welcome back</h1>
        <p className="text-muted-foreground">Here's an overview of your financial data processing.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Total Transactions" 
          value={masterCount} 
          description="Total records in master statement" 
          icon={FileCheck2}
          trend="+12% from last month"
          trendType="positive"
        />
        <StatCard 
          title="Recent Uploads" 
          value="3" 
          description="Files processed this week" 
          icon={ArrowUpRight}
        />
        <StatCard 
          title="Knowledge Base" 
          value="156" 
          description="Active category mappings" 
          icon={Brain}
        />
        <StatCard 
          title="System Status" 
          value="Healthy" 
          description="Last updated 5 mins ago" 
          icon={Clock}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>You processed 128 transactions across 2 files today.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] flex items-center justify-center border-2 border-dashed rounded-lg border-muted">
               <p className="text-muted-foreground italic text-sm">Activity graph coming soon...</p>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Commonly used processing tasks.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={() => navigate('/import')} className="w-full justify-start py-6 text-lg">
              <PlusCircle className="mr-3 h-6 w-6" />
              Import New Statement
            </Button>
            <Button variant="outline" className="w-full justify-start py-4" onClick={() => navigate('/mappings')}>
              <Brain className="mr-3 h-5 w-5" />
              Manage Mappings
            </Button>
            <div className="rounded-lg bg-amber-50 p-4 border border-amber-200 dark:bg-amber-950/20 dark:border-amber-900/30">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-amber-700 dark:text-amber-500 mr-3 shrink-0" />
                <div>
                  <h4 className="text-sm font-semibold text-amber-950 dark:text-amber-400">Unmapped detected</h4>
                  <p className="text-sm text-amber-900 dark:text-amber-300/90 mt-1 leading-relaxed">
                    There are 12 transactions with unknown types. 
                    <button className="underline font-medium hover:text-amber-950 ml-1">Review them now</button>
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
