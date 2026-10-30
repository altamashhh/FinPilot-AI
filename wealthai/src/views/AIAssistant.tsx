import { useState, useRef, useEffect } from 'react';
import { Bot, User, Send, Paperclip, Sparkles, TrendingUp, HelpCircle } from 'lucide-react';
import { ChatMessage } from '../types';
import { sendChatMessage } from '../services/api';

interface AIAssistantProps {
  userName: string;
  userAvatar: string;
}

export default function AIAssistant({
  userName,
  userAvatar
}: AIAssistantProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-1',
      sender: 'ai',
      text: "Hello! I'm your AI Finance Assistant. Ask me about your spending, savings, or budgeting goals.",
      timestamp: 'Just now'
    },
    {
      id: 'msg-2',
      sender: 'user',
      text: "Can you summarize my spending for the last 30 days? I'm worried about my grocery bill.",
      timestamp: '2 mins ago'
    },
    {
      id: 'msg-3',
      sender: 'ai',
      text: "I've analyzed your transactions. Your total spending over the last 30 days was $4,250. Your **Grocery** spending is indeed up by 18% compared to last month.",
      timestamp: '1 min ago',
      dataViz: {
        label: 'Grocery Expenditure',
        value: '$842.15',
        change: '+18.2%',
        percentage: 85
      }
    }
  ]);

  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    // Append user message
    const newMessage: ChatMessage = {
      id: `msg-usr-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: 'Just now'
    };

    setMessages((prev) => [...prev, newMessage]);
    setInput('');
    setIsTyping(true);

    try {
      const result = await sendChatMessage(textToSend);
      
      const responseMessage: ChatMessage = {
        id: `msg-ai-${Date.now()}`,
        sender: 'ai',
        text: result.answer || "I received your message but could not generate a proper response.",
        timestamp: 'Just now'
      };

      setMessages((prev) => [...prev, responseMessage]);
    } catch (err: any) {
      const errorMessage: ChatMessage = {
        id: `msg-ai-err-${Date.now()}`,
        sender: 'ai',
        text: `Error: ${err.message || 'Failed to communicate with AI.'}`,
        timestamp: 'Just now'
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const suggestionChips = [
    '"Show monthly summary"',
    '"How\'s my saving goal?"',
    '"Analyze investment risk"'
  ];

  const conversationHistory = [
    { title: 'Investment Portfolio Review', time: '2 hours ago', active: true },
    { title: 'Monthly Spending Analysis', time: 'Yesterday', active: false },
    { title: 'Saving Goal: New Car', time: 'Oct 12, 2023', active: false },
    { title: 'Tax Optimization Q4', time: 'Oct 05, 2023', active: false }
  ];

  return (
    <section className="flex flex-col lg:flex-row h-[calc(100vh-100px)] border border-[#e6e8ea] bg-white rounded-2xl overflow-hidden shadow-sm animate-fade-in text-[#191c1e]">
      {/* Left panel: history rails */}
      <div className="w-full lg:w-80 border-r border-[#e6e8ea] flex flex-col h-full bg-white flex-shrink-0">
        <div className="p-6 flex flex-col h-full">
          <h2 className="text-lg font-bold text-[#00236f] mb-4">Conversations</h2>
          
          <button 
            onClick={() => alert('Starting new financial portfolio analysis session...')}
            className="w-full flex items-center justify-center gap-2 bg-[#00236f] text-white py-3 rounded-xl font-bold text-sm hover:bg-opacity-95 active:scale-95 transition-all mb-6 shadow-sm"
          >
            <span>+ New Analysis</span>
          </button>

          <div className="space-y-3.5 overflow-y-auto flex-1 max-h-[calc(100vh-320px)] pr-1">
            <p className="text-[10px] font-bold text-[#444651] uppercase tracking-wider mb-2 opacity-70">Recent</p>
            {conversationHistory.map((history, idx) => (
              <div 
                key={idx} 
                onClick={() => alert(`Reviewing previous session: ${history.title}`)}
                className={`p-3.5 rounded-xl cursor-pointer border transition-all ${
                  history.active 
                    ? 'bg-[#eceef0] border-l-4 border-l-[#00236f] border-[#e6e8ea]' 
                    : 'hover:bg-[#f2f4f6] border-transparent'
                }`}
              >
                <p className={`text-xs font-bold truncate ${history.active ? 'text-[#00236f]' : 'text-[#444651]'}`}>
                  {history.title}
                </p>
                <p className="text-[10px] text-[#444651] opacity-70 mt-1 font-medium">{history.time}</p>
              </div>
            ))}
          </div>

          <div className="mt-auto pt-4 border-t border-[#e6e8ea]">
            <div className="bg-[#f2f4f6] p-4 rounded-xl border border-[#e6e8ea] relative overflow-hidden flex flex-col gap-1 shadow-sm">
              <div className="flex items-center gap-2 text-[#00236f] font-bold text-xs">
                <Sparkles size={14} />
                <span>Wealth Insights</span>
              </div>
              <p className="text-[11px] text-[#444651] leading-relaxed mt-1">
                Your net worth increased by 4.2% this month. Ask me for a detailed breakdown.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Center panel: conversation canvas */}
      <div className="flex-1 flex flex-col h-full bg-[#f7f9fb] relative">
        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map((msg) => {
            const isAI = msg.sender === 'ai';
            return (
              <div 
                key={msg.id} 
                className={`flex gap-4 max-w-2xl ${isAI ? 'mr-auto' : 'ml-auto flex-row-reverse'}`}
              >
                {/* Avatar circle */}
                <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center overflow-hidden border ${
                  isAI 
                    ? 'bg-[#00236f] text-white border-transparent' 
                    : 'border-[#c5c5d3]'
                }`}>
                  {isAI ? (
                    <Bot size={20} />
                  ) : (
                    <img 
                      className="w-full h-full object-cover" 
                      src={userAvatar} 
                      alt={userName}
                      referrerPolicy="no-referrer"
                    />
                  )}
                </div>

                {/* Content Bubble */}
                <div className="space-y-1.5 flex flex-col">
                  <div className={`p-4 rounded-2xl shadow-sm border ${
                    isAI 
                      ? 'bg-white border-[#e6e8ea] text-[#191c1e] rounded-tl-none' 
                      : 'bg-[#00236f] border-transparent text-white rounded-tr-none'
                  }`}>
                    <p className="text-sm leading-relaxed font-sans select-text">{msg.text}</p>

                    {/* Conditional Data viz payload */}
                    {msg.dataViz && (
                      <div className={`mt-4 p-4 rounded-xl border ${
                        isAI 
                          ? 'bg-[#f2f4f6] border-[#e6e8ea]' 
                          : 'bg-white bg-opacity-10 border-white border-opacity-10 text-white'
                      } flex flex-col gap-3 min-w-[280px]`}>
                        <div className="flex justify-between items-end">
                          <div>
                            <p className="text-[10px] uppercase font-bold tracking-wider opacity-70 mb-0.5">{msg.dataViz.label}</p>
                            <p className="text-base font-bold font-sans">{msg.dataViz.value}</p>
                          </div>
                          <span className={`text-xs font-bold ${isAI ? 'text-[#ba1a1a]' : 'text-[#6cf8bb]'}`}>
                            {msg.dataViz.change}
                          </span>
                        </div>
                        <div className="w-full bg-[#eceef0] bg-opacity-40 h-2 rounded-full overflow-hidden">
                          <div 
                            className="bg-[#00236f] h-full rounded-full" 
                            style={{ width: `${msg.dataViz.percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>
                  <span className={`text-[10px] text-[#444651] opacity-75 px-1 ${!isAI && 'self-end'}`}>
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            );
          })}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex gap-4 max-w-2xl mr-auto items-center animate-pulse">
              <div className="w-10 h-10 rounded-full bg-[#00236f] text-white flex items-center justify-center">
                <Bot size={20} />
              </div>
              <div className="bg-white border border-[#e6e8ea] p-4 rounded-2xl rounded-tl-none shadow-sm flex gap-1">
                <div className="w-2 h-2 bg-[#444651] rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-[#444651] rounded-full animate-bounce delay-75"></div>
                <div className="w-2 h-2 bg-[#444651] rounded-full animate-bounce delay-150"></div>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Input trigger console */}
        <div className="p-6 bg-white border-t border-[#e6e8ea]">
          <div className="max-w-4xl mx-auto relative group">
            <div className="flex items-end gap-2 bg-[#f2f4f6] border border-[#e6e8ea] rounded-2xl p-2.5 focus-within:ring-2 focus-within:ring-[#00236f] focus-within:bg-white focus-within:border-[#00236f] transition-all">
              <button 
                onClick={() => alert('Injected receipt file upload simulation...')}
                className="p-1.5 text-[#444651] hover:text-[#00236f] transition-colors"
                title="Attach sheet/receipt"
              >
                <Paperclip size={18} />
              </button>
              
              <textarea 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend(input);
                  }
                }}
                className="flex-1 bg-transparent border-none outline-none py-1.5 px-2 text-sm text-[#191c1e] placeholder-[#444651] placeholder-opacity-60 resize-none h-10 focus:ring-0"
                placeholder="Type your financial question..."
              ></textarea>

              <button 
                onClick={() => handleSend(input)}
                className="p-2.5 bg-[#00236f] text-white rounded-xl hover:shadow-md active:scale-95 transition-all flex items-center justify-center"
              >
                <Send size={16} />
              </button>
            </div>

            {/* Quick Chips matching custom tags */}
            <div className="flex flex-wrap gap-2.5 mt-3.5 px-1">
              {suggestionChips.map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(chip.replace(/"/g, ''))}
                  className="text-[11px] font-semibold text-[#444651] hover:text-[#00236f] hover:border-[#00236f] transition-all border border-[#c5c5d3] px-3.5 py-1.5 rounded-full bg-white shadow-sm"
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
