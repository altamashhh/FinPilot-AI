import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, ArrowUp, ArrowDown, HelpCircle, ShoppingBag, Bolt, Briefcase, Car, Dumbbell, Shield, Award, Sparkles, AlertCircle, Loader2, FileDown, FileText } from 'lucide-react';
import { Transaction, Budget } from '../types';
import { getDashboardData, downloadPdfReport, downloadCsvReport } from '../services/api';

interface DashboardProps {
  transactions: Transaction[];
  budgets: Budget[];
  onViewChange: (view: string) => void;
  onNewTransaction: () => void;
}

export default function Dashboard({
  transactions,
  budgets, // Still needed if we use it, but mostly we use dashboard data
  onViewChange,
  onNewTransaction
}: DashboardProps) {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [isDownloadingCsv, setIsDownloadingCsv] = useState(false);

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
  }, [transactions, budgets]);

  // ── Export Handlers ─────────────────────────────────────────────
  const handleDownloadPdf = async () => {
    setIsDownloadingPdf(true);
    try {
      await downloadPdfReport();
    } catch (err) {
      console.error('PDF download failed:', err);
      alert('Failed to generate PDF report. Please try again.');
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handleDownloadCsv = async () => {
    setIsDownloadingCsv(true);
    try {
      await downloadCsvReport();
    } catch (err) {
      console.error('CSV download failed:', err);
      alert('Failed to export CSV. Please try again.');
    } finally {
      setIsDownloadingCsv(false);
    }
  };

  if (loading && !dashboardData) {
    return (
      <div className="flex items-center justify-center h-64 text-[#00236f] dark:text-[#4d7ef2]">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  const {
    total_income = 0,
    total_expense = 0,
    savings = 0,
    category_spending = [],
    budget_utilization = [],
    highest_spending_category = ''
  } = dashboardData || {};

  const remainingBudget = budget_utilization.reduce((sum: number, b: any) => sum + (b.limit_amount - b.spent), 0);
  // Map colors for categories dynamically
  const categoryColors = ['#00236f', '#006c49', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899'];
  const mapColor = (idx: number) => categoryColors[idx % categoryColors.length];

  // Match category icons helper
  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'food':
      case 'food & dining':
      case 'food & drink':
        return <UtensilsIcon />;
      case 'bills':
      case 'utilities':
        return <Bolt className="text-[#00236f]" size={18} />;
      case 'salary':
      case 'income':
        return <Briefcase className="text-[#00236f]" size={18} />;
      case 'travel':
      case 'travel & transport':
        return <Car className="text-[#00236f]" size={18} />;
      case 'lifestyle':
      case 'entertainment':
        return <Dumbbell className="text-[#00236f]" size={18} />;
      default:
        return <ShoppingBag className="text-[#00236f]" size={18} />;
    }
  };

  const getCategoryBadgeClass = (category: string) => {
    switch (category.toLowerCase()) {
      case 'food':
      case 'food & dining':
      case 'food & drink':
        return 'bg-[#6cf8bb] text-[#00714d]';
      case 'bills':
      case 'utilities':
        return 'bg-[#d3e4fe] text-[#0b1c30]';
      case 'salary':
      case 'income':
        return 'bg-[#6cf8bb] text-[#00714d]';
      case 'travel':
      case 'travel & transport':
        return 'bg-[#dce1ff] text-[#00236f]';
      case 'lifestyle':
      case 'entertainment':
        return 'bg-amber-100 text-amber-700';
      default:
        return 'bg-[#eceef0] text-[#444651]';
    }
  };

  // Inline utensils icon to avoid missing module errors
  function UtensilsIcon() {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#00236f]">
        <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
        <path d="M7 2v20" />
        <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
      </svg>
    );
  }

  // Get first 5 rows
  const recentTxList = transactions.slice(0, 5);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#00236f] dark:text-[#4d7ef2] font-sans">Financial Overview</h1>
          <p className="text-base text-[#444651] dark:text-slate-400 mt-1">Welcome back, Alex. Your wealth grew by 4.2% this month.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button 
            onClick={() => onViewChange('budget')}
            className="flex items-center gap-2 border border-[#c5c5d3] dark:border-slate-700 bg-white dark:bg-[#131926] px-4 py-2 rounded-lg text-sm font-semibold text-[#191c1e] dark:text-white hover:bg-[#eceef0] dark:hover:bg-[#181d2a] transition-all cursor-pointer"
          >
            <span>This Month</span>
          </button>

          {/* Generate PDF Report button */}
          <button
            id="btn-generate-pdf-report"
            onClick={handleDownloadPdf}
            disabled={isDownloadingPdf}
            className="flex items-center gap-2 border border-[#00236f] dark:border-[#4d7ef2] bg-[#00236f] dark:bg-[#4d7ef2] px-4 py-2 rounded-lg text-sm font-semibold text-white hover:bg-[#001a55] dark:hover:bg-[#3d6de0] transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isDownloadingPdf
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <FileText size={15} />}
            <span>{isDownloadingPdf ? 'Generating…' : 'Generate Report'}</span>
          </button>

          {/* Export CSV button */}
          <button
            id="btn-export-csv"
            onClick={handleDownloadCsv}
            disabled={isDownloadingCsv}
            className="flex items-center gap-2 border border-[#006c49] dark:border-emerald-500 bg-white dark:bg-[#131926] px-4 py-2 rounded-lg text-sm font-semibold text-[#006c49] dark:text-emerald-400 hover:bg-[#f0fff8] dark:hover:bg-[#0d1f18] transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isDownloadingCsv
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <FileDown size={15} />}
            <span>{isDownloadingCsv ? 'Exporting…' : 'Export CSV'}</span>
          </button>
        </div>
      </div>

      {/* Summary Cards Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Income */}
        <div className="bg-white dark:bg-[#121622] p-6 rounded-2xl border border-[#e6e8ea] dark:border-slate-800 hover:shadow-md transition-all flex flex-col gap-2 relative">
          <div className="flex justify-between items-start">
            <span className="p-2 bg-[#dce1ff] dark:bg-[#1c2b4c] rounded-lg text-[#00236f] dark:text-[#4d7ef2]">
              <TrendingUp size={20} />
            </span>
            <div className="flex items-center text-[#00714d] dark:text-emerald-400 text-xs font-semibold bg-[#6cf8bb] dark:bg-emerald-950/40 px-2.5 py-1 rounded-full">
              <ArrowUp size={12} className="mr-0.5" />
              12.5%
            </div>
          </div>
          <span className="text-sm font-medium text-[#444651] dark:text-slate-400">Total Income</span>
          <span className="text-3xl font-bold text-[#00236f] dark:text-[#4d7ef2] tracking-tight font-sans">
            ${total_income.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>

        {/* Total Expenses */}
        <div className="bg-white dark:bg-[#121622] p-6 rounded-2xl border border-[#e6e8ea] dark:border-slate-800 hover:shadow-md transition-all flex flex-col gap-2 relative">
          <div className="flex justify-between items-start">
            <span className="p-2 bg-[#ffdad6] dark:bg-red-950/40 rounded-lg text-[#ba1a1a] dark:text-red-400">
              <TrendingDown size={20} />
            </span>
          </div>
          <span className="text-sm font-medium text-[#444651] dark:text-slate-400">Total Expenses</span>
          <span className="text-3xl font-bold text-[#191c1e] dark:text-slate-200 tracking-tight font-sans">
            ${total_expense.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>

        {/* Total Savings */}
        <div className="bg-white dark:bg-[#121622] p-6 rounded-2xl border border-[#e6e8ea] dark:border-slate-800 hover:shadow-md transition-all flex flex-col gap-2 relative">
          <div className="flex justify-between items-start">
            <span className="p-2 bg-[#6cf8bb] dark:bg-emerald-950/40 rounded-lg text-[#006c49] dark:text-emerald-400">
              <Award size={20} />
            </span>
          </div>
          <span className="text-sm font-medium text-[#444651] dark:text-slate-400">Total Savings</span>
          <span className="text-3xl font-bold text-[#191c1e] dark:text-slate-200 tracking-tight font-sans">
            ${savings.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
        </div>

        {/* Remaining Budget */}
        <div className="bg-white dark:bg-[#121622] p-6 rounded-2xl border border-[#e6e8ea] dark:border-slate-800 hover:shadow-md transition-all flex flex-col gap-2 relative">
          <div className="flex justify-between items-start">
            <span className="p-2 bg-[#d3e4fe] dark:bg-[#1b2b3f] rounded-lg text-[#1b2b3f] dark:text-[#a5c6f9]">
              <Shield size={20} />
            </span>
            <span className="text-[#444651] dark:text-slate-400 text-xs font-bold bg-[#f2f4f6] dark:bg-slate-800 px-2.5 py-1 rounded-full">Budget Tracker</span>
          </div>
          <span className="text-sm font-medium text-[#444651] dark:text-slate-400">Remaining Budget</span>
          <span className="text-3xl font-bold text-[#00236f] dark:text-[#4d7ef2] tracking-tight font-sans">
            ${remainingBudget.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {/* Visualization Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar Chart: Monthly Expenses */}
        <div className="lg:col-span-2 bg-white dark:bg-[#121622] p-6 rounded-2xl border border-[#e6e8ea] dark:border-slate-800 hover:shadow-sm transition-all flex flex-col justify-between">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-[#191c1e] dark:text-white">Monthly Expenses</h3>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-[#00236f] dark:bg-blue-600 rounded-full"></span>
                <span className="text-xs font-medium text-[#444651] dark:text-slate-400">Actual</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-[#b6c4ff] dark:bg-blue-400/40 rounded-full"></span>
                <span className="text-xs font-medium text-[#444651] dark:text-slate-400">Projected</span>
              </div>
            </div>
          </div>
 
          {/* Styled flexible SVG Representation of clean bars matching Mock Screen exactly */}
          <div className="h-64 w-full flex items-end gap-6 px-2 border-b border-[#e6e8ea] dark:border-slate-800 pb-2">
            {[
              { month: 'Jan', act: 60, proj: 50 },
              { month: 'Feb', act: 45, proj: 55 },
              { month: 'Mar', act: 80, proj: 70 },
              { month: 'Apr', act: 55, proj: 60 },
              { month: 'May', act: 90, proj: 85 },
              { month: 'Jun', act: 75, proj: 80 },
            ].map((d, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group cursor-pointer">
                <div className="w-full flex items-end gap-1.5 h-[80%] hover:scale-105 transition-all">
                  <div className="bg-[#00236f] dark:bg-blue-600 w-1/2 rounded-t-md transition-all shadow-sm" style={{ height: `${d.act}%` }}></div>
                  <div className="bg-[#b6c4ff] dark:bg-blue-400/50 w-1/2 rounded-t-md transition-all shadow-sm" style={{ height: `${d.proj}%` }}></div>
                </div>
                <span className="text-xs font-medium text-[#444651] dark:text-slate-400">{d.month}</span>
              </div>
            ))}
          </div>
        </div>
 
        {/* Pie Chart / Donut Chart: Category Spending */}
        <div className="bg-white dark:bg-[#121622] p-6 rounded-2xl border border-[#e6e8ea] dark:border-slate-800 hover:shadow-sm transition-all">
          <h3 className="text-lg font-bold text-[#191c1e] dark:text-white mb-6">Category Spending</h3>
          <div className="flex flex-col items-center">
            <div className="relative w-44 h-44 mb-6">
              {/* Dynamic SVG Circle Donut */}
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="#f2f4f6" strokeWidth="4" className="dark:stroke-slate-800"></circle>
                {category_spending.map((c: any, idx: number) => {
                  const dashArr = Math.round((c.total_spent / (total_expense || 1)) * 100);
                  const prevDashSum = category_spending.slice(0, idx).reduce((sum: number, prev: any) => sum + Math.round((prev.total_spent / (total_expense || 1)) * 100), 0);
                  return (
                    <circle 
                      key={c.category}
                      cx="18" cy="18" r="15.915" fill="none" stroke={mapColor(idx)} strokeWidth="4" 
                      strokeDasharray={`${dashArr} 100`} 
                      strokeDashoffset={-prevDashSum} 
                    />
                  );
                })}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-bold text-[#00236f] dark:text-[#4d7ef2] font-sans">
                  ${(total_expense / 1000).toFixed(1)}k
                </span>
                <span className="text-[10px] text-[#444651] dark:text-slate-400 font-bold uppercase tracking-wider">Spent</span>
              </div>
            </div>
 
            {/* Labels */}
            <div className="w-full space-y-2.5">
              {category_spending.slice(0, 5).map((item: any, idx: number) => (
                <div key={item.category} className="flex justify-between items-center text-xs font-medium">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: mapColor(idx) }}></span>
                    <span className="text-[#444651] dark:text-slate-400 truncate max-w-[100px]">{item.category}</span>
                  </div>
                  <span className="text-[#191c1e] dark:text-slate-250 font-bold">
                    {Math.round((item.total_spent / (total_expense || 1)) * 100)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Transaction list + Budget usage sliders */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Transactions Container */}
        <div className="lg:col-span-2 bg-white dark:bg-[#121622] rounded-2xl border border-[#e6e8ea] dark:border-slate-800 hover:shadow-sm transition-all overflow-hidden">
          <div className="p-6 border-b border-[#e6e8ea] dark:border-slate-800 flex justify-between items-center">
            <h3 className="text-lg font-bold text-[#191c1e] dark:text-white">Recent Transactions</h3>
            <button 
              onClick={() => onViewChange('history')}
              className="text-[#00236f] dark:text-[#4d7ef2] text-sm font-semibold hover:underline cursor-pointer"
            >
              View All
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-[#f2f4f6] dark:bg-[#181d2a] text-xs font-bold text-[#444651] dark:text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Description</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e6e8ea] dark:divide-slate-800 text-sm text-[#191c1e] dark:text-slate-200">
                {recentTxList.map((tx) => (
                  <tr key={tx.id} className="hover:bg-[#f2f4f6] dark:hover:bg-[#1c2333] transition-all cursor-pointer">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3 font-medium">
                        <div className="w-8 h-8 rounded-full bg-[#eceef0] dark:bg-slate-800 flex items-center justify-center">
                          {getCategoryIcon(tx.category)}
                        </div>
                        <span className="truncate max-w-[200px]">{tx.description}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 text-xs font-semibold rounded-md ${getCategoryBadgeClass(tx.category)}`}>
                        {tx.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-[#444651] dark:text-slate-400">
                      {new Date(tx.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className={`px-6 py-4 text-right font-semibold ${tx.type === 'income' ? 'text-[#006c49] dark:text-emerald-400' : 'text-[#ba1a1a] dark:text-red-400'}`}>
                      {tx.type === 'income' ? '+' : '-'}${Math.abs(tx.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Budget Usage Container */}
        <div className="bg-white dark:bg-[#121622] p-6 rounded-2xl border border-[#e6e8ea] dark:border-slate-800 hover:shadow-sm transition-all">
          <h3 className="text-lg font-bold text-[#191c1e] dark:text-white mb-6">Budget Usage</h3>
          <div className="space-y-5">
            {budget_utilization.length > 0 ? budget_utilization.slice(0, 4).map((bu: any, idx: number) => {
              const isDanger = bu.usage_percentage > 85;
              const isWarning = bu.usage_percentage > 70 && !isDanger;
              let barColor = 'bg-[#00236f] dark:bg-blue-500';
              if (isDanger) barColor = 'bg-[#ba1a1a] dark:bg-red-500';
              else if (isWarning) barColor = 'bg-[#f59e0b] dark:bg-amber-500';

              return (
                <div key={bu.category} className="space-y-2">
                  <div className="flex justify-between items-center text-xs font-semibold text-[#191c1e] dark:text-slate-200">
                    <span>{bu.category}</span>
                    <span className="text-[#444651] dark:text-slate-450">${bu.spent} / ${bu.limit_amount}</span>
                  </div>
                  <div className="w-full h-2 bg-[#eceef0] dark:bg-[#181d2a] rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${barColor}`} style={{ width: `${Math.min(bu.usage_percentage, 100)}%` }}></div>
                  </div>
                  <p className={`text-[11px] ${isDanger ? 'text-red-500 font-medium' : 'text-[#444651] dark:text-slate-400'}`}>
                    {bu.usage_percentage}% of budget used. {isDanger ? 'Caution recommended.' : 'On track.'}
                  </p>
                </div>
              )
            }) : (
              <p className="text-sm text-slate-500">No budgets set. Create budgets to track usage.</p>
            )}

            {/* AI Insight Card */}
            {highest_spending_category && (
              <div className="mt-8 p-4 bg-[#dce1ff]/40 dark:bg-blue-950/20 rounded-xl border border-[#00236f] dark:border-blue-500 border-opacity-10 dark:border-opacity-20 flex gap-3">
                <span className="p-1.5 bg-[#b6c4ff] dark:bg-blue-900/40 rounded-lg text-[#00236f] dark:text-[#4d7ef2] h-fit">
                  <Sparkles size={16} />
                </span>
                <div>
                  <span className="text-xs font-bold text-[#00236f] dark:text-[#4d7ef2] block">AI Insight</span>
                  <p className="text-xs text-[#1e3a8a] dark:text-blue-300 leading-relaxed mt-1">
                    Your highest spending category is {highest_spending_category}. Check your insights tab for more advice!
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
