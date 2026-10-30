import { useState, useMemo, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './views/Dashboard';
import AddTransaction from './views/AddTransaction';
import BudgetManagement from './views/BudgetManagement';
import TransactionHistory from './views/TransactionHistory';
import AIInsights from './views/AIInsights';
import AIAssistant from './views/AIAssistant';
import Login from './views/Login';

import { Transaction, Budget } from './types';
import { getToken, setToken, removeToken } from './config/api';
import { getTransactions, getBudgets } from './services/api';

export default function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [shiftApplied, setShiftApplied] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');

  // Authentication State
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return getToken() !== null;
  });
  const [sessionExpiredMsg, setSessionExpiredMsg] = useState('');

  const [currentUserEmail, setCurrentUserEmail] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('wealth-user-email') || 'demo@wealthai.com';
    }
    return 'demo@wealthai.com';
  });

  // Dark Mode / Theme State
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('wealth-theme') || 'light';
    }
    return 'light';
  });

  // Synchronize document dark class on mount and theme changes
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Session expiration listener
  useEffect(() => {
    const handleSessionExpired = () => {
      setIsLoggedIn(false);
      setSessionExpiredMsg('Session expired. Please log in again.');
      setCurrentView('dashboard');
    };
    window.addEventListener('session-expired', handleSessionExpired);
    return () => window.removeEventListener('session-expired', handleSessionExpired);
  }, []);

  // Fetch global data on login
  const fetchData = async () => {
    try {
      const txData = await getTransactions();
      const formattedTx = txData.map((t: any) => ({
        id: t.id.toString(),
        date: t.transaction_date,
        category: t.category,
        description: t.description,
        type: t.transaction_type,
        amount: t.amount
      }));
      setTransactions(formattedTx);

      const budgetData = await getBudgets();
      const formattedBudgets = budgetData.map((b: any) => ({
        category: b.category,
        totalBudget: b.limit_amount,
        spent: 0, // will be computed in dashboard or kept here
        remaining: b.limit_amount,
        iconName: 'piggy-bank',
        bgClass: 'bg-blue-50',
        textClass: 'text-blue-600',
        percentageUsed: 0,
        lastActive: 'Just now',
        statusText: 'Active'
      }));
      setBudgets(formattedBudgets);
    } catch (err) {
      console.error("Failed to fetch app data", err);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchData();
    }
  }, [isLoggedIn]);

  // Login handler
  const handleLogin = (email: string, token: string) => {
    setToken(token);
    setCurrentUserEmail(email);
    setIsLoggedIn(true);
    setSessionExpiredMsg('');
    localStorage.setItem('wealth-user-email', email);
  };

  // Logout handler
  const handleLogout = () => {
    removeToken();
    setIsLoggedIn(false);
  };

  // Theme Toggler
  const handleToggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    localStorage.setItem('wealth-theme', nextTheme);
  };

  // Profile specifications
  const userName = useMemo(() => {
    if (currentUserEmail.includes('@')) {
      const prefix = currentUserEmail.split('@')[0];
      return prefix.charAt(0).toUpperCase() + prefix.slice(1);
    }
    return currentUserEmail || 'Alex Rivera';
  }, [currentUserEmail]);

  const userAvatar = 'https://lh3.googleusercontent.com/aida-public/AB6AXuDs3SuVn9MIXXAgw31a-SPraz0LhzXcMLeyZf3dG5RrAKmDk9blhmBLI4gWl8KrWzHi3KE7y2AT7Fir5DnTo8Yi7RBEMJxD7R_M4Cc-dsC7_KePcqADcyM-Dp4yCwepf9Vt5VHYbpEfba8GWsuBao0sfSwSnBdIS7OiRhDGqeEEWkFN-C1Z1pvFqKC26tYQAA5raAjrqQE85127ucOGzJd-hT9aGJYxUjAu9fY9LDpEVygyaJbLkBrhKS7L46oerr9A0hyLgngAZg';
  const userPlan = 'Pro Member';

  // State transaction injector with balance updating triggers 
  const handleAddTransaction = () => {
    fetchData(); // Just refetch to keep simple
  };

  // Interactive re-allocation solver simulation
  const handleApplyBudgetShift = () => {
    setShiftApplied(true);
  };

  // Refresh budgets when a new one is added
  const handleBudgetsUpdated = () => {
    fetchData();
  };

  // Compute search filters
  const filteredTransactions = useMemo(() => {
    if (!globalSearch.trim()) return transactions;
    return transactions.filter(t => 
      t.description.toLowerCase().includes(globalSearch.toLowerCase()) ||
      t.category.toLowerCase().includes(globalSearch.toLowerCase())
    );
  }, [transactions, globalSearch]);

  const renderActiveView = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <Dashboard 
            transactions={filteredTransactions} 
            budgets={budgets} 
            onViewChange={setCurrentView}
            onNewTransaction={() => setCurrentView('add-transaction')}
          />
        );
      case 'add-transaction':
        return (
          <AddTransaction 
            onAddTransaction={handleAddTransaction} 
            onCancel={() => setCurrentView('dashboard')}
          />
        );
      case 'budget':
        return (
          <BudgetManagement 
            budgets={budgets} 
            shiftApplied={shiftApplied} 
            onApplyShift={handleApplyBudgetShift}
            onNewBudget={() => setCurrentView('add-transaction')}
            onBudgetsUpdated={handleBudgetsUpdated}
          />
        );
      case 'history':
        return (
          <TransactionHistory 
            transactions={filteredTransactions} 
            onAddTransactionClick={() => setCurrentView('add-transaction')}
          />
        );
      case 'insights':
        return (
          <AIInsights />
        );
      case 'assistant':
        return (
          <AIAssistant 
            userName={userName} 
            userAvatar={userAvatar} 
          />
        );
      default:
        return (
          <Dashboard 
            transactions={filteredTransactions} 
            budgets={budgets} 
            onViewChange={setCurrentView}
            onNewTransaction={() => setCurrentView('add-transaction')}
          />
        );
    }
  };

  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} defaultEmail={currentUserEmail} sessionExpiredMsg={sessionExpiredMsg} />;
  }

  return (
    <div id="wealth-ai-root" className="min-h-screen bg-[#f7f9fb] dark:bg-[#0c0f17] font-sans antialiased text-[#191c1e] dark:text-[#eff1f5] transition-colors duration-200">
      {/* Sidebar - fixed left */}
      <Sidebar 
        currentView={currentView} 
        onViewChange={setCurrentView} 
        userName={userName}
        userAvatar={userAvatar}
        userPlan={userPlan}
        onLogout={handleLogout}
      />

      {/* Header - fixed top */}
      <Header 
        currentView={currentView}
        onSearch={setGlobalSearch}
        onNewTransaction={() => setCurrentView('add-transaction')}
        onExport={() => alert('Exporting active records as CSV summary...')}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />

      {/* Main Content viewport */}
      <main className="ml-64 pt-24 pb-12 px-8 max-w-7xl mx-auto">
        <div className="w-full transition-opacity duration-250 ease-in-out">
          {renderActiveView()}
        </div>
      </main>
    </div>
  );
}
