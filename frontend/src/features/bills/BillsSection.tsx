import React, { useEffect, useState } from 'react';
import { useBills, type Bill } from '../../hooks/useBills';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  AlertCircle, 
  ExternalLink,
  Calendar,
  ChevronLeft,
  ChevronRight,
  HandMetal
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, addMonths, subMonths, parseISO, isAfter, isBefore, addDays, endOfDay } from 'date-fns';

export const BillsSection = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const monthStr = format(currentMonth, 'yyyy-MM');
  
  const { bills, loading, error, fetchBills, updateBillStatus } = useBills();

  useEffect(() => {
    fetchBills(monthStr);
  }, [monthStr, fetchBills]);

  const handlePrevMonth = () => setCurrentMonth(prev => subMonths(prev, 1));
  const handleNextMonth = () => setCurrentMonth(prev => addMonths(prev, 1));
  const handleCurrentMonth = () => setCurrentMonth(new Date());

  const getStatusColor = (bill: Bill) => {
    if (bill.status === 'paid') return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
    if (bill.status === 'skipped') return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
    
    // Check if overdue
    const today = new Date();
    const isCurrentMonth = format(today, 'yyyy-MM') === monthStr;
    const dueDayDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), bill.due_day);
    
    // Overdue: Only after the due day has fully passed
    if (isAfter(today, endOfDay(dueDayDate)) && isCurrentMonth) {
        return 'bg-destructive/10 text-destructive border-destructive/20';
    }
    
    // Due Soon: Within 3 days of the due day (but not yet passed)
    if (isBefore(dueDayDate, addDays(today, 3)) && isCurrentMonth) {
        return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
    }

    return 'bg-primary/10 text-primary border-primary/20';
  };

  const getStatusIcon = (bill: Bill) => {
    if (bill.status === 'paid') return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
    if (bill.status === 'skipped') return <Circle className="w-5 h-5 text-slate-500" />;
    
    const today = new Date();
    const isCurrentMonth = format(today, 'yyyy-MM') === monthStr;
    const dueDayDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), bill.due_day);
    
    if (isAfter(today, endOfDay(dueDayDate)) && isCurrentMonth) {
        return <AlertCircle className="w-5 h-5 text-destructive" />;
    }
    
    if (isBefore(dueDayDate, addDays(today, 3)) && isCurrentMonth) {
        return <Clock className="w-5 h-5 text-amber-500" />;
    }

    return <Circle className="w-5 h-5 text-primary" />;
  };

  const getStatusLabel = (bill: Bill) => {
    if (bill.status === 'paid') return 'Paid';
    if (bill.status === 'skipped') return 'Skipped';
    
    const today = new Date();
    const isCurrentMonth = format(today, 'yyyy-MM') === monthStr;
    const dueDayDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), bill.due_day);
    
    if (isAfter(today, endOfDay(dueDayDate)) && isCurrentMonth) return 'Overdue';
    if (isBefore(dueDayDate, addDays(today, 3)) && isCurrentMonth) return 'Due Soon';
    
    return 'Pending';
  };

  const totalLiability = bills.reduce((sum, b) => sum + b.price, 0);
  const totalPaid = bills.filter(b => b.status === 'paid').reduce((sum, b) => sum + b.price, 0);
  const remaining = bills.filter(b => b.status === 'pending').reduce((sum, b) => sum + b.price, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bills & Subscriptions</h1>
          <p className="text-muted-foreground">Verify your monthly recurring payments and manual transfers.</p>
        </div>
        
        <div className="flex items-center gap-2 bg-card border rounded-lg p-1">
          <Button variant="ghost" size="icon" onClick={handlePrevMonth}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="ghost" className="px-4 font-medium min-w-[140px]" onClick={handleCurrentMonth}>
            <Calendar className="w-4 h-4 mr-2" />
            {format(currentMonth, 'MMMM yyyy')}
          </Button>
          <Button variant="ghost" size="icon" onClick={handleNextMonth}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Monthly Liability</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{totalLiability.toLocaleString('de-DE', { minimumFractionDigits: 2 })}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Remaining</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-500">€{remaining.toLocaleString('de-DE', { minimumFractionDigits: 2 })}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Paid / Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-500">
                {bills.filter(b => b.status === 'paid').length} / {bills.length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Checklist</CardTitle>
          <CardDescription>Items marked with <HandMetal className="w-3 h-3 inline" /> must be paid manually.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : bills.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No bills found for this month. Set them up in "Fixed Expenses".
            </div>
          ) : (
            <div className="space-y-3">
              {bills.map((bill) => (
                <div 
                  key={bill.id} 
                  className={cn(
                    "flex items-center justify-between p-4 rounded-lg border transition-all",
                    bill.status === 'paid' ? "bg-emerald-500/5 border-emerald-500/20" : "bg-card"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0">
                      {getStatusIcon(bill)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{bill.service}</span>
                        {bill.is_manual === 1 && <HandMetal className="w-3 h-3 text-muted-foreground" title="Manual payment required" />}
                        <Badge variant="outline" className={cn("text-[10px] py-0", getStatusColor(bill))}>
                          {getStatusLabel(bill)}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Due: Day {bill.due_day} • {bill.category} • {bill.payment_account}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right hidden sm:block">
                      <div className="font-bold">€{bill.price.toLocaleString('de-DE', { minimumFractionDigits: 2 })}</div>
                      {bill.transaction_id && (
                        <div className="text-[10px] text-emerald-500 flex items-center justify-end gap-1">
                          <CheckCircle2 className="w-2 h-2" /> Auto-matched
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {bill.status !== 'paid' ? (
                        <>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-8 border-emerald-500/50 hover:bg-emerald-500 hover:text-white"
                            onClick={() => updateBillStatus(bill.id, monthStr, 'paid')}
                          >
                            Mark Paid
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-8 text-muted-foreground"
                            onClick={() => updateBillStatus(bill.id, monthStr, 'skipped')}
                          >
                            Skip
                          </Button>
                        </>
                      ) : (
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-8 text-muted-foreground hover:text-destructive"
                          onClick={() => updateBillStatus(bill.id, monthStr, 'pending')}
                        >
                          Reset
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
