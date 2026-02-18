import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { api } from "@/lib/api";
import { CATEGORY_OPTIONS, type CategoryBudget } from "@/types";
import { Calendar, ArrowLeft, ArrowRight, TrendingDown, Trash2, Plus, ArrowRightCircle, Tag } from "lucide-react";
import { cn } from "@/lib/utils";
import { Select } from "../../components/ui/Select";

export const BudgetManager = () => {
  const [month, setMonth] = useState(() => {
    // Default to Feb 2026 or current if in 2026
    const d = new Date();
    const year = d.getFullYear();
    if (year === 2026) {
        return `2026-${String(d.getMonth() + 1).padStart(2, '0')}`;
    }
    return "2026-02";
  });
  
  const [budgetData, setBudgetData] = useState<any[]>([]);
  const [allCategories, setAllCategories] = useState<string[]>([]);
  const [selectedToAdd, setSelectedToAdd] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const [loading, setLoading] = useState(false);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [budgets, categories] = await Promise.all([
        api.get(`/budgets/?month=${month}`),
        api.get('/categories/')
      ]);
      setBudgetData(budgets);
      setAllCategories(categories);
    } catch (err) {
      console.error("Failed to fetch initial data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, [month]);

  const handleAddCategory = async (cat: string) => {
    if (!cat) return;
    await handleSave(cat, 0); // Initialize with 0
    setSelectedToAdd('');
  };

  const handleSave = async (category: string, amount: number) => {
    try {
      await api.post('/budgets/', {
        category_name: category,
        month: month,
        target_amount: amount
      });
      fetchInitialData(); 
      setMessage({ type: 'success', text: `Budget updated.` });
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setMessage({ type: 'error', text: `Failed to update budget.` });
    }
  };

  const handleDelete = async (category: string) => {
    if (!window.confirm(`Remove budget for ${category}?`)) return;
    try {
      await api.delete(`/budgets/${month}/${category}`);
      fetchInitialData();
      setMessage({ type: 'success', text: `Budget removed.` });
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setMessage({ type: 'error', text: `Failed to remove budget.` });
    }
  };

  const syncYear = async () => {
    const monthName = new Date(month + '-01').toLocaleDateString('en-US', { month: 'long' });
    if (!window.confirm(`APPLY TO ALL OF 2026? This will overwrite EVERY month in 2026 (Jan to Dec) with the setup from ${monthName}.`)) return;
    
    try {
      await api.post('/budgets/sync_year', { month: month });
      setMessage({ type: 'success', text: `Budget synced to all months in 2026.` });
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setMessage({ type: 'error', text: `Failed to sync year budgets.` });
    }
  };

  const changeMonth = (delta: number) => {
    const [year, m] = month.split('-').map(Number);
    const date = new Date(year, m - 1 + delta, 1);
    
    // Restrict to Jan 2026 - Dec 2026
    if (date.getFullYear() !== 2026) return;
    
    setMonth(`2026-${String(date.getMonth() + 1).padStart(2, '0')}`);
  };

  const formatEuro = (val: number) => {
    return (val || 0).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
  };

  const totalBudgeted = budgetData.reduce((sum, b) => sum + (b.total_budget || 0), 0);

  return (
    <div className="space-y-8 pb-12">
      <PageHeader 
        title="Budget Manager" 
        description="Plan your finances for 2026 by category."
      >
        <div className="flex flex-wrap items-center gap-4">
            {/* MONTH NAVIGATOR */}
            <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-xl border shadow-sm">
              <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => changeMonth(-1)} disabled={month === '2026-01' || loading}>
                  <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-2 px-4 border-x border-muted-foreground/10">
                  <Calendar className="h-4 w-4 text-primary" />
                  <span className="font-bold text-xs min-w-[110px] text-center uppercase tracking-wider text-foreground/80">
                  {new Date(month + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </span>
              </div>
              <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => changeMonth(1)} disabled={month === '2026-12' || loading}>
                  <ArrowRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="h-8 w-px bg-muted mx-1 hidden lg:block" />

            {/* QUICK ACTIONS */}
            <div className="flex items-center gap-3">
                <div className="relative group">
                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground group-focus-within:text-primary transition-colors pointer-events-none" />
                    <Select 
                        value={selectedToAdd}
                        onChange={(e) => handleAddCategory(e.target.value)}
                        options={allCategories.filter(cat => 
                            !budgetData.some(b => b.category_name === cat) && 
                            !['Unknown', 'Salary', 'Benefit'].includes(cat)
                        )}
                        placeholder="Add Category..."
                        disabled={loading}
                        className="h-11 pl-9 w-48 text-[10px] font-bold uppercase tracking-tight bg-card border-muted-foreground/20 hover:border-primary/50 transition-all shadow-sm rounded-xl"
                    />
                </div>

                <Button 
                    variant="default" 
                    size="sm" 
                    onClick={syncYear} 
                    disabled={loading}
                    title="Apply this setup to ALL months of 2026 (Jan - Dec)" 
                    className="h-11 px-5 text-[10px] uppercase font-bold tracking-widest shadow-md rounded-xl hover:scale-[1.02] transition-transform active:scale-95"
                >
                   <ArrowRightCircle className="h-4 w-4 mr-2" />
                   Sync All 2026
                </Button>
            </div>
        </div>
      </PageHeader>

      {message && (
        <div className={cn(
          "p-4 rounded-lg text-sm font-medium animate-in fade-in slide-in-from-top-2",
          message.type === 'success' ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"
        )}>
          {message.text}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-12">
        <div className="md:col-span-8 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Monthly Targets</CardTitle>
              <CardDescription>
                Combine fixed baseline costs with additional variable allowance for {month}.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {budgetData.filter(b => b.category_name !== 'Unknown' && b.category_name !== 'Salary' && b.category_name !== 'Benefit').sort((a,b) => a.category_name.localeCompare(b.category_name)).map(data => {
                  const cat = data.category_name;
                  // Rounding comparison to avoid precision issues
                  const isUnderfunded = Math.round(data.total_budget * 100) < Math.round(data.fixed_baseline * 100);
                  
                  return (
                    <div key={cat} className={cn(
                      "flex flex-col md:flex-row md:items-center justify-between group p-4 rounded-xl border transition-all gap-4",
                      isUnderfunded ? "bg-red-50/30 border-red-200" : "hover:bg-muted/30"
                    )}>
                      <div className="space-y-1">
                        <p className="text-sm font-bold uppercase tracking-wider text-foreground/80">{cat}</p>
                        <div className="flex flex-wrap items-center gap-2">
                           <span className="text-[10px] text-muted-foreground uppercase font-bold bg-muted px-1.5 py-0.5 rounded" title="Commitment from your Fixed Expenses">Committed: {formatEuro(data.fixed_baseline)}</span>
                           <span className={cn(
                             "text-[10px] uppercase font-bold px-1.5 py-0.5 rounded transition-all",
                             data.flexible_allowance < -0.01 ? "bg-red-100 text-red-600" : "bg-emerald-100 text-emerald-600"
                           )} title="What's left for daily spending (Total Target - Fixed Commitment)">
                             Allowance: {formatEuro(data.flexible_allowance)}
                           </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="space-y-1.5">
                           <label className="text-[10px] font-bold uppercase text-muted-foreground block text-right">Total Target Budget</label>
                           <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-bold">€</span>
                            <Input
                              key={`${cat}-${month}`}
                              type="number"
                              className={cn(
                                "w-40 pl-7 h-10 font-mono font-bold text-right text-base",
                                isUnderfunded ? "border-red-400 focus:ring-red-500 shadow-sm shadow-red-100" : "border-muted-foreground/20"
                              )}
                              defaultValue={data.total_budget || ''}
                              onBlur={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                // Precision-safe check for change
                                if (Math.round(val * 100) !== Math.round(data.total_budget * 100)) {
                                  handleSave(cat, val);
                                }
                              }}
                              placeholder="0.00"
                            />
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-10 w-10 mt-5 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleDelete(cat)}
                          title="Remove custom budget (will fallback to Fixed Baseline)"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-4 space-y-6">
          <Card className="bg-primary text-primary-foreground border-none shadow-xl">
            <CardHeader>
              <CardTitle className="text-white/90 flex items-center gap-2">
                <TrendingDown className="h-5 w-5" />
                Budget Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <p className="text-xs font-bold uppercase tracking-widest text-white/60">Total Planned Spending</p>
                <p className="text-4xl font-bold tracking-tighter">{formatEuro(totalBudgeted)}</p>
              </div>
              <p className="text-xs text-white/70 leading-relaxed">
                This is your total expected outflow for {new Date(month + '-01').toLocaleDateString('en-US', { month: 'long' })} across all categorized budgets.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm uppercase tracking-widest text-muted-foreground">Pro Tip</CardTitle>
            </CardHeader>
            <CardContent className="text-xs space-y-4 leading-relaxed text-muted-foreground">
              <p>Targets are specific to each month. This allows you to plan for higher spending during holidays or lower spending during vacations.</p>
              <p>Your 2025 targets have been pre-filled based on your historical spending average from your uploaded Excel records.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
