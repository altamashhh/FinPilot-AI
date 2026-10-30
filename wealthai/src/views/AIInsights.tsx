import React, { useState, useEffect } from 'react';
import { Sparkles, TrendingUp, TrendingDown, ArrowRight, CheckCircle, AlertTriangle, HelpCircle, Utensils, Plane, Download, Quote, Loader2, Info } from 'lucide-react';
import { getInsights, getDashboardData, getAiAdvice } from '../services/api';

export default function AIInsights() {
  const [data, setData] = useState<any>({ insights: null, dashboard: null, advice: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAll() {
      try {
        setLoading(true);
        const [insights, dashboard, ai] = await Promise.all([
          getInsights(),
          getDashboardData(),
          getAiAdvice().catch(() => ({ advice: ["AI Advisor is currently analyzing your data..."] })) // Fallback if AI fails
        ]);
        setData({ insights, dashboard, advice: ai });
      } catch (err) {
        console.error('Failed to load AI Insights data', err);
      } finally {
        setLoading(false);
      }
    }
    loadAll();
  }, []);

  if (loading && !data.insights) {
    return (
      <div className="flex items-center justify-center h-64 text-[#00236f] dark:text-[#4d7ef2]">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  const { insights, dashboard, advice } = data;
  const healthScore = Math.max(0, Math.min(100, Math.round(insights?.summary?.savings_rate || 0)));
  const categorySpending = dashboard?.category_spending || [];
  const budgetUtilization = dashboard?.budget_utilization || [];
  const totalExpense = dashboard?.total_expense || 0;
  
  // Map colors for categories dynamically
  const categoryColors = ['#00236f', '#006c49', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899'];
  const mapColor = (idx: number) => categoryColors[idx % categoryColors.length];

  return (
    <div className="space-y-8 animate-fade-in text-[#191c1e]">
      {/* Header Section */}
      <section className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-[#00236f] font-sans">Financial Intelligence</h2>
          <p className="text-sm text-[#444651] mt-1">Personalized spending patterns and wealth optimization.</p>
        </div>
        <div className="flex gap-2">
          <span className="bg-[#6cf8bb] text-[#00714d] px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 shadow-sm border border-[#00714d] border-opacity-10">
            <CheckCircle size={12} />
            AI Optimized
          </span>
          <span className="bg-[#eceef0] text-[#444651] px-3.5 py-1.5 rounded-full text-xs font-bold">Updated 2m ago</span>
        </div>
      </section>

      {/* Bento Grid layout */}
      <div className="grid grid-cols-12 gap-6">
        {/* Health Score Card */}
        <div className="col-span-12 lg:col-span-4 bg-white p-6 rounded-2xl border border-[#e6e8ea] shadow-sm flex flex-col items-center justify-center relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#00236f] bg-opacity-[0.03] rounded-full blur-3xl"></div>
          <h3 className="text-xs font-bold text-[#444651] uppercase tracking-wider mb-6">Health Score</h3>
          
          <div className="relative w-44 h-44 flex items-center justify-center">
            {/* Health Score Gauge */}
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" fill="none" r="45" stroke="#f2f4f6" strokeWidth="8"></circle>
              <circle cx="50" cy="50" fill="none" r="45" stroke="#006c49" strokeDasharray="282.7" strokeDashoffset="42.4" strokeLinecap="round" strokeWidth="8"></circle>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-bold text-[#00236f] font-sans">{healthScore}</span>
              <span className="text-xs font-bold text-[#006c49] uppercase tracking-wider mt-0.5">
                {healthScore > 20 ? 'Excellent' : healthScore > 10 ? 'Good' : 'Needs Work'}
              </span>
            </div>
          </div>

          <p className="text-center text-xs text-[#444651] leading-relaxed mt-6 px-4">
            Your savings rate is {healthScore}%. {healthScore > 20 ? "You're doing great!" : "Consider looking for ways to reduce expenses."}
          </p>

          <div className="mt-6 w-full flex justify-between items-center bg-[#f2f4f6] p-4 rounded-xl border border-[#e6e8ea]">
            <span className="text-xs font-medium text-[#444651]">Based on income vs expenses</span>
            <TrendingUp size={16} className="text-[#006c49]" />
          </div>
        </div>

        {/* Spending Analysis Donut diagram */}
        <div className="col-span-12 lg:col-span-8 bg-white p-6 rounded-2xl border border-[#e6e8ea] shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-[#00236f]">Spending Breakdown</h3>
            <select className="bg-[#f2f4f6] border-none text-[#444651] rounded-lg text-xs font-semibold py-1.5 px-3">
              <option>Last 30 Days</option>
              <option>Current Quarter</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            {/* Left Diagram */}
            <div className="h-44 flex items-center justify-center relative">
              <div className="w-40 h-40 rounded-full border-[14px] border-[#00236f] flex items-center justify-center relative">
                <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-white rounded-full m-4">
                  <p className="text-[10px] text-[#444651] uppercase font-bold tracking-wider">Total</p>
                  <p className="text-lg font-bold text-[#00236f] font-sans">${totalExpense.toLocaleString()}</p>
                </div>
                <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  {categorySpending.map((c: any, idx: number) => {
                    const dashArr = Math.round((c.total_spent / (totalExpense || 1)) * 100);
                    const prevDashSum = categorySpending.slice(0, idx).reduce((sum: number, prev: any) => sum + Math.round((prev.total_spent / (totalExpense || 1)) * 100), 0);
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
              </div>
            </div>

            {/* Right list values */}
            <div className="flex flex-col justify-center space-y-4">
              {categorySpending.length === 0 && <p className="text-sm text-slate-500">No expenses recorded yet.</p>}
              {categorySpending.slice(0, 5).map((item: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between group cursor-pointer hover:bg-[#f2f4f6] p-1.5 rounded-lg transition-all">
                  <div className="flex items-center gap-3">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: mapColor(idx) }}></span>
                    <span className="text-sm font-medium text-[#444651]">{item.category}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">${item.total_spent.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
                    <p className="text-xs text-[#444651]">{Math.round((item.total_spent / (totalExpense || 1)) * 100)}%</p>
                  </div>
                </div>
              ))}
              <div className="pt-3 border-t border-[#e6e8ea]">
                <a onClick={() => alert('Detail transaction maps...')} className="text-[#00236f] font-bold text-xs flex items-center gap-1 cursor-pointer hover:underline">
                  Full Transaction Map
                  <ArrowRight size={12} className="mt-0.5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Smart Recommendations cards */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="p-1.5 bg-[#dce1ff] text-[#00236f] rounded-lg">
            <Sparkles size={18} />
          </span>
          <h3 className="text-lg font-bold text-[#00236f]">Smart Recommendations</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Combined Recommendations */}
          <div className="relative bg-white p-6 rounded-2xl border border-[#e6e8ea] hover:scale-[1.01] transition-all flex flex-col shadow-sm">
            <div className="absolute inset-0 bg-[#00236f] bg-opacity-[0.01] pointer-events-none rounded-2xl"></div>
            <span className="w-10 h-10 bg-[#dce1ff] text-[#00236f] rounded-xl flex items-center justify-center mb-4">
              <Sparkles size={18} />
            </span>
            <h4 className="text-base font-bold text-[#00236f] mb-2">General Recommendations</h4>
            <div className="space-y-3 mb-6 flex-1">
              {insights?.recommendations?.length > 0 ? insights.recommendations.map((rec: any, idx: number) => (
                <p key={idx} className="text-xs text-[#444651] leading-relaxed flex gap-2">
                  <span className="text-[#00236f] font-bold">•</span> {rec.message}
                </p>
              )) : (
                <p className="text-xs text-slate-500">No new recommendations right now.</p>
              )}
            </div>
          </div>

          {/* Card 2: Alerts */}
          <div className="bg-white p-6 rounded-2xl border border-[#e6e8ea] hover:scale-[1.01] transition-all flex flex-col shadow-sm">
            <span className="w-10 h-10 bg-[#ffdad6] text-[#ba1a1a] rounded-xl flex items-center justify-center mb-4">
              <AlertTriangle size={18} />
            </span>
            <h4 className="text-base font-bold text-[#ba1a1a] mb-2">Actionable Alerts</h4>
            <div className="space-y-3 mb-6 flex-1">
              {insights?.alerts?.length > 0 ? insights.alerts.map((al: any, idx: number) => (
                <p key={idx} className="text-xs text-[#444651] leading-relaxed flex gap-2">
                  <span className="text-[#ba1a1a] font-bold">•</span> {al.message}
                </p>
              )) : (
                <p className="text-xs text-slate-500">You have no pending alerts.</p>
              )}
            </div>
          </div>

          {/* Card 3: AI Advisor Tips */}
          <div className="bg-[#00236f] text-white p-6 rounded-2xl flex flex-col relative overflow-hidden group hover:scale-[1.01] transition-all shadow-md">
            <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-white bg-opacity-10 rounded-full blur-2xl group-hover:scale-125 transition-all"></div>
            <span className="w-10 h-10 bg-white bg-opacity-20 rounded-xl flex items-center justify-center mb-4">
              <TrendingUp size={18} />
            </span>
            <h4 className="text-base font-bold mb-2">AI Advisor Tips</h4>
            <div className="space-y-3 mb-6 flex-1">
              {advice?.advice?.length > 0 ? advice.advice.slice(0, 2).map((adv: string, idx: number) => (
                <p key={idx} className="text-xs text-white text-opacity-80 leading-relaxed flex gap-2">
                  <span className="text-emerald-400 font-bold">•</span> {adv}
                </p>
              )) : (
                <p className="text-xs text-white opacity-80">Check your AI chat for more details.</p>
              )}
            </div>
            <button className="w-full py-2.5 bg-white text-[#00236f] font-bold text-xs rounded-lg hover:bg-[#b6c4ff] transition-all z-10" onClick={() => window.location.hash = "#assistant"}>
              Ask AI
            </button>
          </div>
        </div>
      </div>

      {/* Row 4: Watchlist + Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Watchlist */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-[#e6e8ea] flex flex-col justify-between shadow-sm">
          <div>
            <h3 className="text-xs font-bold text-[#444651] uppercase tracking-wider mb-6">Budget Watchlist</h3>
            <div className="space-y-6">
              {budgetUtilization.length === 0 && (
                <p className="text-xs text-slate-500">No budgets to track yet.</p>
              )}
              {budgetUtilization.slice(0, 3).map((bu: any) => {
                const overspent = bu.usage_percentage > 100;
                return (
                  <div key={bu.category}>
                    <div className="flex justify-between text-xs font-semibold mb-2">
                      <span className="font-bold">{bu.category}</span>
                      <span className={`${overspent ? 'text-[#ba1a1a]' : 'text-[#00236f]'} font-bold`}>{bu.usage_percentage}% used</span>
                    </div>
                    <div className="w-full bg-[#eceef0] h-2 rounded-full overflow-hidden">
                      <div className={`h-full ${overspent ? 'bg-[#ba1a1a]' : 'bg-[#00236f]'}`} style={{ width: `${Math.min(bu.usage_percentage, 100)}%` }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {insights?.alerts?.length > 0 && (
            <div className="mt-8 p-4 bg-[#ffdad6] bg-opacity-[0.15] border border-[#ba1a1a] border-opacity-25 rounded-xl flex gap-3 text-xs">
              <AlertTriangle className="text-[#ba1a1a] flex-shrink-0" size={16} />
              <p className="text-[#ba1a1a] font-medium leading-relaxed">
                {insights.alerts[0].message}
              </p>
            </div>
          )}
        </div>

        {/* Report Card */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-[#e6e8ea] flex flex-col justify-between shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-[#00236f]">October Monthly Report</h3>
            <button onClick={() => alert('Downloading reports PDF...')} className="text-[#00236f] p-2 hover:bg-[#f2f4f6] rounded-lg">
              <Download size={18} />
            </button>
          </div>

          <div className="space-y-6 flex-1">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-[#f2f4f6] border border-[#e6e8ea]">
                <p className="text-[10px] text-[#444651] uppercase font-bold tracking-wider mb-1">Net Savings</p>
                <p className="text-lg font-bold text-[#006c49] font-sans">
                  ${(insights?.summary?.savings || 0).toLocaleString(undefined, {minimumFractionDigits:2})}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#f2f4f6] border border-[#e6e8ea]">
                <p className="text-[10px] text-[#444651] uppercase font-bold tracking-wider mb-1">Total Transactions</p>
                <p className="text-lg font-bold text-[#00236f] font-sans">{insights?.summary?.transaction_count || 0}</p>
              </div>
            </div>

            <div className="bg-[#f7f9fb] border border-[#e6e8ea] rounded-xl p-5 relative overflow-hidden">
              <h4 className="text-xs font-bold text-[#00236f] mb-3 flex items-center gap-1.5 uppercase tracking-wider">
                <Quote size={12} className="text-[#444651]" />
                AI Executive Summary
              </h4>
              <p className="text-xs text-[#444651] leading-relaxed pr-6 select-text whitespace-pre-line">
                {advice?.advice ? (
                  Array.isArray(advice.advice) ? advice.advice.join("\n\n") : advice.advice
                ) : (
                  "AI Advisor requires more transaction history to build a complete summary."
                )}
              </p>
              <div className="absolute top-4 right-4 text-[#00236f] opacity-[0.05]">
                <Quote size={40} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
