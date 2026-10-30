import { Search, Bell, Settings, Plus, Download, Sun, Moon } from 'lucide-react';

interface HeaderProps {
  currentView: string;
  onSearch: (query: string) => void;
  onNewTransaction: () => void;
  onExport: () => void;
  theme: string;
  onToggleTheme: () => void;
  searchPlaceholder?: string;
}

export default function Header({
  currentView,
  onSearch,
  onNewTransaction,
  onExport,
  theme,
  onToggleTheme,
  searchPlaceholder = 'Search analytics or transactions...'
}: HeaderProps) {
  const getHeaderAction = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <button 
            onClick={onNewTransaction}
            className="bg-[#00236f] dark:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 hover:bg-opacity-95 dark:hover:bg-opacity-90 active:scale-95 transition-all shadow-sm cursor-pointer"
          >
            <Plus size={16} />
            New Transaction
          </button>
        );
      case 'history':
        return (
          <button 
            onClick={onExport}
            className="bg-[#00236f] dark:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 hover:bg-opacity-95 dark:hover:bg-opacity-90 active:scale-95 transition-all shadow-sm cursor-pointer"
          >
            <Download size={16} />
            Export CSV
          </button>
        );
      case 'budget':
        return (
          <button 
            onClick={onNewTransaction}
            className="bg-[#00236f] dark:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 hover:bg-opacity-95 dark:hover:bg-opacity-90 active:scale-95 transition-all shadow-sm cursor-pointer"
          >
            <Plus size={16} />
            Create New Budget
          </button>
        );
      case 'insights':
        return (
          <button 
            onClick={onExport}
            className="bg-[#00236f] dark:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 hover:bg-opacity-95 dark:hover:bg-opacity-90 active:scale-95 transition-all shadow-sm cursor-pointer"
          >
            <Plus size={16} />
            Generate Report
          </button>
        );
      default:
        return null;
    }
  };

  return (
    <header className="fixed top-0 right-0 z-40 bg-white dark:bg-[#121622] border-b border-[#e6e8ea] dark:border-slate-800 flex justify-between items-center px-6 ml-64 w-[calc(100%-16rem)] h-16 transition-colors duration-200">
      {/* Search Input */}
      <div className="flex items-center bg-[#f2f4f6] dark:bg-[#181d2a] px-4 py-2 rounded-full w-96 border border-[#e6e8ea] dark:border-slate-800 transition-all focus-within:ring-2 focus-within:ring-[#00236f] dark:focus-within:ring-blue-500 focus-within:bg-white dark:focus-within:bg-[#181d2a]">
        <Search size={16} className="text-[#444651] dark:text-slate-400 mr-2" />
        <input 
          type="text" 
          placeholder={searchPlaceholder}
          onChange={(e) => onSearch(e.target.value)}
          className="bg-transparent border-none outline-none text-sm w-full font-sans text-[#191c1e] dark:text-white placeholder-[#444651] dark:placeholder-slate-400 placeholder-opacity-60 focus:ring-0"
        />
      </div>

      {/* Actions / Utilities */}
      <div className="flex items-center gap-4">
        {/* Theme Toggle */}
        <button 
          onClick={onToggleTheme}
          className="hover:bg-[#f2f4f6] dark:hover:bg-[#1d2433] p-2 rounded-full transition-all text-[#444651] dark:text-slate-300 cursor-pointer"
          title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
        >
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} className="text-amber-400" />}
        </button>

        {/* Notifications */}
        <button className="hover:bg-[#f2f4f6] dark:hover:bg-[#1d2433] p-2 rounded-full transition-all relative text-[#444651] dark:text-slate-300 cursor-pointer">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#ba1a1a] rounded-full"></span>
        </button>

        {/* Settings */}
        <button className="hover:bg-[#f2f4f6] dark:hover:bg-[#1d2433] p-2 rounded-full transition-all text-[#444651] dark:text-slate-300 cursor-pointer">
          <Settings size={18} />
        </button>

        <div className="h-8 w-[1px] bg-[#e6e8ea] dark:bg-slate-800"></div>

        {/* Highlight contextual action button */}
        {getHeaderAction()}
      </div>
    </header>
  );
}
