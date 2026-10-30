import React, { useState } from 'react';
import { ArrowUpRight, ArrowDownLeft, Calendar, FileText, Upload, Sparkles, Send, CheckCircle, Info, Loader2 } from 'lucide-react';
import { Transaction } from '../types';
import { createTransaction } from '../services/api';

interface AddTransactionProps {
  onAddTransaction: () => void;
  onCancel: () => void;
}

export default function AddTransaction({
  onAddTransaction,
  onCancel
}: AddTransactionProps) {
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const expenseCategories = [
    'Food & Dining',
    'Travel & Transport',
    'Rent & Utilities',
    'Entertainment',
    'Shopping',
    'Health',
    'Other Expense'
  ];

  const incomeCategories = [
    'Salary',
    'Business',
    'Freelance',
    'Investments',
    'Other Income'
  ];

  const activeCategories = type === 'expense' ? expenseCategories : incomeCategories;

  const handleTypeChange = (newType: 'expense' | 'income') => {
    setType(newType);
    setCategory('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!amount || isNaN(parseFloat(amount))) {
      setErrorMsg('Please enter a valid amount.');
      return;
    }

    setLoading(true);
    try {
      const value = parseFloat(amount);
      const finalAmount = type === 'expense' ? -Math.abs(value) : Math.abs(value);

      await createTransaction({
        transaction_date: date,
        category: category, // if empty, backend will auto-categorize based on phase 3b
        description: description || `${type === 'expense' ? 'Expense' : 'Income'}`,
        transaction_type: type,
        amount: finalAmount
      });

      // Call callback to inject transaction
      onAddTransaction();

      // Polish trigger success toast
      setShowToast(true);
      setTimeout(() => {
        setShowToast(false);
        onCancel(); // return to dashboard
      }, 2000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create transaction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in relative">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-[#444651] dark:text-slate-400">
        <span onClick={onCancel} className="text-xs font-semibold cursor-pointer hover:text-[#00236f] dark:hover:text-[#4d7ef2] transition-all">WealthAI</span>
        <span className="text-[#c5c5d3] dark:text-slate-700 text-xs">/</span>
        <span className="text-xs text-[#191c1e] dark:text-slate-200 font-semibold">Add Transaction</span>
      </div>

      {/* Title area */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-[#00236f] dark:text-[#4d7ef2] font-sans">Log New Transaction</h2>
        <p className="text-[#444651] dark:text-slate-400 text-sm mt-1 max-w-2xl leading-relaxed">
          Capture your financial activity with precision. WealthAI will automatically categorize and analyze this entry for your monthly reports.
        </p>
      </div>

      {/* Central Form Card */}
      <section className="bg-white dark:bg-[#121622] rounded-2xl border border-[#e6e8ea] dark:border-slate-800 overflow-hidden shadow-sm">
        {/* Card Header Banner */}
        <div className="p-6 bg-[#00236f] text-white flex justify-between items-center">
          <div className="flex items-center gap-3">
            <FileText size={20} />
            <h3 className="text-lg font-bold">Transaction Details</h3>
          </div>
          <div className="group relative">
            <Info size={18} className="cursor-help hover:text-[#b6c4ff] transition-all" />
            <div className="absolute bottom-full right-0 mb-2 w-64 p-3 bg-[#2d3133] text-[#eff1f3] text-xs rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-all shadow-xl z-20 leading-relaxed">
              WealthAI uses these details to track your spending habits and provide real-time budget warnings.
            </div>
          </div>
        </div>

        {/* Central form template */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 text-[#191c1e]">
          {errorMsg && (
            <div className="p-3 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-xl text-sm">
              {errorMsg}
            </div>
          )}
          {/* Transaction Type Toggle */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-[#444651] uppercase tracking-wider block">Transaction Type</label>
            <div className="flex p-1 bg-[#f2f4f6] rounded-xl w-fit border border-[#e6e8ea]">
              <button
                type="button"
                onClick={() => handleTypeChange('expense')}
                className={`px-8 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
                  type === 'expense' 
                    ? 'bg-[#00236f] text-white shadow-sm' 
                    : 'text-[#444651] hover:text-[#00236f]'
                }`}
              >
                <ArrowUpRight size={14} />
                Expense
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange('income')}
                className={`px-8 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
                  type === 'income' 
                    ? 'bg-[#006c49] text-white shadow-sm' 
                    : 'text-[#444651] hover:text-[#006c49]'
                }`}
              >
                <ArrowDownLeft size={14} />
                Income
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Category Dropdown */}
            <div className="space-y-2">
              <label htmlFor="category" className="text-xs font-bold text-[#444651] uppercase tracking-wider block">
                Category
              </label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full h-12 px-4 rounded-lg border border-[#c5c5d3] bg-white font-medium text-sm focus:border-[#00236f] focus:ring-1 focus:ring-[#00236f] transition-all outline-none"
              >
                <option value="">Auto-Detect Category</option>
                {activeCategories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Amount Input */}
            <div className="space-y-2">
              <label htmlFor="amount" className="text-xs font-bold text-[#444651] uppercase tracking-wider block">
                Amount
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-[#00236f]">$</span>
                <input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full h-12 pl-10 pr-4 rounded-lg border border-[#c5c5d3] font-sans font-bold text-[#191c1e] text-base focus:border-[#00236f] focus:ring-1 focus:ring-[#00236f] transition-all outline-none"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Date Picker */}
            <div className="space-y-2">
              <label htmlFor="date" className="text-xs font-bold text-[#444651] uppercase tracking-wider block">
                Date
              </label>
              <div className="relative">
                <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 text-[#444651] pointer-events-none" size={16} />
                <input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full h-12 px-4 rounded-lg border border-[#c5c5d3] font-medium text-sm focus:border-[#00236f] focus:ring-1 focus:ring-[#00236f] transition-all outline-none"
                />
              </div>
            </div>

            {/* Attachment */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#444651] uppercase tracking-wider block">
                Receipt (Optional)
              </label>
              <div className="w-full h-12 px-4 rounded-lg border border-dashed border-[#c5c5d3] bg-[#f2f4f6] flex items-center justify-center cursor-pointer hover:bg-[#e6e8ea] transition-all group">
                <Upload size={16} className="text-[#444651] group-hover:text-[#00236f] mr-2" />
                <span className="text-xs font-semibold text-[#444651] group-hover:text-[#00236f]">Drag or click to upload</span>
              </div>
            </div>
          </div>

          {/* Description Textarea */}
          <div className="space-y-2">
            <label htmlFor="description" className="text-xs font-bold text-[#444651] uppercase tracking-wider block">Description</label>
            <textarea
              id="description"
              rows={3}
              placeholder="Add a note about this transaction (e.g. Dinner with the team at Bistro)..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-4 rounded-lg border border-[#c5c5d3] font-medium text-sm focus:border-[#00236f] focus:ring-1 focus:ring-[#00236f] transition-all outline-none resize-none"
            ></textarea>
          </div>

          {/* Primary submit buttons */}
          <div className="pt-6 border-t border-[#e6e8ea] flex justify-between items-center">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2 rounded-lg font-semibold text-[#ba1a1a] hover:bg-[#ffdad6] hover:bg-opacity-40 transition-all text-sm"
            >
              Discard
            </button>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => alert('Saved as Draft!')}
                className="px-6 py-2 rounded-lg border border-[#c5c5d3] bg-white text-[#00236f] font-semibold text-sm hover:bg-[#f2f4f6] transition-all"
              >
                Save as Draft
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-10 py-3 rounded-lg bg-[#00236f] hover:bg-opacity-95 text-white font-bold text-sm tracking-wide shadow-md flex items-center gap-2 group transition-all disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin" size={14} /> : (
                  <>
                    Confirm Transaction
                    <Send size={14} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </section>

      {/* Bottom Context Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        <div className="md:col-span-2 bg-[#6cf8bb] bg-opacity-20 border border-[#00714d] border-opacity-20 p-6 rounded-xl flex items-start gap-4">
          <span className="p-3 bg-[#006c49] rounded-lg text-white">
            <Sparkles size={20} />
          </span>
          <div>
            <h4 className="text-sm font-bold text-[#00714d]">AI Optimization Tip</h4>
            <p className="text-xs text-[#00714d] leading-relaxed mt-1">
              Transactions with clear descriptions help WealthAI improve its spending pattern recognition by up to 40%. Try to be as specific as possible!
            </p>
          </div>
        </div>

        <div className="bg-[#f2f4f6] p-6 rounded-xl border border-[#e6e8ea] flex flex-col justify-center items-center text-center">
          <p className="text-xs font-bold text-[#444651]">Daily Limit Remaining</p>
          <p className="text-lg font-bold text-[#00236f] mt-1 font-sans">$1,240.00</p>
          <div className="w-full bg-[#c5c5d3] h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-[#00236f] h-full" style={{ width: '75%' }}></div>
          </div>
        </div>
      </div>

      {/* Highly polished absolute Toast notifications */}
      {showToast && (
        <div className="fixed bottom-10 right-10 bg-[#2d3133] text-[#eff1f3] px-6 py-4 rounded-xl shadow-2xl flex items-center gap-4 z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="w-10 h-10 bg-[#006c49] rounded-full flex items-center justify-center text-white">
            <CheckCircle size={20} />
          </div>
          <div>
            <p className="text-sm font-bold">Transaction Recorded!</p>
            <p className="text-xs text-[#9dadc6]">WealthAI has updated your balance.</p>
          </div>
        </div>
      )}
    </div>
  );
}
