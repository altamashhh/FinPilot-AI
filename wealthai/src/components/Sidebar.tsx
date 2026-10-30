import { 
  LayoutDashboard, 
  PlusCircle, 
  Wallet, 
  History, 
  TrendingUp, 
  Bot,
  LogOut
} from 'lucide-react';

interface SidebarProps {
  currentView: string;
  onViewChange: (view: string) => void;
  userName: string;
  userAvatar: string;
  userPlan: string;
  onLogout: () => void;
}

export default function Sidebar({ 
  currentView, 
  onViewChange,
  userName,
  userAvatar,
  userPlan,
  onLogout
}: SidebarProps) {
  const menuItems = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
    { id: 'add-transaction', name: 'Add Transaction', icon: PlusCircle },
    { id: 'budget', name: 'Budget Management', icon: Wallet },
    { id: 'history', name: 'Transaction History', icon: History },
    { id: 'insights', name: 'AI Insights', icon: TrendingUp },
    { id: 'assistant', name: 'AI Assistant', icon: Bot },
  ];

  return (
    <aside id="sidebar" className="h-screen w-64 fixed left-0 top-0 bg-white dark:bg-[#121622] border-r border-[#e6e8ea] dark:border-slate-800 flex flex-col py-6 z-50 transition-colors duration-200">
      <div className="px-6 mb-10">
        <span className="text-2xl font-bold tracking-tight text-[#00236f] dark:text-[#4d7ef2] block">WealthAI</span>
        <p className="text-xs font-medium uppercase tracking-wider text-[#444651] dark:text-slate-400 opacity-70 mt-1">Premium Assistant</p>
      </div>
      
      <nav className="flex-1 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`w-full flex items-center gap-3 px-6 py-3 text-left transition-all duration-150 cursor-pointer ${
                isActive 
                  ? 'text-[#00236f] dark:text-[#4d7ef2] font-bold border-l-4 border-[#00236f] dark:border-[#4d7ef2] bg-[#eceef0] dark:bg-[#181d2a]' 
                  : 'text-[#444651] dark:text-slate-400 hover:bg-[#f2f4f6] dark:hover:bg-[#181d2a] opacity-90'
              }`}
            >
              <Icon size={18} className={isActive ? 'text-[#00236f] dark:text-[#4d7ef2]' : 'text-[#444651] dark:text-slate-450'} />
              <span className="text-sm font-medium">{item.name}</span>
            </button>
          );
        })}
      </nav>

      <div className="px-6 mt-auto space-y-4">
        {/* User Identity Info */}
        <div className="flex items-center gap-3 p-3 rounded-xl bg-[#f2f4f6] dark:bg-[#181d2a] border border-[#e6e8ea] dark:border-slate-800 transition-all">
          <img 
            className="w-10 h-10 rounded-full object-cover border border-[#c5c5d3] dark:border-slate-700 shadow-sm" 
            src={userAvatar} 
            alt={userName}
            referrerPolicy="no-referrer"
          />
          <div className="overflow-hidden">
            <p className="text-sm font-semibold text-[#191c1e] dark:text-white truncate">{userName}</p>
            <p className="text-[10px] font-bold text-[#444651] dark:text-slate-400 uppercase tracking-wider opacity-80">{userPlan}</p>
          </div>
        </div>

        {/* Brand-new interactive Log-out Button */}
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-red-200 dark:border-red-950/40 text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 active:scale-[97%] transition-all cursor-pointer"
        >
          <LogOut size={13} />
          End Corporate Session
        </button>
      </div>
    </aside>
  );
}
