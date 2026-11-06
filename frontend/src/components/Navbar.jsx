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
  Bot,
  KeyRound,
  User,
  Building2,
  ShieldAlert,
  LogOut,
  ChevronDown,
  Sparkles
} from 'lucide-react';
import { useVehicle } from '../context/VehicleContext';
import { useAuth } from '../context/AuthContext';

export function Navbar({ currentPage, setCurrentPage, backendOnline }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [batteryDropdownOpen, setBatteryDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  
  const { activeVehicle, currentSoC, updateSoC, usableRangeKm } = useVehicle();
  const { user, role, openLoginModal, logout } = useAuth();

  // Dynamic Navigation Links based on role
  const getNavLinks = () => {
    const base = [
      { id: 'home', label: 'Home', icon: Zap },
      { id: 'discovery', label: 'Stations', icon: MapPin },
      { id: 'trips', label: 'Trip Planner', icon: Compass },
      { id: 'comparison', label: 'Cost Compare', icon: DollarSign },
      { id: 'assistant', label: 'AI Assistant', icon: Bot },
    ];

    if (role === 'station_owner') {
      base.push({ id: 'owner-dashboard', label: 'Owner Console', icon: Building2 });
    } else if (role === 'admin') {
      base.push({ id: 'admin-dashboard', label: 'Admin Command', icon: ShieldAlert });
      base.push({ id: 'dashboard', label: 'Customer View', icon: LayoutDashboard });
    } else {
      // Customer or Guest
      base.push({ id: 'garage', label: 'Garage', icon: Car });
      base.push({ id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard });
    }

    return base;
  };

  const navLinks = getNavLinks();

  const getBatteryColor = (soc) => {
    if (soc > 50) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    if (soc > 25) return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
    return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
  };

  const getRoleBadgeStyle = (r) => {
    switch (r) {
      case 'admin':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
      case 'station_owner':
        return 'bg-[#00FF66]/20 text-[#00FF66] border-[#00FF66]/40';
      default:
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
    }
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
                className={`flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                  isActive 
                    ? 'bg-brand-cyan/10 text-brand-cyan border border-brand-cyan/20 shadow-[0_0_15px_rgba(0,240,255,0.1)]' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-brand-cyan' : 'text-slate-500'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Section: Vehicle SoC, Auth Pill & Backend Status */}
        <div className="hidden lg:flex items-center space-x-3">
          {/* Active Vehicle Pill */}
          <div className="relative">
            <button
              onClick={() => {
                setBatteryDropdownOpen(!batteryDropdownOpen);
                setUserDropdownOpen(false);
              }}
              className="flex items-center space-x-2.5 px-3 py-1.5 rounded-xl bg-dark-900 border border-white/10 hover:border-brand-cyan/30 transition-all text-xs"
              title="Click to adjust vehicle battery state of charge"
            >
              <Car className="w-3.5 h-3.5 text-brand-cyan" />
              <span className="font-semibold text-slate-200 max-w-[110px] truncate">
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

          {/* Authentication Pill / Sign In Button */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => {
                  setUserDropdownOpen(!userDropdownOpen);
                  setBatteryDropdownOpen(false);
                }}
                className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-dark-900 border border-white/10 hover:border-white/20 transition-all text-xs"
              >
                <span className={`px-1.5 py-0.5 rounded font-mono font-bold text-[10px] border ${getRoleBadgeStyle(user.role)}`}>
                  {user.user_id}
                </span>
                <span className="font-semibold text-white max-w-[100px] truncate">
                  {user.full_name}
                </span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {/* User Profile & Role Switcher Dropdown */}
              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 p-3 rounded-2xl glass-panel-glow shadow-2xl z-50 border border-white/15 animate-in fade-in zoom-in-95 space-y-2 text-xs">
                  <div className="p-2 rounded-xl bg-white/5 border border-white/5">
                    <div className="font-bold text-white truncate">{user.full_name}</div>
                    <div className="text-[11px] font-mono text-slate-400 mt-0.5 flex items-center justify-between">
                      <span>ID: {user.user_id}</span>
                      <span className="capitalize text-brand-cyan">{user.role.replace('_', ' ')}</span>
                    </div>
                  </div>

                  {/* Role Dashboard Quick Action */}
                  {user.role === 'station_owner' && (
                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        setCurrentPage('owner-dashboard');
                      }}
                      className="w-full p-2 rounded-xl text-left hover:bg-[#00FF66]/10 text-slate-200 hover:text-[#00FF66] flex items-center space-x-2 transition-colors font-medium"
                    >
                      <Building2 className="w-4 h-4 text-[#00FF66]" />
                      <span>Open Owner Console</span>
                    </button>
                  )}

                  {user.role === 'admin' && (
                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        setCurrentPage('admin-dashboard');
                      }}
                      className="w-full p-2 rounded-xl text-left hover:bg-purple-500/10 text-slate-200 hover:text-purple-400 flex items-center space-x-2 transition-colors font-medium"
                    >
                      <ShieldAlert className="w-4 h-4 text-purple-400" />
                      <span>Open Admin Command</span>
                    </button>
                  )}

                  {user.role === 'customer' && (
                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        setCurrentPage('dashboard');
                      }}
                      className="w-full p-2 rounded-xl text-left hover:bg-cyan-500/10 text-slate-200 hover:text-cyan-400 flex items-center space-x-2 transition-colors font-medium"
                    >
                      <LayoutDashboard className="w-4 h-4 text-cyan-400" />
                      <span>Open Customer Dashboard</span>
                    </button>
                  )}

                  {/* Switch Demo Role Submenu */}
                  <div className="pt-2 border-t border-white/5">
                    <div className="text-[10px] uppercase font-mono text-slate-500 px-2 py-1">
                      Switch Role (Demo)
                    </div>
                    <div className="grid grid-cols-3 gap-1 px-1">
                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          openLoginModal('customer');
                        }}
                        className="py-1 rounded bg-white/5 hover:bg-cyan-500/20 text-[10px] font-mono text-cyan-400 text-center"
                      >
                        Customer
                      </button>
                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          openLoginModal('station_owner');
                        }}
                        className="py-1 rounded bg-white/5 hover:bg-[#00FF66]/20 text-[10px] font-mono text-[#00FF66] text-center"
                      >
                        Owner
                      </button>
                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          openLoginModal('admin');
                        }}
                        className="py-1 rounded bg-white/5 hover:bg-purple-500/20 text-[10px] font-mono text-purple-400 text-center"
                      >
                        Admin
                      </button>
                    </div>
                  </div>

                  {/* Sign Out */}
                  <div className="pt-2 border-t border-white/5">
                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        logout();
                        setCurrentPage('home');
                      }}
                      className="w-full p-2 rounded-xl text-left text-rose-400 hover:bg-rose-500/10 flex items-center space-x-2 transition-colors font-medium"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => openLoginModal('customer')}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/25 transition-all text-xs font-mono font-bold shadow-[0_0_15px_rgba(0,240,255,0.15)]"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          )}

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
          {!user ? (
            <button
              onClick={() => openLoginModal('customer')}
              className="px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
            >
              Sign In
            </button>
          ) : (
            <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${getRoleBadgeStyle(user.role)}`}>
              {user.user_id}
            </span>
          )}

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
            {user ? (
              <div className="flex items-center justify-between w-full">
                <span>Signed in as <strong className="text-white">{user.user_id}</strong></span>
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                    setCurrentPage('home');
                  }}
                  className="text-rose-400 hover:underline"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  openLoginModal('customer');
                }}
                className="w-full py-2 rounded-xl bg-cyan-500 text-slate-950 font-bold font-mono text-center uppercase"
              >
                Sign In to SmartChargeAI
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
