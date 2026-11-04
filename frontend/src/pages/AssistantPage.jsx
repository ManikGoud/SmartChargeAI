import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  Send, 
  User, 
  Sparkles, 
  Zap, 
  Car, 
  BatteryCharging, 
  MapPin, 
  DollarSign, 
  Compass, 
  ShieldCheck, 
  Info,
  CornerDownLeft,
  RefreshCw
} from 'lucide-react';
import { useVehicle } from '../context/VehicleContext';
import { sendChatMessage } from '../services/api';
import { Badge, DemoDataBadge } from '../components/Badge';

export function AssistantPage({ setCurrentPage }) {
  const { activeVehicle, currentSoC } = useVehicle();
  const messagesEndRef = useRef(null);

  const initialMessages = [
    {
      id: 'msg-welcome',
      sender: 'assistant',
      text: `Hello! I am **SmartChargeAI**, your EV charging intelligence assistant. I am synchronized with your active vehicle: **${activeVehicle.make} ${activeVehicle.model}** (${activeVehicle.batteryCapacity} kWh pack, currently at **${currentSoC}% SoC**).\n\nHow can I assist you with your charging decisions today?`,
      timestamp: 'Just now',
      provider: 'Rule-Based Domain Expert Engine (Offline Academic Demo)',
      intent: 'WELCOME'
    }
  ];

  const [messages, setMessages] = useState(initialMessages);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const quickPrompts = [
    "Find the cheapest compatible charger near me",
    "Which station is best for my EV?",
    "Calculate charging cost from 20% to 80%",
    "Plan a trip from Hyderabad to Warangal",
    "Find a fast DC charger (>150kW)"
  ];

  const handleSendMessage = async (textToSend = null) => {
    const text = textToSend || inputText;
    if (!text.trim() || loading) return;

    const userMsg = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInputText('');
    setLoading(true);

    const payload = {
      message: text,
      vehicle_id: activeVehicle?.id,
      current_soc: Number(currentSoC),
      user_lat: 17.4450,
      user_lng: 78.3820
    };

    const res = await sendChatMessage(payload);

    if (res.success && res.data) {
      const assistantMsg = {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        text: res.data.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        provider: res.data.provider,
        intent: res.data.intent,
        structured_data: res.data.structured_data
      };
      setMessages(prev => [...prev, assistantMsg]);
    } else {
      const errorMsg = {
        id: `err-${Date.now()}`,
        sender: 'assistant',
        text: "I encountered a communication issue connecting to the charging intelligence service. Please check your backend connection.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        provider: 'System Error Fallback',
        intent: 'ERROR'
      };
      setMessages(prev => [...prev, errorMsg]);
    }

    setLoading(false);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 h-[calc(100vh-140px)] flex flex-col justify-between">
      {/* Header Bar */}
      <div className="flex items-center justify-between pb-4 border-b border-white/5">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-cyan to-brand-blue flex items-center justify-center shadow-cyan-glow">
            <Bot className="w-5 h-5 text-dark-950 fill-dark-950" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-bold text-white">SmartChargeAI Assistant</h2>
              <DemoDataBadge />
            </div>
            <p className="text-xs text-slate-400 font-mono">
              Domain Intelligence & Telemetry RAG Engine • Target EV: <strong className="text-brand-cyan">{activeVehicle.make} {activeVehicle.model}</strong>
            </p>
          </div>
        </div>

        <button
          onClick={() => setMessages(initialMessages)}
          className="p-2 rounded-xl bg-white/5 text-slate-400 hover:text-white border border-white/5 hover:border-white/10 text-xs font-mono flex items-center space-x-1"
          title="Reset conversation"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Reset</span>
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto py-6 space-y-6 pr-2">
        {messages.map((msg) => (
          <div 
            key={msg.id}
            className={`flex items-start space-x-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.sender === 'assistant' && (
              <div className="w-8 h-8 rounded-xl bg-brand-cyan/20 border border-brand-cyan/40 flex items-center justify-center text-brand-cyan shrink-0 mt-0.5">
                <Bot className="w-4 h-4" />
              </div>
            )}

            <div className={`max-w-2xl rounded-2xl p-4 sm:p-5 space-y-2.5 ${
              msg.sender === 'user'
                ? 'bg-gradient-to-r from-brand-blue/30 to-brand-cyan/20 border border-brand-cyan/30 text-white'
                : 'glass-panel border-white/10 text-slate-200'
            }`}>
              {/* Provider attribution banner on assistant responses */}
              {msg.sender === 'assistant' && msg.provider && (
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pb-2 border-b border-white/5">
                  <span className="text-brand-cyan font-bold flex items-center space-x-1">
                    <Sparkles className="w-3 h-3 inline" />
                    <span>{msg.provider}</span>
                  </span>
                  <span>{msg.timestamp}</span>
                </div>
              )}

              {/* Message Content with simple Markdown rendering */}
              <div className="text-sm leading-relaxed whitespace-pre-line font-sans">
                {msg.text.split('\n').map((line, idx) => {
                  if (line.startsWith('• ')) {
                    return (
                      <div key={idx} className="flex items-start space-x-2 my-1">
                        <span className="text-brand-cyan font-bold">•</span>
                        <span>{line.replace('• ', '')}</span>
                      </div>
                    );
                  }
                  return <p key={idx} className="mb-1">{line}</p>;
                })}
              </div>

              {/* Interactive Deep-link Shortcuts based on intent */}
              {msg.intent === 'TRIP_PLAN' && (
                <div className="pt-2">
                  <button
                    onClick={() => setCurrentPage('trips')}
                    className="px-3 py-1.5 rounded-xl bg-brand-cyan/20 border border-brand-cyan text-brand-cyan font-mono text-xs font-bold hover:bg-brand-cyan/30 transition-all flex items-center space-x-1.5"
                  >
                    <Compass className="w-3.5 h-3.5" />
                    <span>Open Interactive Map Route in Trip Planner →</span>
                  </button>
                </div>
              )}

              {msg.intent === 'FIND_CHEAPEST' && (
                <div className="pt-2">
                  <button
                    onClick={() => setCurrentPage('discovery')}
                    className="px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500 text-emerald-400 font-mono text-xs font-bold hover:bg-emerald-500/30 transition-all flex items-center space-x-1.5"
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    <span>View Station on Map →</span>
                  </button>
                </div>
              )}
            </div>

            {msg.sender === 'user' && (
              <div className="w-8 h-8 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-slate-300 shrink-0 mt-0.5">
                <User className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}

        {/* Loading Indicator */}
        {loading && (
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-xl bg-brand-cyan/20 border border-brand-cyan/40 flex items-center justify-center text-brand-cyan shrink-0 animate-pulse">
              <Bot className="w-4 h-4" />
            </div>
            <div className="glass-panel px-4 py-3 rounded-2xl border-white/10 text-xs font-mono text-brand-cyan flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-brand-cyan animate-ping"></span>
              <span>Evaluating live charging telemetry & vehicle BMS limits...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Suggestions Chips */}
      <div className="py-2 border-t border-white/5 overflow-x-auto">
        <div className="flex items-center space-x-2 text-xs font-mono">
          <span className="text-slate-500 text-[10px] uppercase shrink-0">Suggestions:</span>
          {quickPrompts.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(p)}
              disabled={loading}
              className="px-2.5 py-1 rounded-lg bg-dark-900 border border-white/10 hover:border-brand-cyan/40 text-slate-300 hover:text-white transition-colors shrink-0 text-xs"
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Input Box */}
      <form 
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="relative flex items-center p-2 rounded-2xl bg-dark-900/90 border border-brand-cyan/30 shadow-2xl backdrop-blur-xl group focus-within:border-brand-cyan"
      >
        <input
          type="text"
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          placeholder={`Ask about charging for ${activeVehicle.make} ${activeVehicle.model} (e.g. "Find fastest charger near me")...`}
          className="w-full bg-transparent px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={!inputText.trim() || loading}
          className="shrink-0 p-2.5 rounded-xl bg-brand-cyan text-dark-950 font-bold hover:bg-brand-cyan/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}

