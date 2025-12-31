
import React, { useState, useMemo, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI } from "@google/genai";
import { 
  Plus, 
  Trash2, 
  ShoppingBag, 
  Tag, 
  Calculator, 
  Coins, 
  RotateCcw, 
  Wifi, 
  WifiOff, 
  ChevronDown, 
  Calendar,
  History as HistoryIcon,
  Sparkles,
  Zap,
  Loader2,
  TrendingUp,
  AlertCircle,
  ArrowUpRight
} from 'lucide-react';

interface Item {
  id: string;
  name: string;
  amount: number;
  timestamp: number;
  color: string;
  textVariant: string;
}

interface AIInsight {
  topExpense: string;
  frequentItems: string;
  savingsTip: string;
  summary: string;
}

const COLORS = [
  { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-100' },
  { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100' },
  { bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-100' },
  { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100' },
  { bg: 'bg-sky-50', text: 'text-sky-600', border: 'border-sky-100' },
  { bg: 'bg-violet-50', text: 'text-violet-600', border: 'border-violet-100' },
];

const STORAGE_KEY = 'shope_yako_v3_data';

const ShopeYako = () => {
  const [items, setItems] = useState<Item[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  });
  
  const [itemName, setItemName] = useState('');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiInsight, setAiInsight] = useState<AIInsight | null>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const totalBalance = useMemo(() => {
    return items.reduce((acc, curr) => acc + curr.amount, 0);
  }, [items]);

  const groupedItems = useMemo(() => {
    const groups: Record<string, Item[]> = {};
    items.forEach(item => {
      const date = new Date(item.timestamp).toLocaleDateString('en-KE', {
        weekday: 'long',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
      if (!groups[date]) groups[date] = [];
      groups[date].push(item);
    });
    return Object.entries(groups).sort((a, b) => {
      const timeA = groups[a[0]][0].timestamp;
      const timeB = groups[b[0]][0].timestamp;
      return timeB - timeA;
    });
  }, [items]);

  const runAIAnalysis = async () => {
    if (items.length === 0) return;
    setIsAnalyzing(true);
    setAiInsight(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Analyze this shopping history and provide a summary in JSON format with fields: topExpense (string), frequentItems (string), savingsTip (string), summary (string). 
      History: ${items.map(i => `${i.name} costing ${i.amount}`).join(', ')}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });

      const result = JSON.parse(response.text || '{}');
      setAiInsight(result);
    } catch (err) {
      console.error("AI Analysis failed", err);
      setError("AI Analysis failed. Check connection.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!itemName.trim()) {
      setError('What did you buy?');
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Enter a valid price');
      return;
    }

    const colorScheme = COLORS[Math.floor(Math.random() * COLORS.length)];
    const newItem: Item = {
      id: crypto.randomUUID(),
      name: itemName.trim(),
      amount: numAmount,
      timestamp: Date.now(),
      color: colorScheme.bg,
      textVariant: colorScheme.text
    };

    setItems([newItem, ...items]);
    setItemName('');
    setAmount('');
    
    const today = new Date().toLocaleDateString('en-KE', {
      weekday: 'long',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
    setExpandedDates(prev => new Set(prev).add(today));
  };

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const clearAll = () => {
    if (items.length === 0) return;
    if (window.confirm('Delete all shopping data?')) {
      setItems([]);
      setAiInsight(null);
      setExpandedDates(new Set());
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 pb-28">
      {/* Signature Header Patch */}
      <header className="bg-gradient-to-br from-indigo-700 via-indigo-600 to-violet-700 text-white pt-10 pb-16 px-6 shadow-2xl sticky top-0 z-30 rounded-b-[3rem]">
        <div className="max-w-md mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="bg-white/15 backdrop-blur-xl p-3.5 rounded-2xl border border-white/20 shadow-lg">
              <ShoppingBag size={28} className="text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight leading-none mb-1.5">Shope Yako</h1>
              <div className="flex items-center gap-2">
                <span className="text-white/60 text-[10px] font-bold uppercase tracking-widest">Keep track of your shopping</span>
                <div className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-400' : 'bg-amber-400'} shadow-[0_0_10px_rgba(52,211,153,0.5)]`}></div>
              </div>
            </div>
          </div>
          <button 
            onClick={clearAll}
            className="p-3 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-2xl transition-all border border-white/10 active:scale-90"
          >
            <RotateCcw size={20} className="text-white/80" />
          </button>
        </div>
      </header>

      <main className="max-w-md mx-auto px-5 -mt-10 relative z-40">
        {/* Wallet Dashboard */}
        <section className="bg-white rounded-[2.5rem] p-8 shadow-[0_15px_40px_-15px_rgba(0,0,0,0.1)] mb-8 border border-slate-100 flex flex-col items-center relative overflow-hidden group">
          <div className="absolute -right-10 -top-10 text-slate-50 group-hover:text-indigo-50/50 group-hover:scale-110 transition-all duration-1000">
            <TrendingUp size={180} strokeWidth={1} />
          </div>
          
          <div className="relative z-10 w-full">
            <div className="flex justify-between items-start w-full mb-6">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Current Outflow</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-bold text-slate-300">KES</span>
                  <h2 className="text-5xl font-black text-slate-900 tracking-tighter leading-none">
                    {totalBalance.toLocaleString()}
                  </h2>
                </div>
              </div>
              <div className="bg-indigo-50 p-3 rounded-2xl text-indigo-600">
                <Calculator size={24} />
              </div>
            </div>
            
            <button
              onClick={runAIAnalysis}
              disabled={isAnalyzing || items.length === 0}
              className="w-full flex items-center justify-center gap-3 bg-slate-900 hover:bg-slate-800 text-white py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.15em] shadow-xl transition-all active:scale-[0.98] disabled:opacity-50 disabled:bg-slate-400 group/ai"
            >
              {isAnalyzing ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Sparkles size={16} className="text-amber-400 group-hover/ai:rotate-12 transition-transform" />
              )}
              {isAnalyzing ? 'Processing History...' : 'Generate AI Insights'}
            </button>
          </div>
        </section>

        {/* AI Insight Card */}
        {aiInsight && (
          <section className="bg-slate-900 rounded-[2.5rem] p-7 text-white mb-8 shadow-2xl animate-in fade-in slide-in-from-bottom-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-10">
              <Zap size={64} className="animate-pulse" />
            </div>
            
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center">
                <Sparkles size={14} className="text-indigo-400" />
              </div>
              <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-indigo-300">AI Intelligence Report</h3>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-white/5 rounded-[1.5rem] p-4 border border-white/5">
                <p className="text-[9px] text-white/40 font-black uppercase mb-1">Top Expense</p>
                <p className="text-sm font-bold text-white leading-tight truncate">{aiInsight.topExpense}</p>
              </div>
              <div className="bg-white/5 rounded-[1.5rem] p-4 border border-white/5">
                <p className="text-[9px] text-white/40 font-black uppercase mb-1">Frequent</p>
                <p className="text-sm font-bold text-white leading-tight truncate">{aiInsight.frequentItems}</p>
              </div>
            </div>

            <div className="bg-indigo-500/10 rounded-[1.5rem] p-5 border border-indigo-500/20 mb-4">
              <p className="text-[9px] text-indigo-300 font-black uppercase mb-2">Shopping Behavior</p>
              <p className="text-xs leading-relaxed text-slate-300 font-medium italic">"{aiInsight.summary}"</p>
            </div>

            <div className="flex items-start gap-3 px-1">
              <div className="mt-1 bg-emerald-500/20 p-1.5 rounded-lg">
                <AlertCircle size={14} className="text-emerald-400" />
              </div>
              <p className="text-xs font-bold text-emerald-400/90 leading-tight pt-1">
                {aiInsight.savingsTip}
              </p>
            </div>
          </section>
        )}

        {/* Purchase Recorder */}
        <section className="bg-white rounded-[2.5rem] p-7 shadow-sm border border-slate-100 mb-8">
          <form onSubmit={handleAddItem} className="space-y-6">
            <div className="space-y-4">
              <div className="relative">
                <label className="text-[10px] font-black text-slate-400 ml-1 mb-2 block uppercase tracking-widest">Description</label>
                <div className="flex items-center bg-slate-50 rounded-2xl px-4 focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-100 transition-all border border-transparent focus-within:border-indigo-200">
                  <Tag size={18} className="text-slate-300 mr-3" />
                  <input
                    type="text"
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                    placeholder="E.g. Groceries"
                    className="w-full bg-transparent py-4 outline-none text-slate-700 font-bold placeholder:text-slate-300 placeholder:font-medium"
                  />
                </div>
              </div>
              
              <div className="relative">
                <label className="text-[10px] font-black text-slate-400 ml-1 mb-2 block uppercase tracking-widest">Price Tag (KES)</label>
                <div className="flex items-center bg-slate-50 rounded-2xl px-4 focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-100 transition-all border border-transparent focus-within:border-indigo-200">
                  <Coins size={18} className="text-slate-300 mr-3" />
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-transparent py-4 outline-none text-slate-700 font-black placeholder:text-slate-300"
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-rose-500 px-2 animate-bounce">
                <AlertCircle size={14} />
                <p className="text-[10px] font-black uppercase">{error}</p>
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-5 rounded-[1.5rem] shadow-lg shadow-indigo-100 transition-all flex items-center justify-center gap-3 active:scale-[0.97] group"
            >
              <Plus size={22} strokeWidth={3} className="group-hover:rotate-90 transition-transform" />
              <span className="text-[13px] uppercase tracking-wider">Commit Record</span>
            </button>
          </form>
        </section>

        {/* Transaction History */}
        <div className="space-y-5">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-slate-200 rounded-lg flex items-center justify-center">
                <HistoryIcon size={12} className="text-slate-500" />
              </div>
              <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Transaction Logs</h2>
            </div>
            <p className="text-[10px] font-bold text-slate-300 uppercase">{items.length} total entries</p>
          </div>

          {groupedItems.length === 0 ? (
            <div className="text-center py-24 bg-white/50 rounded-[2.5rem] border-2 border-dashed border-slate-200">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                <Calendar size={32} />
              </div>
              <p className="text-slate-400 font-black text-xs uppercase tracking-widest">Logs Empty</p>
              <p className="text-slate-300 text-[10px] mt-1 font-bold">Waiting for your first purchase</p>
            </div>
          ) : (
            <div className="space-y-4">
              {groupedItems.map(([date, dayItems]) => {
                const isExpanded = expandedDates.has(date);
                const dayTotal = dayItems.reduce((s, i) => s + i.amount, 0);
                
                return (
                  <div key={date} className={`bg-white rounded-[2rem] shadow-sm border border-slate-100 transition-all overflow-hidden ${isExpanded ? 'ring-2 ring-indigo-50 ring-offset-2' : ''}`}>
                    <button 
                      onClick={() => {
                        const next = new Set(expandedDates);
                        if (next.has(date)) next.delete(date); else next.add(date);
                        setExpandedDates(next);
                      }}
                      className={`w-full p-6 flex items-center justify-between transition-colors ${isExpanded ? 'bg-slate-50/50' : ''}`}
                    >
                      <div className="text-left">
                        <h3 className="text-[13px] font-black text-slate-800 tracking-tight mb-1">{date}</h3>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black text-indigo-500 uppercase">KES {dayTotal.toLocaleString()}</span>
                          <div className="w-1 h-1 rounded-full bg-slate-200"></div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase">{dayItems.length} items</span>
                        </div>
                      </div>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${isExpanded ? 'bg-indigo-600 text-white rotate-180' : 'bg-slate-50 text-slate-400'}`}>
                        <ChevronDown size={16} strokeWidth={3} />
                      </div>
                    </button>
                    
                    {isExpanded && (
                      <div className="px-5 pb-5 pt-1 space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                        {dayItems.map(item => (
                          <div key={item.id} className="flex items-center justify-between bg-slate-50/80 hover:bg-slate-50 p-3.5 rounded-2xl transition-all group/item">
                            <div className="flex items-center gap-4">
                              <div className={`w-10 h-10 ${item.color} ${item.textVariant} rounded-xl flex items-center justify-center font-black text-xs shadow-sm border border-white`}>
                                {item.name.charAt(0).toUpperCase()}
                              </div>
                              <div className="max-w-[140px]">
                                <h4 className="font-bold text-slate-700 text-sm truncate">{item.name}</h4>
                                <p className="text-[9px] text-slate-400 font-bold uppercase">{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="font-black text-slate-900 text-[13px] tracking-tight">{item.amount.toLocaleString()}</span>
                              <button 
                                onClick={() => removeItem(item.id)} 
                                className="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Modern Status Footer */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-2xl border-t border-slate-100 py-6 flex flex-col items-center justify-center z-50">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></div>
          <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.4em]">Assistant v3.0 Core</p>
        </div>
        <p className="text-[8px] text-slate-300 font-bold uppercase tracking-widest">Powered by Gemini AI Intelligence</p>
      </footer>
    </div>
  );
};

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<ShopeYako />);
}
