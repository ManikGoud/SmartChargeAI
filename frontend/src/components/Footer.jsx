import React from 'react';
import { Zap, ShieldCheck, Cpu, Database, MapPin, ExternalLink } from 'lucide-react';

export function Footer({ setCurrentPage }) {
  return (
    <footer className="border-t border-white/5 bg-dark-950 text-slate-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Col 1: Brand & Project Info */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-cyan to-brand-blue flex items-center justify-center">
                <Zap className="w-4 h-4 text-dark-950 fill-dark-950" />
              </div>
              <span className="text-base font-bold text-white tracking-tight">
                SmartCharge<span className="text-brand-cyan">AI</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              An intelligent EV charging ecosystem delivering machine-learning station discovery, dynamic route planning, and real-time charging cost intelligence.
            </p>
            <div className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded text-[10px] font-mono bg-white/5 border border-white/10 text-slate-300">
              <ShieldCheck className="w-3 h-3 text-brand-cyan" />
              <span>Final Year Major Project • CSE (AI & ML)</span>
            </div>
          </div>

          {/* Col 2: Navigation Links */}
          <div>
            <h4 className="text-slate-200 font-semibold mb-3 tracking-wider text-xs uppercase font-mono">
              Platform Modules
            </h4>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => setCurrentPage('discovery')}
                  className="hover:text-brand-cyan transition-colors"
                >
                  Charging Station Discovery
                </button>
              </li>
              <li>
                <button
                  onClick={() => setCurrentPage('trips')}
                  className="hover:text-brand-cyan transition-colors flex items-center space-x-1"
                >
                  <span>Intelligent Trip Planner</span>
                  <span className="text-[9px] px-1 py-0.2 rounded bg-brand-cyan/20 text-brand-cyan font-mono">AI</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => setCurrentPage('comparison')}
                  className="hover:text-brand-cyan transition-colors"
                >
                  Cost & Speed Comparison
                </button>
              </li>
              <li>
                <button
                  onClick={() => setCurrentPage('assistant')}
                  className="hover:text-brand-cyan transition-colors flex items-center space-x-1"
                >
                  <span>AI Assistant (RAG Grounded)</span>
                  <span className="text-[9px] px-1 py-0.2 rounded bg-purple-500/20 text-purple-400 font-mono">NEW</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => setCurrentPage('garage')}
                  className="hover:text-brand-cyan transition-colors"
                >
                  EV Vehicle Garage & Compatibility
                </button>
              </li>
              <li>
                <button
                  onClick={() => setCurrentPage('dashboard')}
                  className="hover:text-brand-cyan transition-colors"
                >
                  Viewer Dashboard
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Tech Stack */}
          <div>
            <h4 className="text-slate-200 font-semibold mb-3 tracking-wider text-xs uppercase font-mono">
              System Architecture
            </h4>
            <div className="flex flex-wrap gap-1.5 text-[11px] font-mono">
              <span className="px-2 py-0.5 rounded bg-dark-900 border border-white/5 text-slate-300">FastAPI</span>
              <span className="px-2 py-0.5 rounded bg-dark-900 border border-white/5 text-slate-300">React 18</span>
              <span className="px-2 py-0.5 rounded bg-dark-900 border border-white/5 text-slate-300">Tailwind CSS</span>
              <span className="px-2 py-0.5 rounded bg-dark-900 border border-white/5 text-slate-300">SQLite ORM</span>
              <span className="px-2 py-0.5 rounded bg-dark-900 border border-white/5 text-slate-300">Leaflet + OpenStreetMap</span>
              <span className="px-2 py-0.5 rounded bg-dark-900 border border-white/5 text-slate-300">Framer Motion</span>
              <span className="px-2 py-0.5 rounded bg-dark-900 border border-white/5 text-brand-cyan">AI Recommendation</span>
            </div>
          </div>

          {/* Col 4: Academic & Demo Disclaimer */}
          <div className="space-y-2">
            <h4 className="text-slate-200 font-semibold tracking-wider text-xs uppercase font-mono">
              Demo Data Notice
            </h4>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Charging station availability, waiting queues, and charging sessions are simulated demo fixtures for demonstration and academic evaluation. Real network integration requires authenticated charging CPO APIs.
            </p>
            <div className="text-[10px] text-slate-500 font-mono pt-1">
              API Base: <code className="text-slate-400">http://127.0.0.1:8000</code>
            </div>
          </div>
        </div>

        <div className="border-t border-white/5 pt-6 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500">
          <div>© 2026 SmartChargeAI. Academic Major Project CSE (AI & ML).</div>
          <div className="flex items-center space-x-4 mt-2 sm:mt-0 font-mono">
            <span className="text-emerald-400">● Systems Nominal</span>
            <span>Version 2.0.0-PROD</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

