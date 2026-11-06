import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  LayoutDashboard, 
  Sliders, 
  DollarSign, 
  TrendingUp, 
  Activity, 
  PlugZap, 
  CalendarCheck, 
  RotateCw, 
  LogOut, 
  Menu, 
  X, 
  MapPin, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle,
  Zap,
  Clock,
  Car
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { 
  fetchOwnerStations, 
  updateOwnerTariff, 
  updateOwnerPortStatus, 
  fetchOwnerAnalytics 
} from '../services/api';
import { OwnerDashboardPage } from '../pages/OwnerDashboardPage';
import { HomePage } from '../pages/HomePage';

/**
 * @param {{
 *   currentPath: string;
 *   onNavigate: (path: string) => void;
 * }} props
 */
export function OwnerLayout({ currentPath, onNavigate }) {
  const { user, logout } = useAuth();
  const [stations, setStations] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [editingTariffId, setEditingTariffId] = useState(null);
  const [tariffInput, setTariffInput] = useState('');
  const [feedback, setFeedback] = useState(null);

  const navItems = [
    { path: '/owner/dashboard', label: 'Owner Dashboard', icon: LayoutDashboard },
    { path: '/owner/home', label: 'Platform Showcase', icon: Zap },
    { path: '/owner/stations', label: 'My Stations', icon: Building2 },
    { path: '/owner/ports', label: 'Charging Ports', icon: PlugZap },
    { path: '/owner/bookings', label: 'Live Bookings', icon: CalendarCheck },
    { path: '/owner/tariffs', label: 'Dynamic Tariffs', icon: Sliders },
    { path: '/owner/revenue', label: 'Revenue & Billing', icon: DollarSign },
    { path: '/owner/analytics', label: 'Analytics & Uptime', icon: TrendingUp },
  ];

  const loadData = async () => {
    setLoading(true);
    const [stRes, anRes] = await Promise.all([
      fetchOwnerStations(),
      fetchOwnerAnalytics(),
    ]);
    if (stRes.success) setStations(stRes.data);
    if (anRes.success) setAnalytics(anRes.data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleUpdatePrice = async (stationId) => {
    if (!tariffInput || isNaN(parseFloat(tariffInput)) || parseFloat(tariffInput) <= 0) {
      setFeedback({ type: 'error', message: 'Please enter a valid price in ₹/kWh.' });
      return;
    }

    const price = parseFloat(tariffInput);
    const res = await updateOwnerTariff(stationId, price, `Updated by Owner at ${new Date().toLocaleTimeString()}`);
    if (res.success) {
      setFeedback({ type: 'success', message: `Tariff updated to ₹${price.toFixed(2)}/kWh.` });
      setEditingTariffId(null);
      setTariffInput('');
      await loadData();
    } else {
      setFeedback({ type: 'error', message: res.error || 'Failed to update tariff.' });
    }
  };

  const handlePortAdjust = async (stationId, plugType, currentAvail, delta, totalCount) => {
    const newAvail = currentAvail + delta;
    if (newAvail < 0 || newAvail > totalCount) return;

    const res = await updateOwnerPortStatus(stationId, plugType, newAvail);
    if (res.success) {
      setFeedback({ type: 'success', message: `${plugType} availability set to ${newAvail}/${totalCount}.` });
      await loadData();
    } else {
      setFeedback({ type: 'error', message: res.error || 'Failed to update port.' });
    }
  };

  const handleLogout = () => {
    logout();
    onNavigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#070D18] text-slate-100 flex flex-col md:flex-row relative">
      {/* Ambient Blue / Navy Orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-700/10 rounded-full blur-[140px]" />
        <div className="absolute top-1/2 -right-40 w-[30rem] h-[30rem] bg-cyan-500/10 rounded-full blur-[160px]" />
      </div>

      {/* Owner Mobile Top Bar */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-[#0B1528] border-b border-cyan-500/20 sticky top-0 z-40">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-cyan-500 flex items-center justify-center text-slate-950 font-bold">
            <Building2 className="w-4 h-4 fill-slate-950" />
          </div>
          <div>
            <div className="text-sm font-extrabold text-white">SmartCharge<span className="text-cyan-400">CPO</span></div>
            <div className="text-[10px] font-mono text-cyan-400">OPERATOR CONSOLE</div>
          </div>
        </div>

        <button
          onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          className="p-2 rounded-lg bg-white/5 text-slate-300"
        >
          {mobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Owner Desktop Sidebar (Blue, Navy, Cyan Theme) */}
      <aside className={`
        fixed md:sticky top-0 left-0 h-screen w-64 bg-[#0A1322] border-r border-cyan-500/20 flex flex-col justify-between z-50 transition-transform duration-300
        ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Brand Header */}
        <div>
          <div className="p-6 border-b border-cyan-500/10">
            <div className="flex items-center space-x-3 cursor-pointer" onClick={() => onNavigate('/owner/dashboard')}>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-400 to-blue-600 flex items-center justify-center shadow-[0_0_20px_rgba(0,240,255,0.3)]">
                <Building2 className="w-5 h-5 text-slate-950 fill-slate-950" />
              </div>
              <div>
                <div className="text-base font-extrabold text-white tracking-tight">
                  SmartCharge<span className="text-cyan-400">CPO</span>
                </div>
                <div className="text-[10px] font-mono uppercase tracking-widest text-cyan-400">
                  Station Operations
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="p-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPath === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => {
                    onNavigate(item.path);
                    setMobileSidebarOpen(false);
                  }}
                  className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold font-mono tracking-wide transition-all ${
                    isActive
                      ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 shadow-[0_0_15px_rgba(0,240,255,0.15)] font-bold'
                      : 'text-slate-300 hover:text-white hover:bg-blue-950/40'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-blue-400/70'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-cyan-500/15 space-y-3 bg-[#070E1A]">
          <div className="p-3 rounded-2xl bg-blue-950/30 border border-cyan-500/20 text-xs font-mono space-y-1">
            <div className="text-slate-400 uppercase text-[10px]">Managed Infrastructure</div>
            <div className="text-white font-bold">{stations.length} Charging Plazas</div>
            <div className="text-[10px] text-cyan-400 font-semibold truncate">
              {stations.map(s => s.name).join(', ') || 'CyberTowers & Financial Dist'}
            </div>
          </div>

          <div className="flex items-center justify-between pt-1 text-xs font-mono">
            <div>
              <div className="text-white font-bold text-xs truncate max-w-[110px]">{user?.full_name || 'Vikram Reddy'}</div>
              <div className="text-[10px] text-cyan-400">{user?.user_id || 'OWNER-501'}</div>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 rounded-xl bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Owner Top Header */}
        <header className="hidden md:flex items-center justify-between px-8 py-4 bg-[#0A1322]/80 backdrop-blur-xl border-b border-cyan-500/15 sticky top-0 z-30">
          <div className="flex items-center space-x-2 text-xs font-mono text-slate-400">
            <span className="text-cyan-400 font-semibold uppercase">Station Owner Management</span>
            <span>/</span>
            <span className="text-white font-bold capitalize">
              {currentPath.replace('/owner/', '').replace('-', ' ') || 'Dashboard'}
            </span>
          </div>

          <div className="flex items-center space-x-4">
            {/* Quick Refresh Telemetry Button */}
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-blue-950/40 border border-cyan-500/20 hover:border-cyan-400/40 text-xs font-mono text-slate-200 transition-all"
            >
              <RotateCw className={`w-3.5 h-3.5 text-cyan-400 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Sync Live Hardware</span>
            </button>

            {/* Owner ID Badge */}
            <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-xs font-mono text-cyan-400">
              <Building2 className="w-3.5 h-3.5" />
              <span>{user?.user_id || 'OWNER-501'}</span>
            </div>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-rose-500/20 text-slate-300 hover:text-rose-400 text-xs font-mono transition-all border border-white/5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </header>

        {/* Dynamic Route View */}
        <main className={`flex-1 ${currentPath === '/owner/home' ? 'p-0 overflow-x-hidden' : 'p-4 sm:p-6 lg:p-8'}`}>
          {/* Platform Cinematic Showcase */}
          {currentPath === '/owner/home' && (
            <HomePage 
              setCurrentPage={(p) => onNavigate('/owner/stations')} 
              onSearch={() => onNavigate('/owner/stations')} 
            />
          )}

          {feedback && currentPath !== '/owner/home' && (
            <div className={`mb-6 p-4 rounded-2xl border flex items-center justify-between font-mono text-xs ${
              feedback.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
            }`}>
              <div className="flex items-center space-x-2">
                {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                <span>{feedback.message}</span>
              </div>
              <button onClick={() => setFeedback(null)} className="underline uppercase ml-4">Dismiss</button>
            </div>
          )}

          {/* Sub-view: Dashboard Overview */}
          {currentPath === '/owner/dashboard' && (
            <OwnerDashboardPage setCurrentPage={(p) => {
              if (p === 'discovery') onNavigate('/owner/stations');
            }} />
          )}

          {/* Sub-view: My Stations */}
          {currentPath === '/owner/stations' && (
            <div className="max-w-6xl mx-auto space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-cyan-500/20">
                <div>
                  <div className="text-xs font-mono text-cyan-400 uppercase">Dedicated Infrastructure</div>
                  <h1 className="text-3xl font-extrabold text-white mt-1">My Managed Stations</h1>
                  <p className="text-slate-400 text-sm mt-0.5">
                    Strictly showing only charging plazas assigned to Operator ID: <strong>{user?.user_id || 'OWNER-501'}</strong>.
                  </p>
                </div>
                <div className="font-mono text-xs text-slate-300 bg-white/5 px-3 py-1.5 rounded-xl border border-white/10">
                  {stations.length} Charging Plazas Assigned
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {stations.map((st) => (
                  <div key={st.id} className="p-6 rounded-3xl bg-[#0A1322] border border-cyan-500/20 space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-xs font-mono font-bold text-cyan-400 uppercase">{st.network}</span>
                        <h3 className="text-xl font-bold text-white mt-0.5">{st.name}</h3>
                        <p className="text-xs text-slate-400 mt-1 flex items-center space-x-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span className="truncate">{st.address}</span>
                        </p>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold border border-cyan-500/30 text-cyan-400 bg-cyan-500/10">
                        {st.status}
                      </span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-dark-900 border border-white/5 flex items-center justify-between font-mono text-xs">
                      <div>
                        <span className="text-slate-400">Active Tariff:</span>
                        <div className="text-white font-bold text-base">₹{st.price_per_kwh?.toFixed(2)}/kWh</div>
                      </div>
                      <div className="text-right">
                        <span className="text-slate-400">Bays Available:</span>
                        <div className="text-cyan-400 font-bold text-base">{st.available_ports} / {st.total_ports}</div>
                      </div>
                    </div>

                    <div className="pt-2 flex items-center space-x-2">
                      <button
                        onClick={() => onNavigate('/owner/tariffs')}
                        className="flex-1 py-2 rounded-xl bg-cyan-500 text-slate-950 font-bold font-mono text-xs uppercase hover:bg-cyan-400 transition-all"
                      >
                        Adjust Pricing
                      </button>
                      <button
                        onClick={() => onNavigate('/owner/ports')}
                        className="flex-1 py-2 rounded-xl bg-white/5 text-slate-200 hover:text-white font-bold font-mono text-xs uppercase hover:bg-white/10 transition-all border border-white/5"
                      >
                        Manage Bays
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sub-view: Charging Ports */}
          {currentPath === '/owner/ports' && (
            <div className="max-w-6xl mx-auto space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-cyan-500/20">
                <div>
                  <div className="text-xs font-mono text-cyan-400 uppercase">Hardware Telemetry</div>
                  <h1 className="text-3xl font-extrabold text-white mt-1">Charging Port Manager</h1>
                  <p className="text-slate-400 text-sm mt-0.5">
                    Live bay availability, connector health, and real-time bay occupancy simulation.
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                {stations.map((st) => (
                  <div key={st.id} className="p-6 rounded-3xl bg-[#0A1322] border border-cyan-500/20 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-bold text-white">{st.name}</h3>
                        <div className="text-xs font-mono text-slate-400">{st.address}</div>
                      </div>
                      <span className="text-xs font-mono text-cyan-400 font-bold">
                        {st.available_ports} of {st.total_ports} Available
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {st.connectors?.map((c) => (
                        <div key={c.id} className="p-4 rounded-2xl bg-dark-900 border border-white/5 space-y-3">
                          <div className="flex items-center justify-between text-xs font-mono">
                            <span className="font-bold text-white flex items-center space-x-1.5">
                              <PlugZap className="w-4 h-4 text-cyan-400" />
                              <span>{c.plug_type}</span>
                            </span>
                            <span className="text-amber-400 font-bold">{c.power_kw} kW</span>
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-white/5 font-mono text-xs">
                            <span className="text-slate-300">
                              <strong className="text-cyan-400">{c.available}</strong> / {c.count} Available
                            </span>
                            <div className="flex items-center space-x-1">
                              <button
                                onClick={() => handlePortAdjust(st.id, c.plug_type, c.available, -1, c.count)}
                                disabled={c.available <= 0}
                                className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed text-xs font-mono font-bold flex items-center justify-center border border-white/10"
                                title="Car arrived (occupy port)"
                              >
                                -
                              </button>
                              <button
                                onClick={() => handlePortAdjust(st.id, c.plug_type, c.available, 1, c.count)}
                                disabled={c.available >= c.count}
                                className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed text-xs font-mono font-bold flex items-center justify-center border border-white/10"
                                title="Car departed (free port)"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sub-view: Live Bookings */}
          {currentPath === '/owner/bookings' && (
            <div className="max-w-6xl mx-auto space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-cyan-500/20">
                <div>
                  <div className="text-xs font-mono text-cyan-400 uppercase">Reservations & Bay Queue</div>
                  <h1 className="text-3xl font-extrabold text-white mt-1">Live Driver Bookings</h1>
                  <p className="text-slate-400 text-sm mt-0.5">
                    Real-time queue schedule for your managed charging plazas in Hyderabad.
                  </p>
                </div>
              </div>

              <div className="rounded-3xl bg-[#0A1322] border border-cyan-500/20 overflow-hidden">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-blue-950/40 border-b border-cyan-500/20 text-slate-400 uppercase">
                    <tr>
                      <th className="p-4">Customer ID</th>
                      <th className="p-4">Station</th>
                      <th className="p-4">Bay Plug</th>
                      <th className="p-4">Slot Time</th>
                      <th className="p-4">Est. Energy</th>
                      <th className="p-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    <tr className="hover:bg-white/[0.02]">
                      <td className="p-4 font-bold text-cyan-400">CUST-1001 (Rahul S.)</td>
                      <td className="p-4 text-white">Jio-bp CyberTowers</td>
                      <td className="p-4">CCS2 180kW (Bay #2)</td>
                      <td className="p-4 text-slate-300">14:45 - 15:15</td>
                      <td className="p-4 text-emerald-400 font-bold">28.5 kWh</td>
                      <td className="p-4"><span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">Active Charging</span></td>
                    </tr>
                    <tr className="hover:bg-white/[0.02]">
                      <td className="p-4 font-bold text-cyan-400">CUST-1042 (Anil K.)</td>
                      <td className="p-4 text-white">Statiq Financial District</td>
                      <td className="p-4">CCS2 240kW (Bay #1)</td>
                      <td className="p-4 text-slate-300">15:30 - 16:00</td>
                      <td className="p-4 text-emerald-400 font-bold">35.0 kWh</td>
                      <td className="p-4"><span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">Reserved (In-Transit)</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Sub-view: Dynamic Tariffs */}
          {currentPath === '/owner/tariffs' && (
            <div className="max-w-6xl mx-auto space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-cyan-500/20">
                <div>
                  <div className="text-xs font-mono text-cyan-400 uppercase">Tariff Rate Controller</div>
                  <h1 className="text-3xl font-extrabold text-white mt-1">Dynamic Tariff Management</h1>
                  <p className="text-slate-400 text-sm mt-0.5">
                    Adjust per-kilowatt-hour pricing instantly with real-time database persistence.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {stations.map((st) => (
                  <div key={st.id} className="p-6 rounded-3xl bg-[#0A1322] border border-cyan-500/20 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-mono text-cyan-400">{st.network}</span>
                        <h3 className="text-lg font-bold text-white mt-0.5">{st.name}</h3>
                      </div>
                      <span className="text-xs font-mono text-slate-400">ID: {st.id}</span>
                    </div>

                    <div className="p-4 rounded-2xl bg-dark-900 border border-white/5 space-y-3">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-slate-400">Current Base Rate:</span>
                        <span className="text-2xl font-bold text-white font-mono">₹{st.price_per_kwh?.toFixed(2)}/kWh</span>
                      </div>

                      <div className="pt-2 border-t border-white/5">
                        <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1.5">
                          Set New Tariff Rate (₹/kWh)
                        </label>
                        <div className="flex items-center space-x-2">
                          <input
                            type="number"
                            step="0.5"
                            placeholder="e.g. 19.50"
                            defaultValue={st.price_per_kwh}
                            onChange={(e) => setTariffInput(e.target.value)}
                            className="flex-1 bg-dark-950 border border-cyan-500/30 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-cyan-400"
                          />
                          <button
                            onClick={() => handleUpdatePrice(st.id)}
                            className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold font-mono text-xs uppercase transition-all"
                          >
                            Update
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sub-view: Revenue & Billing */}
          {currentPath === '/owner/revenue' && (
            <div className="max-w-6xl mx-auto space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-cyan-500/20">
                <div>
                  <div className="text-xs font-mono text-cyan-400 uppercase">Financial Intelligence</div>
                  <h1 className="text-3xl font-extrabold text-white mt-1">Revenue & Settlement</h1>
                  <p className="text-slate-400 text-sm mt-0.5">
                    Real-time earnings, daily kilowatt delivery totals, and automatic tariff settlements.
                  </p>
                </div>
              </div>

              {analytics && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-6 rounded-3xl bg-[#0A1322] border border-cyan-500/20">
                    <div className="text-xs font-mono text-slate-400 uppercase">Estimated Today's Revenue</div>
                    <div className="text-3xl font-extrabold text-cyan-400 font-mono mt-1">
                      ₹{analytics.total_revenue_inr.toLocaleString()}
                    </div>
                  </div>
                  <div className="p-6 rounded-3xl bg-[#0A1322] border border-cyan-500/20">
                    <div className="text-xs font-mono text-slate-400 uppercase">Total Energy Dispensed</div>
                    <div className="text-3xl font-extrabold text-white font-mono mt-1">
                      {analytics.total_kwh_dispensed} <span className="text-sm text-slate-400">kWh</span>
                    </div>
                  </div>
                  <div className="p-6 rounded-3xl bg-[#0A1322] border border-cyan-500/20">
                    <div className="text-xs font-mono text-slate-400 uppercase">Station Utilization</div>
                    <div className="text-3xl font-extrabold text-emerald-400 font-mono mt-1">
                      {analytics.utilization_rate}%
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Sub-view: Analytics & Uptime */}
          {currentPath === '/owner/analytics' && (
            <div className="max-w-6xl mx-auto space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-cyan-500/20">
                <div>
                  <div className="text-xs font-mono text-cyan-400 uppercase">Performance Metrics</div>
                  <h1 className="text-3xl font-extrabold text-white mt-1">Hardware Analytics & Uptime</h1>
                  <p className="text-slate-400 text-sm mt-0.5">
                    Bay availability statistics and grid telemetry for assigned hubs.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 rounded-3xl bg-[#0A1322] border border-cyan-500/20 space-y-3 font-mono text-xs">
                  <h3 className="font-bold text-white text-sm font-sans">Hardware Uptime Summary</h3>
                  <div className="flex justify-between py-2 border-b border-white/5">
                    <span className="text-slate-400">Network Operational Availability:</span>
                    <span className="text-emerald-400 font-bold">99.85% Optimal</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-white/5">
                    <span className="text-slate-400">Average Dwell Time:</span>
                    <span className="text-white font-bold">24.5 minutes</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-slate-400">Peak Occupancy Hours:</span>
                    <span className="text-cyan-400 font-bold">12:30 PM - 3:00 PM</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

