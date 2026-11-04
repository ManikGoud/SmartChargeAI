import React, { useState } from 'react';
import { 
  Zap, 
  MapPin, 
  Car, 
  LayoutDashboard, 
  Menu, 
  X, 
  BatteryCharging,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Compass,
  DollarSign,
  Bot
} from 'lucide-react';
import { useVehicle } from '../context/VehicleContext';

export function Navbar({ currentPage, setCurrentPage, backendOnline }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [batteryDropdownOpen, setBatteryDropdownOpen] = useState(false);
  const { activeVehicle, currentSoC, updateSoC, usableRangeKm } = useVehicle();

  const navLinks = [
    { id: 'home', label: 'Home', icon: Zap },
    { id: 'discovery', label: 'Stations', icon: MapPin },
    { id: 'trips', label: 'Trip Planner', icon: Compass },
    { id: 'comparison', label: 'Cost Compare', icon: DollarSign },
    { id: 'assistant', label: 'AI Assistant', icon: Bot },
    { id: 'garage', label: 'Garage', icon: Car },
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  ];

  const getBatteryColor = (soc) => {
    if (soc > 50) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    if (soc > 25) return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
    return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/5 bg-dark-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div 
          onClick={() => setCurrentPage('home')}
          className="flex items-center space-x-3 cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-cyan to-brand-blue flex items-center justify-center shadow-cyan-glow group-hover:scale-105 transition-transform">
            <Zap className="w-5 h-5 text-dark-950 fill-dark-950" />
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight text-white group-hover:text-brand-cyan transition-colors">
              SmartCharge<span className="text-brand-cyan">AI</span>
            </span>
            <span className="hidden sm:inline-block ml-2 text-[10px] font-mono tracking-widest uppercase text-slate-400 border border-white/10 px-1.5 py-0.5 rounded">
              EV ASSISTANT
            </span>
          </div>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center space-x-1">
          {navLinks.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentPage(item.id)}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${
                  isActive 
                    ? 'bg-brand-cyan/10 text-brand-cyan border border-brand-cyan/20 shadow-[0_0_15px_rgba(0,240,255,0.1)]' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-brand-cyan' : 'text-slate-500'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Section: Active Vehicle Widget & Status */}
        <div className="hidden lg:flex items-center space-x-3">
          {/* Active Vehicle Pill */}
          <div className="relative">
            <button
              onClick={() => setBatteryDropdownOpen(!batteryDropdownOpen)}
              className="flex items-center space-x-2.5 px-3 py-1.5 rounded-xl bg-dark-900 border border-white/10 hover:border-brand-cyan/30 transition-all text-xs"
              title="Click to adjust vehicle battery state of charge"
            >
              <Car className="w-3.5 h-3.5 text-brand-cyan" />
              <span className="font-semibold text-slate-200 max-w-[120px] truncate">
                {activeVehicle.make} {activeVehicle.model}
              </span>
              <span className={`px-2 py-0.5 rounded-md font-mono font-bold border ${getBatteryColor(currentSoC)}`}>
                {currentSoC}%
              </span>
              <span className="text-slate-400 font-mono">
                ~{usableRangeKm} km
              </span>
            </button>

            {/* Quick SoC Adjustment Drawer/Dropdown */}
            {batteryDropdownOpen && (
              <div className="absolute right-0 mt-2 w-72 p-4 rounded-2xl glass-panel-glow shadow-2xl z-50 border border-brand-cyan/30 animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/10">
                  <span className="text-xs font-semibold text-slate-200 flex items-center space-x-1.5">
                    <BatteryCharging className="w-4 h-4 text-brand-cyan" />
                    <span>Battery State of Charge</span>
                  </span>
                  <button 
                    onClick={() => setBatteryDropdownOpen(false)}
                    className="text-slate-400 hover:text-white text-xs"
                  >
                    ✕
                  </button>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-slate-400">Current Level</span>
                    <span className="text-brand-cyan font-bold">{currentSoC}% ({((activeVehicle.batteryCapacity * currentSoC) / 100).toFixed(1)} kWh)</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="100"
                    value={currentSoC}
                    onChange={(e) => updateSoC(e.target.value)}
                    className="w-full h-2 bg-dark-800 rounded-lg appearance-none cursor-pointer accent-brand-cyan"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>5% (Critical)</span>
                    <span>50%</span>
                    <span>100% (Full)</span>
                  </div>
                  <div className="pt-2 border-t border-white/5 flex justify-between items-center text-xs">
                    <span className="text-slate-400">Usable Range:</span>
                    <span className="font-mono text-emerald-400 font-semibold">{usableRangeKm} km</span>
                  </div>
                  <button
                    onClick={() => {
                      setBatteryDropdownOpen(false);
                      setCurrentPage('garage');
                    }}
                    className="w-full mt-1 py-1.5 text-xs text-center text-slate-300 hover:text-brand-cyan bg-white/5 rounded-lg border border-white/5 hover:border-brand-cyan/20 transition-colors"
                  >
                    Open Full EV Garage →
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Backend Status Dot */}
          <div 
            className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-dark-900 border border-white/5 text-[11px] font-mono text-slate-400"
            title={backendOnline ? "FastAPI Backend is online" : "Connecting to backend..."}
          >
            <span className={`w-2 h-2 rounded-full ${backendOnline ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
            <span className="hidden xl:inline">{backendOnline ? 'API Online' : 'Connecting'}</span>
          </div>
        </div>

        {/* Mobile Menu Button */}
        <div className="flex items-center md:hidden space-x-2">
          <button
            onClick={() => setCurrentPage('garage')}
            className={`px-2 py-1 rounded-md text-xs font-mono border ${getBatteryColor(currentSoC)}`}
          >
            {currentSoC}%
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg bg-white/5 text-slate-300 hover:text-white"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-white/10 bg-dark-950/95 backdrop-blur-xl px-4 pt-2 pb-4 space-y-1">
          {navLinks.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentPage(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium ${
                  isActive 
                    ? 'bg-brand-cyan/10 text-brand-cyan border border-brand-cyan/20' 
                    : 'text-slate-300 hover:bg-white/5'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
          <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
            <span>Vehicle: {activeVehicle.make} {activeVehicle.model}</span>
            <span className="font-mono text-brand-cyan font-bold">{currentSoC}% SoC</span>
          </div>
        </div>
      )}
    </header>
  );
}

