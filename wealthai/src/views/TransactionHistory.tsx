import { useState, useMemo } from 'react';
import { Calendar, Search, Filter, ArrowUp, ArrowDown, Sparkles, AlertTriangle, Play, HelpCircle, ChevronLeft, ChevronRight, MoreVertical } from 'lucide-react';
import { Transaction } from '../types';

interface TransactionHistoryProps {
  transactions: Transaction[];
  onAddTransactionClick: () => void;
}

export default function TransactionHistory({
  transactions,
  onAddTransactionClick
}: TransactionHistoryProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [dateRange, setDateRange] = useState('');
  const [selectedType, setSelectedType] = useState<'All' | 'income' | 'expense'>('All');
  const [sortBy, setSortBy] = useState('Date (Newest)');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Compute calculated metrics for Header sum
  const inflowSum = useMemo(() => {
    return transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  const outflowSum = useMemo(() => {
    return Math.abs(
      transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0)
    );
  }, [transactions]);

  // Extract unique categories for options
  const uniqueCategories = useMemo(() => {
    const list = new Set(transactions.map((t) => t.category));
    return ['All Categories', ...Array.from(list)];
  }, [transactions]);

  // Apply filters and sorting
  const filteredAndSortedTransactions = useMemo(() => {
    let result = [...transactions];

    // Description Search
    if (searchTerm.trim() !== '') {
      result = result.filter((t) => 
        t.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Category
    if (selectedCategory !== 'All Categories') {
      result = result.filter((t) => t.category === selectedCategory);
    }

    // Type (All/Income/Expense)
    if (selectedType !== 'All') {
      result = result.filter((t) => t.type === selectedType);
    }

    // Date Range (if chosen)
    if (dateRange) {
      result = result.filter((t) => t.date === dateRange);
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'Date (Newest)') {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      } else if (sortBy === 'Date (Oldest)') {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      } else if (sortBy === 'Amount (High)') {
        return Math.abs(b.amount) - Math.abs(a.amount);
      } else if (sortBy === 'Amount (Low)') {
        return Math.abs(a.amount) - Math.abs(b.amount);
      }
      return 0;
    });

    return result;
  }, [transactions, searchTerm, selectedCategory, dateRange, selectedType, sortBy]);

  // Paginated chunk
  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedTransactions.slice(start, start + itemsPerPage);
  }, [filteredAndSortedTransactions, currentPage]);

  const totalPages = Math.ceil(filteredAndSortedTransactions.length / itemsPerPage) || 1;

  return (
    <div className="space-y-6 animate-fade-in text-[#191c1e]">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-[#00236f] font-sans">Transaction History</h2>
          <p className="text-sm text-[#444651] mt-1">Review and manage your financial movements with precision.</p>
        </div>

        {/* Dynamic Summaries */}
        <div className="flex gap-4">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-[#e6e8ea] flex items-center gap-4">
            <span className="bg-[#6cf8bb] p-2 rounded-full text-[#00714d]">
              <ArrowUp size={16} />
            </span>
            <div>
              <p className="text-[10px] font-bold text-[#444651] uppercase tracking-wider">Monthly Inflow</p>
              <p className="text-base font-bold text-[#006c49] font-sans">
                ${inflowSum.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm border border-[#e6e8ea] flex items-center gap-4">
            <span className="bg-[#ffdad6] p-2 rounded-full text-[#ba1a1a]">
              <ArrowDown size={16} />
            </span>
            <div>
              <p className="text-[10px] font-bold text-[#444651] uppercase tracking-wider">Monthly Outflow</p>
              <p className="text-base font-bold text-[#ba1a1a] font-sans">
                ${outflowSum.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Filter Bar */}
      <div className="bg-white rounded-xl border border-[#e6e8ea] p-4 flex flex-wrap items-center gap-4 shadow-sm">
        {/* Keywords */}
        <div className="flex-1 min-w-[200px] space-y-1">
          <label className="text-xs font-bold text-[#444651] block uppercase tracking-wider">Filter by Description</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#444651]" size={16} />
            <input 
              type="text" 
              placeholder="E.g. Starbucks, Rent..." 
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full border border-[#c5c5d3] rounded-lg pl-10 pr-4 py-2 text-sm outline-none focus:border-[#00236f]"
            />
          </div>
        </div>

        {/* Categories */}
        <div className="w-48 space-y-1">
          <label className="text-xs font-bold text-[#444651] block uppercase tracking-wider">Category</label>
          <select 
            value={selectedCategory}
            onChange={(e) => { setSelectedCategory(e.target.value); setCurrentPage(1); }}
            className="w-full border border-[#c5c5d3] bg-white rounded-lg px-3 py-2 text-sm outline-none focus:border-[#00236f]"
          >
            {uniqueCategories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Calendar Range */}
        <div className="w-48 space-y-1">
          <label className="text-xs font-bold text-[#444651] block uppercase tracking-wider">Date</label>
          <input 
            type="date" 
            value={dateRange}
            onChange={(e) => { setDateRange(e.target.value); setCurrentPage(1); }}
            className="w-full border border-[#c5c5d3] rounded-lg px-3 py-2 text-sm outline-none focus:border-[#00236f]"
          />
        </div>

        {/* Type Toggles (All/Income/Expense) */}
        <div className="w-44 space-y-1">
          <label className="text-xs font-bold text-[#444651] block uppercase tracking-wider">Type</label>
          <div className="flex bg-[#f2f4f6] p-1 rounded-lg border border-[#e6e8ea]">
            {['All', 'income', 'expense'].map((t) => (
              <button
                key={t}
                onClick={() => { setSelectedType(t as any); setCurrentPage(1); }}
                className={`flex-1 px-3 py-1 text-xs font-bold rounded capitalize transition-all ${
                  selectedType === t 
                    ? 'bg-white text-[#00236f] shadow-sm' 
                    : 'text-[#444651] hover:bg-white hover:bg-opacity-40'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Sorting Dropdowns */}
        <div className="w-44 space-y-1">
          <label className="text-xs font-bold text-[#444651] block uppercase tracking-wider">Sort By</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full border border-[#c5c5d3] bg-white rounded-lg px-3 py-2 text-sm outline-none focus:border-[#00236f]"
          >
            <option>Date (Newest)</option>
            <option>Date (Oldest)</option>
            <option>Amount (High)</option>
            <option>Amount (Low)</option>
          </select>
        </div>
      </div>

      {/* Comprehensive Data Table */}
      <div className="bg-white rounded-xl border border-[#e6e8ea] overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#f2f4f6] border-b border-[#e6e8ea] text-xs font-bold text-[#444651] uppercase tracking-wider">
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Category</th>
              <th className="px-6 py-4">Description</th>
              <th className="px-6 py-4">Type</th>
              <th className="px-6 py-4 text-right">Amount</th>
              <th className="px-6 py-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e6e8ea] text-sm font-medium">
            {paginatedTransactions.map((tx) => (
              <tr key={tx.id} className="hover:bg-[#f2f4f6] transition-all cursor-pointer group">
                <td className="px-6 py-4 text-[#444651]">
                  {new Date(tx.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </td>
                <td className="px-6 py-4 font-bold">
                  {tx.category}
                </td>
                <td className="px-6 py-4 text-[#444651]">
                  {tx.description}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                    tx.type === 'income' ? 'bg-[#6cf8bb] text-[#00714d]' : 'bg-[#ffdad6] text-[#ba1a1a]'
                  }`}>
                    {tx.type}
                  </span>
                </td>
                <td className={`px-6 py-4 text-right font-bold font-sans ${tx.type === 'income' ? 'text-[#006c49]' : 'text-[#ba1a1a]'}`}>
                  {tx.type === 'income' ? '+' : '-'}${Math.abs(tx.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="opacity-0 group-hover:opacity-100 p-1 hover:bg-[#eceef0] rounded text-[#444651] transition-all">
                    <MoreVertical size={16} />
                  </button>
                </td>
              </tr>
            ))}
            {paginatedTransactions.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-[#444651]">
                  No transactions found matching the selected criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Paginator */}
        <div className="bg-[#f2f4f6] px-6 py-4 flex items-center justify-between border-t border-[#e6e8ea]">
          <div className="text-xs text-[#444651] font-semibold">
            Showing <span className="font-bold text-[#191c1e]">{filteredAndSortedTransactions.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} - {Math.min(currentPage * itemsPerPage, filteredAndSortedTransactions.length)}</span> of <span className="font-bold text-[#191c1e]">{filteredAndSortedTransactions.length}</span> records
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-[#c5c5d3] bg-white text-[#444651] hover:bg-[#eceef0] disabled:opacity-50"
            >
              <ChevronLeft size={16} />
            </button>
            <div className="flex gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentPage(idx)}
                  className={`w-8 h-8 rounded-lg text-xs font-bold ${
                    currentPage === idx ? 'bg-[#00236f] text-white' : 'hover:bg-[#eceef0] text-[#191c1e]'
                  }`}
                >
                  {idx}
                </button>
              ))}
            </div>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg border border-[#c5c5d3] bg-white text-[#444651] hover:bg-[#eceef0] disabled:opacity-50"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* AI Quick Insights Panels */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Forecast */}
        <div className="bg-[#00236f] text-white p-6 rounded-2xl flex flex-col justify-between h-48 relative overflow-hidden group shadow-sm">
          <div className="relative z-10">
            <h3 className="text-xs font-bold uppercase tracking-wider opacity-80 mb-2">AI Forecasting</h3>
            <p className="text-xl font-bold tracking-tight leading-relaxed">You are on track to save $1,200 more this month.</p>
          </div>
          <div className="relative z-10 flex items-center gap-2 text-[#b6c4ff]">
            <Sparkles size={16} />
            <span className="text-xs font-medium">Powered by WealthAI</span>
          </div>
          <div className="absolute right-[-20%] bottom-[-20%] w-64 h-64 bg-white opacity-10 rounded-full blur-3xl group-hover:scale-110 transition-all duration-700"></div>
        </div>

        {/* Warning Alerts */}
        <div className="bg-[#f2f4f6] p-6 rounded-2xl border border-[#e6e8ea] flex flex-col justify-between h-48">
          <div>
            <h3 className="text-xs font-bold text-[#444651] uppercase tracking-wider mb-2">Recurring Alert</h3>
            <div className="flex items-start gap-4">
              <span className="bg-[#ffdad6] p-2.5 rounded-lg text-[#ba1a1a]">
                <AlertTriangle size={18} />
              </span>
              <div>
                <p className="text-[#191c1e] text-sm font-bold">Unusual Activity</p>
                <p className="text-xs text-[#444651] leading-relaxed mt-1">2 new subscriptions detected this week. Review them now.</p>
              </div>
            </div>
          </div>
          <button onClick={() => alert('Opening unusual activities detail log...')} className="text-[#00236f] text-xs font-bold hover:underline text-left">View Details</button>
        </div>

        {/* Limits */}
        <div className="bg-white p-6 rounded-2xl border border-[#e6e8ea] h-48 flex flex-col justify-between shadow-sm">
          <div>
            <h3 className="text-xs font-bold text-[#444651] uppercase tracking-wider mb-2">Spending Velocity</h3>
            <div className="w-full bg-[#eceef0] rounded-full h-2 mt-3">
              <div className="bg-[#006c49] h-full rounded-full" style={{ width: '65%' }}></div>
            </div>
          </div>
          <div className="flex justify-between items-end">
            <div>
              <p className="text-sm font-bold text-[#006c49]">Stable</p>
              <p className="text-[10px] text-[#444651] tracking-wider uppercase mt-1">Daily avg: $240.00</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-[#444651] tracking-wider uppercase mb-1">Limit: $400.00</p>
              <p className="text-xs font-bold text-[#191c1e]">65% utilized</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
