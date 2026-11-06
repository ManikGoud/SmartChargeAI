import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  X, 
  Send, 
  Maximize2, 
  Sparkles, 
  Zap, 
  Car, 
  CornerDownLeft,
  ChevronUp
} from 'lucide-react';
import { useVehicle } from '../context/VehicleContext';
import { sendChatMessage } from '../services/api';

export function FloatingAIAssist({ setCurrentPage }) {
  const [isOpen, setIsOpen] = useState(false);
  const { activeVehicle, currentSoC } = useVehicle();
  const [messages, setMessages] = useState([
    {
      id: 'init-1',
      sender: 'assistant',
      text: `Hi! I am **SmartChargeAI Assist**. I am synchronized with your **${activeVehicle.make} ${activeVehicle.model}** (${currentSoC}% SoC). How can I assist your charging decisions?`,
      timestamp: 'Now'
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const quickPrompts = [
    "Cheapest compatible charger near me",
    "Calculate cost 20% to 80%",
    "Plan trip from Hyderabad to Warangal",
    "Best station for my EV"
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen, loading]);

  const handleSendMessage = async (customText = null) => {
    const text = customText || inputText;
    if (!text.trim() || loading) return;

    const userMsg = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!customText) setInputText('');
    setLoading(true);

    try {
      const payload = {
        message: text,
        vehicle_id: activeVehicle?.id,
        current_soc: Number(currentSoC),
        user_lat: 17.4450,
        user_lng: 78.3820
      };

      const res = await sendChatMessage(payload);
      if (res.success && res.data) {
        setMessages(prev => [
          ...prev,
          {
            id: `ai-${Date.now()}`,
            sender: 'assistant',
            text: res.data.reply,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      } else {
        setMessages(prev => [
          ...prev,
          {
            id: `ai-err-${Date.now()}`,
            sender: 'assistant',
            text: res.error || "I'm having trouble connecting to the charging intelligence network right now.",
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      }
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          id: `ai-err-${Date.now()}`,
          sender: 'assistant',
          text: "Offline mode active. Check backend server.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 select-none">
      {/* Floating Trigger Button (when drawer is closed) */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group flex items-center space-x-2.5 px-4 py-2.5 rounded-full bg-[#0B0B0E] border border-white/20 text-white shadow-2xl hover:border-white/50 transition-all backdrop-blur-md"
          title="Open SmartChargeAI Floating Assistant"
        >
          <div className="relative flex items-center">
            <span className="w-1.5 h-1.5 rounded-full bg-white absolute -top-0.5 -right-0.5 shadow-[0_0_6px_rgba(255,255,255,0.8)]"></span>
            <Bot className="w-4 h-4 text-white" />
          </div>
          <span className="text-xs font-mono font-bold tracking-wider hidden sm:inline text-zinc-200 group-hover:text-white transition-colors">
            AI CONCIERGE
          </span>
        </button>
      )}

      {/* Expanded Floating Chat Panel */}
      {isOpen && (
        <div className="w-[340px] sm:w-[400px] h-[520px] rounded-2xl bg-[#09090C] border border-white/15 shadow-2xl flex flex-col overflow-hidden backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="p-4 border-b border-white/10 flex items-center justify-between bg-[#0B0B0E]">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#141418] border border-white/15 flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="text-xs font-mono font-bold text-white flex items-center space-x-1.5">
                  <span>SmartCharge</span>
                  <span className="text-zinc-400">AI</span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-white/10 text-white border border-white/15">LIVE</span>
                </div>
                <div className="text-[10px] font-mono text-zinc-400 truncate max-w-[170px]">
                  {activeVehicle.make} {activeVehicle.model} • {currentSoC}%
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-1">
              <button
                onClick={() => {
                  setIsOpen(false);
                  if (setCurrentPage) setCurrentPage('assistant');
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                title="Expand to Full AI Assistant Page"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                title="Close Assistant"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 font-sans text-xs">
            {messages.map((m) => {
              const isUser = m.sender === 'user';
              return (
                <div
                  key={m.id}
                  className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl p-3 leading-relaxed whitespace-pre-wrap ${
                      isUser
                        ? 'bg-white text-[#050507] font-semibold rounded-br-none shadow-[0_0_12px_rgba(255,255,255,0.15)]'
                        : 'bg-[#121216] text-zinc-200 border border-white/10 rounded-bl-none font-mono text-[11px]'
                    }`}
                  >
                    {m.text}
                    <div
                      className={`text-[9px] mt-1 font-mono ${
                        isUser ? 'text-zinc-500 text-right' : 'text-zinc-500'
                      }`}
                    >
                      {m.timestamp}
                    </div>
                  </div>
                </div>
              );
            })}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-[#121216] border border-white/10 rounded-2xl p-3 text-[11px] font-mono text-white flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
                  <span>Evaluating charging intelligence...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestions Chips */}
          <div className="px-3 py-1.5 border-t border-white/5 bg-black/50 overflow-x-auto flex items-center space-x-1.5 scrollbar-none">
            {quickPrompts.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(prompt)}
                className="shrink-0 px-2.5 py-1 rounded-lg bg-[#121216] hover:bg-white/10 hover:border-white/30 hover:text-white border border-white/10 text-[10px] font-mono text-zinc-300 transition-all"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Input Footer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 border-t border-white/10 bg-[#0B0B0E] flex items-center space-x-2"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask charging assistant..."
              className="flex-1 bg-black/70 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white font-mono"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || loading}
              className="p-2 rounded-lg bg-white text-black disabled:opacity-30 hover:bg-zinc-200 transition-all shadow-md shrink-0 font-bold"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

