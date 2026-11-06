import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  Send,
  User,
  Sparkles,
  Compass,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import { useVehicle } from '../context/VehicleContext';
import { useStations } from '../context/StationContext';
import { sendChatMessage } from '../services/api';
import { DemoDataBadge } from '../components/Badge';
import { StationDetailModal } from '../components/StationDetailModal';
import { NavigationModal } from '../components/NavigationModal';
import { AIStationRecommendationCard } from '../components/AIStationRecommendationCard';

/**
 * AssistantPage
 * SmartChargeAI EV Charging Assistant
 * Connected to live database station records, vehicle compatibility limits,
 * and local Ollama AI intelligence.
 * Strictly formatted in Black & White Monochrome Automotive Digital Cockpit theme.
 *
 * @param {{
 *   setCurrentPage?: (page: string) => void;
 * }} props
 */
export function AssistantPage({ setCurrentPage }) {
  const { activeVehicle, currentSoC } = useVehicle();
  const { setSelectedStation, userLocation } = useStations();
  const messagesEndRef = useRef(null);

  // Modal inspection & live navigation states (single declaration)
  const [modalStation, setModalStation] = useState(null);
  const [navigatingStation, setNavigatingStation] = useState(null);

  const initialWelcomeText = activeVehicle
    ? `Hello! I am SmartChargeAI, your EV charging intelligence assistant. I am synchronized with your active vehicle: ${activeVehicle.make} ${activeVehicle.model} (${activeVehicle.batteryCapacity} kWh pack, max DC charging speed ${activeVehicle.maxChargingSpeed || activeVehicle.max_dc_power || 150} kW, currently at ${currentSoC}% SoC).\n\nAsk me about nearest stations, cheapest tariffs, high-speed DC chargers, or available CCS2 plugs across Hyderabad!`
    : `Hello! I am SmartChargeAI, your EV charging intelligence assistant.\n\nAsk me about nearest stations, cheapest tariffs, high-speed DC chargers, or available CCS2 plugs across Hyderabad!`;

  const [messages, setMessages] = useState([
    {
      id: 'msg-welcome',
      sender: 'assistant',
      text: initialWelcomeText,
      timestamp: 'Just now',
      provider: 'Local Ollama AI & Grounded Database Telemetry',
      intent: 'WELCOME'
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const quickPrompts = [
    "Find nearest charging stations",
    "Find the cheapest compatible charger near me",
    "Show available CCS2 chargers",
    "Find a fast DC charger (>150kW)",
    "Which station is best for my EV?",
    "Plan a trip from Hyderabad to Warangal"
  ];

  const handleSendMessage = async (textToSend = null) => {
    const text = textToSend || inputText;
    if (!text.trim() || loading) return;

    const userTimestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: text,
      timestamp: userTimestamp,
      provider: 'user',
      intent: 'USER_INPUT'
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputText('');
    setLoading(true);

    const payload = {
      message: text,
      vehicle_id: activeVehicle?.id,
      current_soc: Number(currentSoC),
      user_lat: userLocation?.lat || 17.4450,
      user_lng: userLocation?.lng || 78.3820
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
      setMessages((prev) => [...prev, assistantMsg]);
    } else {
      const errorMsg = {
        id: `err-${Date.now()}`,
        sender: 'assistant',
        text: "I encountered an issue connecting to the charging intelligence service. Please verify your FastAPI backend connection.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        provider: 'System Error Fallback',
        intent: 'ERROR'
      };
      setMessages((prev) => [...prev, errorMsg]);
    }

    setLoading(false);
  };

  const handleResetConversation = () => {
    setMessages([
      {
        id: 'msg-welcome',
        sender: 'assistant',
        text: initialWelcomeText,
        timestamp: 'Just now',
        provider: 'Local Ollama AI & Grounded Database Telemetry',
        intent: 'WELCOME'
      }
    ]);
  };

  const handleViewStationOnMap = (st) => {
    if (setSelectedStation) {
      setSelectedStation(st);
    }
    if (setCurrentPage) {
      setCurrentPage('discovery');
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 h-[calc(100vh-140px)] flex flex-col justify-between">
      {/* Header Bar */}
      <div className="flex items-center justify-between pb-4 border-b border-white/[0.12]">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-[#121216] border border-white/20 flex items-center justify-center text-white shadow-md">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-bold text-white tracking-tight">SmartChargeAI Assistant</h2>
              <DemoDataBadge />
            </div>
            <p className="text-xs text-zinc-400 font-mono">
              Local Ollama & SQLite Grounded Engine • Active Vehicle: <strong className="text-white">{activeVehicle ? `${activeVehicle.make} ${activeVehicle.model}` : 'Generic EV'}</strong> ({currentSoC}% SoC)
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleResetConversation}
          className="p-2 rounded-xl bg-[#121216] text-zinc-400 hover:text-white border border-white/10 hover:border-white/20 text-xs font-mono flex items-center space-x-1.5 transition-colors"
          title="Reset conversation"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Reset Chat</span>
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto py-6 space-y-6 pr-2">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start space-x-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {
              msg.sender === 'assistant' && (
                <div className="w-8 h-8 rounded-xl bg-[#121216] border border-white/20 flex items-center justify-center text-white shrink-0 mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
              )}

            <div
              className={`max-w-2xl rounded-2xl p-4 sm:p-5 space-y-3 ${msg.sender === 'user'
                ? 'bg-white text-[#050507] rounded-tr-sm shadow-md font-sans'
                : 'bg-[#0B0B0E] border border-white/[0.12] text-zinc-200 rounded-tl-sm shadow-xl'
                }`}
            >
              {/* Provider attribution banner on assistant responses */}
              {
                msg.sender === 'assistant' && msg.provider && (
                  <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 pb-2 border-b border-white/[0.08]">
                    <span className="text-zinc-300 font-bold flex items-center space-x-1.5">
                      <Sparkles className="w-3 h-3 inline text-white" />
                      <span>{msg.provider}</span>
                    </span>
                    <span>{msg.timestamp}</span>
                  </div>
                )}

              {/* Message Content with simple Markdown rendering */}
              <div className={`text-sm leading-relaxed whitespace-pre-line ${msg.sender === 'user' ? 'text-[#050507] font-medium' : 'font-sans'}`}>
                {
                  msg.text.split('\n').map((line, idx) => {
                    if (line.startsWith('• ')) {
                      return (
                        <div key={idx} className="flex items-start space-x-2 my-1">
                          <span className={msg.sender === 'user' ? 'text-black font-bold' : 'text-white font-bold'}>•</span>
                          <span>{line.replace('• ', '')}</span>
                        </div>
                      );
                    }
                    return (
                      <p key={idx} className="mb-1">{line}</p>
                    );
                  })}
              </div>

              {/* Verified Station Recommendation Cards */}
              {Boolean(msg.structured_data?.stations && msg.structured_data.stations.length > 0) && (
                <div className="pt-3 border-t border-white/[0.12] space-y-3">
                  <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 uppercase tracking-wider">
                    <span>Verified Recommendations ({msg.structured_data.stations.length})</span>
                    <span className="text-zinc-300 flex items-center space-x-1">
                      <ShieldCheck className="w-3.5 h-3.5 inline text-white" />
                      <span>Live Grounded</span>
                    </span>
                  </div>
                  <div className="space-y-3">
                    {msg.structured_data.stations.map((st) => (
                      <AIStationRecommendationCard
                        key={st.id}
                        station={st}
                        activeVehicle={activeVehicle}
                        onViewDetails={(station) => setModalStation(station)}
                        onNavigate={(station) => setNavigatingStation(station)}
                        onViewMap={handleViewStationOnMap}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Trip Planner Deep-link Shortcut */}
              {
                msg.intent === 'TRIP_PLAN' && setCurrentPage && (
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => setCurrentPage('trips')}
                      className="px-4 py-2.5 rounded-xl bg-white text-[#050507] font-mono text-xs font-bold uppercase hover:bg-zinc-200 transition-all flex items-center space-x-2 shadow-md"
                    >
                      <Compass className="w-4 h-4 fill-[#050507]" />
                      <span>Open Interactive Route in Trip Planner →</span>
                    </button>
                  </div>
                )}
            </div>

            {
              msg.sender === 'user' && (
                <div className="w-8 h-8 rounded-xl bg-white text-[#050507] flex items-center justify-center shrink-0 mt-0.5 shadow-md font-bold">
                  <User className="w-4 h-4" />
                </div>
              )}
          </div>
        ))}

        {/* Loading Indicator */}
        {loading && (
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-xl bg-[#121216] border border-white/20 flex items-center justify-center text-white shrink-0 animate-pulse">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-[#0B0B0E] px-4 py-3 rounded-2xl border border-white/[0.12] text-xs font-mono text-white flex items-center space-x-2.5 shadow-lg">
              <span className="w-2 h-2 rounded-full bg-white animate-ping" />
              <span>Querying local Ollama AI & verified station telemetry...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Suggestions Chips */}
      < div className="py-2.5 border-t border-white/[0.08] overflow-x-auto" >
        <div className="flex items-center space-x-2 text-xs font-mono">
          <span className="text-zinc-500 text-[10px] uppercase shrink-0">Prompts:</span>
          {quickPrompts.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSendMessage(p)}
              disabled={loading}
              className="px-3 py-1.5 rounded-lg bg-[#0B0B0E] border border-white/10 hover:border-white/30 text-zinc-300 hover:text-white transition-colors shrink-0 text-xs"
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
        className="relative flex items-center p-2 rounded-2xl bg-[#0B0B0E] border border-white/15 shadow-2xl backdrop-blur-xl group focus-within:border-white/40 transition-colors"
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Ask charging assistant (e.g. Nearest stations, Cheapest charger, Fast DC)..."
          className="w-full bg-transparent px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none font-mono"
        />
        <button
          type="submit"
          disabled={!inputText.trim() || loading}
          className="shrink-0 p-2.5 rounded-xl bg-white text-[#050507] font-bold hover:bg-zinc-200 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-md"
        >
          <Send className="w-4 h-4 fill-[#050507]" />
        </button>
      </form>

      {/* Station Details Modal */}
      {modalStation && (
        <StationDetailModal
          station={modalStation}
          onClose={() => setModalStation(null)}
          onOpenCalculator={() => { }}
          onNavigate={(s) => {
            setModalStation(null);
            setNavigatingStation(s);
          }}
        />
      )}

      {/* In-App Live OSRM Navigation Modal */}
      {navigatingStation && (
        <NavigationModal
          station={navigatingStation}
          onClose={() => setNavigatingStation(null)}
        />
      )}
    </div>
  );
}
