export interface Transaction {
  id: string;
  date: string;
  category: string;
  description: string;
  type: 'expense' | 'income';
  amount: number;
}

export interface Budget {
  category: string;
  totalBudget: number;
  spent: number;
  remaining: number;
  iconName: string;
  bgClass: string;
  textClass: string;
  percentageUsed: number;
  lastActive: string;
  statusText: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  dataViz?: {
    label: string;
    value: string;
    change: string;
    percentage: number;
  };
}

export interface SmartRecommendation {
  id: string;
  title: string;
  text: string;
  type: 'saving' | 'warning' | 'investment';
  category: string;
  buttonLabel: string;
  icon: string;
}

export interface SpendingCategory {
  name: string;
  amount: number;
  percentage: number;
  color: string;
}
