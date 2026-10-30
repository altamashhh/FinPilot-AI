import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowUp, Filter, SortAsc, Edit, Trash2, ShieldAlert, Check, TrendingUp, Info, Loader2 } from 'lucide-react';
import { Budget } from '../types';
import { getDashboardData, createBudget } from '../services/api';

interface BudgetManagementProps {
  budgets: Budget[];
  onApplyShift: () => void;
  shiftApplied: boolean;
  onNewBudget: () => void;
  onBudgetsUpdated?: () => void;
}

export default function BudgetManagement({
  budgets, // keeping for backwards compatibility, but we will fetch dashboard data
  onApplyShift,
  shiftApplied,
  onNewBudget,
  onBudgetsUpdated
}: BudgetManagementProps) {
  const [activeTrendRange, setActiveTrendRange] = useState<'6m' | '1y'>('6m');
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const data = await getDashboardData();
        setDashboardData(data);
      } catch (err) {
        console.error('Failed to load dashboard data', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [budgets]); // refetch if App's budgets change

  const handleCreateBudget = async () => {
    const categoryName = window.prompt("Enter Budget Category (e.g. Shopping, Housing):");
    if (!categoryName) return;
    const limit = window.prompt("Enter Budget Limit Amount:");
    if (!limit || isNaN(parseFloat(limit))) {
      alert("Invalid amount");
      return;
    }
    
    try {
      setLoading(true);
      await createBudget({ category: categoryName, limit_amount: parseFloat(limit) });
      if (onBudgetsUpdated) onBudgetsUpdated();
      // Refetch local dashboard data
      const data = await getDashboardData();
      setDashboardData(data);
    } catch (err: any) {
      alert(err.message || "Failed to create budget");
      setLoading(false);
    }
  };

  if (loading && !dashboardData) {
    return (
      <div className="flex items-center justify-center h-64 text-[#00236f] dark:text-[#4d7ef2]">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  const budgetUtilization = dashboardData?.budget_utilization || [];
  
  const overallSpent = budgetUtilization.reduce((sum: number, b: any) => sum + b.spent, 0);
  const overallLimit = budgetUtilization.reduce((sum: number, b: any) => sum + b.limit_amount, 0);
  const leftAmount = overallLimit - overallSpent;
  const utilizationPercentage = overallLimit > 0 ? Math.round((overallSpent / overallLimit) * 100) : 0;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Section */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-[#00236f] font-sans">Budget Control</h2>
          <p className="text-sm text-[#444651] mt-1">Monitor and manage your spending limits for October 2023.</p>
        </div>
        <button 
          onClick={handleCreateBudget}
          className="bg-[#00236f] text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2 hover:bg-opacity-90 active:scale-95 transition-all shadow-sm"
        >
          <span>Create New Budget</span>
        </button>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Left Column (Top summary + AI card) */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          {/* Overall Status Card */}
          <div className="bg-white p-6 rounded-2xl border border-[#e6e8ea] shadow-sm relative overflow-hidden">
            <h3 className="text-xs font-bold text-[#444651] uppercase tracking-wider mb-4">Set Monthly Budget</h3>
            
            <div className="mb-6">
              <p className="text-3xl font-bold text-[#191c1e] font-sans">
                ${overallLimit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
              <div className="flex items-center gap-1 mt-1 text-[#006c49]">
                <TrendingUp size={14} />
                <p className="text-xs font-semibold">8.2% from last month</p>
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <div className="flex justify-between text-xs font-semibold mb-2">
                  <span className="text-[#444651]">Utilization</span>
                  <span className="font-bold text-[#191c1e]">{utilizationPercentage}%</span>
                </div>
                <div className="w-full bg-[#eceef0] h-3 rounded-full overflow-hidden">
                  <div 
                    className="bg-[#00236f] h-full rounded-full transition-all duration-500" 
                    style={{ width: `${utilizationPercentage}%` }}
                  ></div>
                </div>
              </div>

              <div className="pt-4 border-t border-[#e6e8ea] flex justify-between items-center">
                <div className="text-center flex-1">
                  <p className="text-[10px] text-[#444651] uppercase font-bold tracking-wider">Spent</p>
                  <p className="text-base font-bold text-[#191c1e] font-sans">
                    ${overallSpent.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="w-[1px] h-8 bg-[#e6e8ea]"></div>
                <div className="text-center flex-1">
                  <p className="text-[10px] text-[#444651] uppercase font-bold tracking-wider">Left</p>
                  <p className="text-base font-bold text-[#006c49] font-sans">
                    ${leftAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* AI Spending Predictor Box */}
          <div className="bg-[#1b2b3f] text-white p-6 rounded-2xl shadow-md relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4 text-[#b6c4ff]">
                <Sparkles size={16} />
                <h3 className="text-xs font-bold uppercase tracking-wider">AI INSIGHT</h3>
              </div>
              <p className="text-sm leading-relaxed mb-6">
                {shiftApplied ? (
                  <span className="flex items-center gap-2 font-medium text-[#6cf8bb]">
                    <Check size={16} />
                    Suggested Shift applied successfully! $120.00 re-allocated from Entertainment to Shopping budget.
                  </span>
                ) : (
                  <>
                    Based on current trends, you are projected to exceed your Shopping budget by <span className="text-[#6cf8bb] font-bold">$120</span>. Consider re-allocating from your Entertainment fund.
                  </>
                )}
              </p>
              {!shiftApplied && (
                <button 
                  onClick={onApplyShift}
                  className="bg-white bg-opacity-10 hover:bg-opacity-20 border border-white border-opacity-30 px-4 py-2.5 rounded-lg text-xs font-bold transition-all w-full text-center"
                >
                  Apply Suggested Shift
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Category Budgets list */}
        <div className="col-span-12 lg:col-span-8">
          <div className="bg-white p-6 rounded-2xl border border-[#e6e8ea] shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-[#191c1e]">Category Budgets</h3>
              <div className="flex gap-2">
                <button className="p-2 border border-[#c5c5d3] rounded-lg hover:bg-[#f2f4f6]" title="Filter">
                  <Filter size={16} className="text-[#444651]" />
                </button>
                <button className="p-2 border border-[#c5c5d3] rounded-lg hover:bg-[#f2f4f6]" title="Sort">
                  <SortAsc size={16} className="text-[#444651]" />
                </button>
              </div>
            </div>

            {/* Budget List */}
            <div className="space-y-4">
              {budgetUtilization.length === 0 && (
                <p className="text-sm text-[#444651]">No budgets set. Create budgets to track usage.</p>
              )}
              {budgetUtilization.map((b: any) => {
                const overspent = b.spent > b.limit_amount;
                const isWarningRange = b.spent / b.limit_amount >= 0.85;

                return (
                  <div key={b.category} className="group border border-[#e6e8ea] hover:border-[#00236f] rounded-2xl p-4 transition-all hover:bg-[#f2f4f6]">
                    <div className="flex items-center justify-between mb-4">
                      {/* Left: icon + detail */}
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl bg-opacity-65 flex items-center justify-center bg-[#eceef0]`}>
                          <Info size={20} className="text-[#00236f]" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-[#191c1e]">{b.category}</p>
                          <p className="text-xs text-[#444651]">{b.lastActive}</p>
                        </div>
                      </div>

                      {/* Right: Spent values */}
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm font-bold text-[#191c1e]">${b.limit_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                          <p className="text-[10px] text-[#444651] uppercase font-bold tracking-wider">Total Budget</p>
                        </div>
                        {/* Interactive edit mockups */}
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => alert('Editing limit...')} className="p-2 hover:bg-[#e6e8ea] rounded-full text-[#444651] hover:text-[#00236f]">
                            <Edit size={14} />
                          </button>
                          <button onClick={() => alert('Deleting budget')} className="p-2 hover:bg-[#e6e8ea] rounded-full text-[#444651] hover:text-[#ba1a1a]">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Progress slider */}
                    <div className="space-y-2">
                      <div className="w-full bg-[#eceef0] h-2 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all`} 
                          style={{ 
                            width: `${Math.min(100, (b.spent / b.limit_amount) * 100)}%`,
                            backgroundColor: overspent ? '#ba1a1a' : isWarningRange ? '#ba1a1a' : '#006c49'
                          }}
                        ></div>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className={`font-semibold ${overspent ? 'text-[#ba1a1a] font-bold' : isWarningRange ? 'text-[#ba1a1a]' : 'text-[#006c49]'}`}>
                          {Math.round((b.spent / b.limit_amount) * 100)}% Used (${b.spent.toLocaleString('en-US', { minimumFractionDigits: 2 })})
                        </span>
                        <span className="text-[#444651] font-bold">
                          {overspent 
                            ? `Overspend: -$${(b.spent - b.limit_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}` 
                            : `Remaining: $${(b.limit_amount - b.spent).toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Grid Row: Budget History Trends (6 Months chart) */}
      <div className="grid grid-cols-1 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-[#e6e8ea] shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-[#191c1e]">Budget History Trends</h3>
            <div className="flex bg-[#f2f4f6] p-1 rounded-lg">
              <button 
                onClick={() => setActiveTrendRange('6m')}
                className={`px-4 py-1.5 rounded-md text-xs font-bold shadow-sm transition-all ${
                  activeTrendRange === '6m' ? 'bg-white text-[#00236f]' : 'text-[#444651] hover:text-[#191c1e]'
                }`}
              >
                6 Months
              </button>
              <button 
                onClick={() => setActiveTrendRange('1y')}
                className={`px-4 py-1.5 rounded-md text-xs font-bold shadow-sm transition-all ${
                  activeTrendRange === '1y' ? 'bg-white text-[#00236f]' : 'text-[#444651] hover:text-[#191c1e]'
                }`}
              >
                1 Year
              </button>
            </div>
          </div>

          {/* Historical Columns Representation */}
          <div className="h-64 flex items-end justify-between gap-4 px-2 pt-6">
            {[
              { month: 'MAY', total: '100%', actual: '60%' },
              { month: 'JUN', total: '100%', actual: '75%' },
              { month: 'JUL', total: '100%', actual: '45%' },
              { month: 'AUG', total: '100%', actual: '90%' },
              { month: 'SEP', total: '100%', actual: '55%' },
              { month: 'OCT', total: '100%', actual: '80%' },
            ].map((bar, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center group cursor-pointer">
                <div className="w-full bg-[#eceef0] rounded-t-lg relative h-44 group-hover:bg-[#e6e8ea] transition-all">
                  <div 
                    className="absolute bottom-0 w-full bg-[#00236f] rounded-t-lg transition-all" 
                    style={{ height: bar.actual }}
                  ></div>
                </div>
                <span className="text-[10px] mt-2 text-[#444651] font-bold tracking-wider">{bar.month}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
