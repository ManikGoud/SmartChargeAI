import React, { useState } from 'react';
import { 
  Zap, 
  LayoutDashboard, 
  MapPin, 
  Compass, 
  Car, 
  Clock, 
  Bookmark, 
  Bot, 
  LogOut, 
  Menu, 
  X, 
  BatteryCharging, 
  ShieldCheck, 
  DollarSign, 
  Navigation,
  Sliders,
  ChevronDown,
  Info,
  Search
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useVehicle } from '../context/VehicleContext';
import { useStations } from '../context/StationContext';
import { HomePage } from '../pages/HomePage';
import { DashboardPage } from '../pages/DashboardPage';
import { DiscoveryPage } from '../pages/DiscoveryPage';
import { TripPlannerPage } from '../pages/TripPlannerPage';
import { CostComparisonPage } from '../pages/CostComparisonPage';
import { GaragePage } from '../pages/GaragePage';
import { AssistantPage } from '../pages/AssistantPage';
import { FloatingAIAssist } from '../components/FloatingAIAssist';
import { StationDetailModal } from '../components/StationDetailModal';
import { NavigationModal } from '../components/NavigationModal';
import { SAMPLE_RECENT_CHARGES } from '../data/sampleData';

/**
 * CustomerLayout
 * Full-width automotive-luxury layout for EV Drivers.
 * Features a dedicated Top Navigation Bar matching the screen recording (NO left sidebar),
 * full-width immersive 3D cinematic canvas on /customer/home,
 * and seamless routing between all 9 customer views.
 *
 * @param {{
 *   currentPath: string;
 *   onNavigate: (path: string) => void;
 * }} props
 */
export function CustomerLayout({ currentPath, onNavigate }) {
  const { user, logout } = useAuth();
  const { activeVehicle, currentSoC, updateSoC, usableRangeKm } = useVehicle();
  const { stations, bookmarkedIds, toggleBookmark, setSelectedStation, setSearchQuery } = useStations();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [batteryDropdownOpen, setBatteryDropdownOpen] = useState(false);

  // Filter state for charging history
  const [historySearch, setHistorySearch] = useState('');
  const [historyFilter, setHistoryFilter] = useState('ALL');

  // Modal inspection & navigation for saved stations
  const [savedDetailStation, setSavedDetailStation] = useState(null);
  const [savedNavigatingStation, setSavedNavigatingStation] = useState(null);

  const bookmarkedStations = stations.filter(s => bookmarkedIds.includes(s.id));

  const filteredCharges = SAMPLE_RECENT_CHARGES.filter(c => {
    const matchesSearch = c.stationName.toLowerCase().includes(historySearch.toLowerCase()) ||
                          c.chargerType.toLowerCase().includes(historySearch.toLowerCase());
    if (!matchesSearch) return false;
    if (historyFilter === 'DC_FAST') return c.chargerType.includes('DC') || c.chargerType.includes('CCS2');
    if (historyFilter === 'AC_STANDARD') return c.chargerType.includes('AC') || c.chargerType.includes('Type 2');
    return true;
  });

  // 9 Customer Navigation Destinations
  const navLinks = [
    { id: 'home', path: '/customer/home', label: 'Home', icon: Zap },
    { id: 'dashboard', path: '/customer/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'stations', path: '/customer/stations', label: 'Stations', icon: MapPin },
    { id: 'trips', path: '/customer/trips', label: 'Trip Planner', icon: Compass },
    { id: 'comparison', path: '/customer/comparison', label: 'Cost Compare', icon: DollarSign },
    { id: 'garage', path: '/customer/garage', label: 'Garage', icon: Car },
    { id: 'history', path: '/customer/history', label: 'History', icon: Clock },
    { id: 'saved', path: '/customer/saved', label: 'Saved', icon: Bookmark },
    { id: 'assistant', path: '/customer/assistant', label: 'AI Assistant', icon: Bot },
  ];

  const getBatteryColor = (soc) => {
    if (soc > 50) return 'text-white bg-white/10 border-white/20';
    if (soc > 25) return 'text-zinc-300 bg-white/5 border-white/10';
    return 'text-zinc-400 bg-zinc-900 border-zinc-700';
  };

  const handleLogout = () => {
    logout();
    onNavigate('/login');
  };

  const isCinematicHome = currentPath === '/customer/home';

  return (
    <div className="customer-portal min-h-screen bg-[#050507] text-zinc-100 flex flex-col justify-between selection:bg-white/20 selection:text-white relative font-sans">
      {/* Subtle Monochrome Vignette Mesh */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1100px] h-[300px] bg-gradient-to-b from-white/[0.025] to-transparent blur-3xl"></div>
      </div>

      {/* DEDICATED CUSTOMER TOP NAVIGATION (Premium Monochrome Automotive Cockpit) */}
      <header className="sticky top-0 z-40 w-full border-b border-white/[0.08] bg-[#050507]/95 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Brand Identity */}
          <div 
            onClick={() => onNavigate('/customer/home')}
            className="flex items-center space-x-3 cursor-pointer group shrink-0"
          >
            <div className="w-8 h-8 rounded-lg bg-[#111115] border border-white/25 flex items-center justify-center group-hover:border-white transition-all">
              <Zap className="w-4 h-4 text-white fill-white" />
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-white group-hover:text-zinc-200 transition-colors">
                SMARTCHARGE
              </span>
              <span className="hidden xl:inline-block ml-2 text-[9px] font-mono tracking-widest uppercase text-zinc-400 border border-white/15 px-1.5 py-0.5 rounded-sm">
                EV COCKPIT
              </span>
            </div>
          </div>

          {/* Desktop Nav Links (9 Customer Destinations) */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive = currentPath === item.path;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.path)}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs tracking-wide transition-all ${
                    isActive 
                      ? 'bg-[#18181C] text-white border border-white/20 font-semibold' 
                      : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-zinc-500'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Section: Active Vehicle Widget, Customer Profile & Sign Out */}
          <div className="hidden sm:flex items-center space-x-2.5">
            {/* Active Vehicle SoC Pill */}
            <div className="relative">
              <button
                onClick={() => setBatteryDropdownOpen(!batteryDropdownOpen)}
                className="flex items-center space-x-2.5 px-3 py-1.5 rounded-lg bg-[#101014] border border-white/10 hover:border-white/25 transition-all text-xs"
                title="Vehicle telemetry status"
              >
                <Car className="w-3.5 h-3.5 text-zinc-300" />
                <span className="font-semibold text-white max-w-[110px] truncate tracking-tight">
                  {activeVehicle.make} {activeVehicle.model}
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-white inline-block shadow-[0_0_6px_rgba(255,255,255,0.8)]"></span>
                <span className={`px-1.5 py-0.5 rounded font-mono font-bold text-[11px] border ${getBatteryColor(currentSoC)}`}>
                  {currentSoC}%
                </span>
                <span className="text-zinc-400 font-mono text-[11px] hidden xl:inline">
                  ~{usableRangeKm} km
                </span>
              </button>

              {/* Quick SoC Adjustment Drawer */}
              {batteryDropdownOpen && (
                <div className="absolute right-0 mt-2 w-72 p-4 rounded-xl bg-[#0B0B0E] border border-white/15 shadow-2xl z-50 animate-in fade-in zoom-in-95">
                  <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/[0.08]">
                    <span className="text-xs font-semibold text-white flex items-center space-x-1.5">
                      <BatteryCharging className="w-4 h-4 text-zinc-300" />
                      <span>Battery Telemetry Calibration</span>
                    </span>
                    <button 
                      onClick={() => setBatteryDropdownOpen(false)}
                      className="text-zinc-400 hover:text-white text-xs p-1"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-zinc-400">Simulation Level</span>
                      <span className="text-white font-bold">{currentSoC}% ({((activeVehicle.batteryCapacity * currentSoC) / 100).toFixed(1)} kWh)</span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="100"
                      value={currentSoC}
                      onChange={(e) => updateSoC(e.target.value)}
                      className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-white"
                    />
                    <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
                      <span>5% (Reserve)</span>
                      <span>50%</span>
                      <span>100% (Full)</span>
                    </div>
                    <div className="pt-2 border-t border-white/[0.06] flex justify-between items-center text-xs">
                      <span className="text-zinc-400">Usable Range:</span>
                      <span className="font-mono text-white font-semibold">{usableRangeKm} km</span>
                    </div>
                    <button
                      onClick={() => {
                        setBatteryDropdownOpen(false);
                        onNavigate('/customer/garage');
                      }}
                      className="w-full mt-1 py-1.5 text-xs text-center text-zinc-300 hover:text-white bg-[#141418] rounded-lg border border-white/10 hover:border-white/25 transition-colors font-mono"
                    >
                      Open Full EV Garage →
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Customer ID Badge */}
            <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-[#121216] border border-white/10 text-xs font-mono text-zinc-300">
              <ShieldCheck className="w-3.5 h-3.5 text-zinc-400" />
              <span>{user?.user_id || 'CUST-1001'}</span>
            </div>

            {/* Sign Out */}
            <button
              onClick={handleLogout}
              className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-[#121216] hover:bg-white/5 text-zinc-400 hover:text-white text-xs font-mono transition-all border border-white/[0.08]"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden xl:inline">Sign Out</span>
            </button>
          </div>

          {/* Mobile Hamburger Button */}
          <div className="flex items-center lg:hidden space-x-2">
            <button
              onClick={() => onNavigate('/customer/garage')}
              className={`px-2 py-1 rounded-md text-xs font-mono border ${getBatteryColor(currentSoC)}`}
            >
              {currentSoC}%
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg bg-[#121216] border border-white/10 text-zinc-300 hover:text-white"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Responsive Menu Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-b border-white/10 bg-[#050507]/95 backdrop-blur-xl px-4 pt-2 pb-4 space-y-1">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive = currentPath === item.path;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onNavigate(item.path);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
                    isActive 
                      ? 'bg-[#18181C] text-white border border-white/20 font-semibold' 
                      : 'text-zinc-300 hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-4 h-4 text-white" />
                  <span>{item.label}</span>
                </button>
              );
            })}

            <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs text-zinc-400">
              <span className="font-mono text-zinc-300">Driver ID: {user?.user_id || 'CUST-1001'}</span>
              <button
                onClick={handleLogout}
                className="text-rose-400 hover:underline flex items-center space-x-1 font-mono"
              >
                <LogOut className="w-3 h-3" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* DYNAMIC VIEW ROUTER */}
      <main className={`flex-1 w-full ${isCinematicHome ? 'p-0 overflow-x-hidden' : ''}`}>
        
        {/* 1. RESTORED ORIGINAL CINEMATIC HOMEPAGE (Full-Width, 3D Canvas, Search & Exploded Powertrain) */}
        {isCinematicHome && (
          <HomePage 
            setCurrentPage={(p) => {
              if (p === 'discovery') onNavigate('/customer/stations');
              else if (p === 'garage') onNavigate('/customer/garage');
              else if (p === 'trips') onNavigate('/customer/trips');
              else if (p === 'comparison') onNavigate('/customer/comparison');
              else if (p === 'assistant') onNavigate('/customer/assistant');
              else if (p === 'dashboard') onNavigate('/customer/dashboard');
            }} 
            onSearch={(q) => {
              setSearchQuery(q);
              onNavigate('/customer/stations');
            }} 
          />
        )}

        {/* 2. DEDICATED CUSTOMER DASHBOARD (EV Telemetry Console) */}
        {currentPath === '/customer/dashboard' && (
          <DashboardPage setCurrentPage={(p) => {
            if (p === 'garage') onNavigate('/customer/garage');
            else if (p === 'discovery') onNavigate('/customer/stations');
            else if (p === 'trips') onNavigate('/customer/trips');
            else if (p === 'comparison') onNavigate('/customer/comparison');
            else if (p === 'home') onNavigate('/customer/home');
          }} />
        )}

        {/* 3. FIND STATIONS (Leaflet / OpenStreetMap Discovery Map) */}
        {currentPath === '/customer/stations' && (
          <DiscoveryPage setCurrentPage={(p) => {
            if (p === 'trips') onNavigate('/customer/trips');
            else if (p === 'home') onNavigate('/customer/home');
          }} />
        )}

        {/* 4. TRIP PLANNER */}
        {currentPath === '/customer/trips' && (
          <TripPlannerPage setCurrentPage={(p) => {
            if (p === 'discovery') onNavigate('/customer/stations');
            else if (p === 'home') onNavigate('/customer/home');
          }} />
        )}

        {/* 5. COST COMPARISON (EV vs Petrol Mathematical Calculator) */}
        {currentPath === '/customer/comparison' && (
          <CostComparisonPage setCurrentPage={(p) => {
            if (p === 'discovery') onNavigate('/customer/stations');
            else if (p === 'home') onNavigate('/customer/home');
          }} />
        )}

        {/* 6. MY GARAGE */}
        {currentPath === '/customer/garage' && (
          <GaragePage setCurrentPage={(p) => {
            if (p === 'discovery') onNavigate('/customer/stations');
            else if (p === 'home') onNavigate('/customer/home');
          }} />
        )}

        {/* 7. CHARGING HISTORY */}
        {currentPath === '/customer/history' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-white/[0.12] gap-4">
              <div>
                <div className="text-xs font-mono text-zinc-400 uppercase tracking-wider">Customer Journey Logs</div>
                <h1 className="text-3xl font-extrabold text-white mt-1">Charging Session History</h1>
                <p className="text-zinc-400 text-sm mt-0.5">
                  Verified record of kilowatt-hours delivered, dwell times, and cost savings for your EV garage.
                </p>
              </div>
              <div className="text-right font-mono text-xs text-zinc-400">
                Total Sessions: <strong className="text-white">{filteredCharges.length}</strong> of {SAMPLE_RECENT_CHARGES.length}
              </div>
            </div>

            {/* Metric Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-5 rounded-xl bg-[#0B0B0E] border border-white/[0.12]">
                <div className="text-xs font-mono text-zinc-500 uppercase tracking-wider">Total Energy Charged</div>
                <div className="text-3xl font-extrabold text-white font-mono mt-1">
                  {filteredCharges.reduce((sum, c) => sum + c.energyKwh, 0).toFixed(1)} <span className="text-sm font-normal text-zinc-400">kWh</span>
                </div>
              </div>
              <div className="p-5 rounded-xl bg-[#0B0B0E] border border-white/[0.12]">
                <div className="text-xs font-mono text-zinc-500 uppercase tracking-wider">Total EV Spend</div>
                <div className="text-3xl font-extrabold text-white font-mono mt-1">
                  ₹{filteredCharges.reduce((sum, c) => sum + c.cost, 0).toFixed(2)}
                </div>
              </div>
              <div className="p-5 rounded-xl bg-[#0B0B0E] border border-white/[0.12]">
                <div className="text-xs font-mono text-zinc-500 uppercase tracking-wider">Petrol Equivalent Saved</div>
                <div className="text-3xl font-extrabold text-white font-mono mt-1">
                  ₹{Math.round(filteredCharges.reduce((sum, c) => sum + c.energyKwh, 0) * 5.2 * 7.4).toLocaleString()}
                </div>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="p-4 rounded-xl bg-[#0B0B0E] border border-white/[0.12] flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Filter by station or plug..."
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  className="w-full bg-[#121216] border border-white/10 rounded-lg pl-9 pr-3 py-2 text-xs font-mono text-white placeholder-zinc-500 focus:outline-none focus:border-white/30"
                />
              </div>
              <div className="flex items-center space-x-2 w-full sm:w-auto overflow-x-auto">
                {[
                  { id: 'ALL', label: 'All Sessions' },
                  { id: 'DC_FAST', label: 'DC Rapid' },
                  { id: 'AC_STANDARD', label: 'AC Standard' }
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setHistoryFilter(f.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono uppercase transition-all shrink-0 ${
                      historyFilter === f.id
                        ? 'bg-white text-[#050507] font-bold shadow-md'
                        : 'bg-[#121216] text-zinc-400 hover:text-white border border-white/10'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Session Records Table */}
            <div className="rounded-xl bg-[#0B0B0E] border border-white/[0.12] overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-[#121216] border-b border-white/[0.12] text-zinc-400 uppercase tracking-wider">
                    <tr>
                      <th className="p-4">Charging Plaza</th>
                      <th className="p-4">Date & Time</th>
                      <th className="p-4">Energy Added</th>
                      <th className="p-4">Battery Delta</th>
                      <th className="p-4">Duration</th>
                      <th className="p-4">Total Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredCharges.map((c, i) => (
                      <tr key={i} className="hover:bg-white/[0.03] transition-colors">
                        <td className="p-4">
                          <div className="font-bold text-white text-sm font-sans">{c.stationName}</div>
                          <div className="text-zinc-400 text-[11px] mt-0.5">{c.chargerType}</div>
                        </td>
                        <td className="p-4 text-zinc-300">{c.date}</td>
                        <td className="p-4 font-bold text-white">{c.energyKwh} kWh</td>
                        <td className="p-4 text-zinc-200">
                          <span className="text-zinc-400">{c.startSoC}%</span> → <span className="text-white font-bold">{c.endSoC}%</span>
                        </td>
                        <td className="p-4 text-zinc-300">{c.durationMins} mins</td>
                        <td className="p-4 font-bold text-white text-sm">₹{c.cost.toFixed(2)}</td>
                      </tr>
                    ))}
                    {filteredCharges.length === 0 && (
                      <tr>
                        <td colSpan="6" className="p-8 text-center text-zinc-500 font-mono">
                          No charging sessions match your filter criteria.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 8. SAVED STATIONS */}
        {currentPath === '/customer/saved' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-white/[0.12] gap-4">
              <div>
                <div className="text-xs font-mono text-zinc-400 uppercase tracking-wider">Favorite Charging Plazas</div>
                <h1 className="text-3xl font-extrabold text-white mt-1">Bookmarked Hubs</h1>
                <p className="text-zinc-400 text-sm mt-0.5">
                  Your preferred charging stops in Hyderabad for quick access and direct live navigation.
                </p>
              </div>
              <button
                onClick={() => onNavigate('/customer/stations')}
                className="px-4 py-2.5 rounded-xl bg-white text-[#050507] font-bold font-mono text-xs uppercase hover:bg-zinc-200 transition-all shadow-md self-start sm:self-auto"
              >
                Explore Station Network
              </button>
            </div>

            {bookmarkedStations.length === 0 ? (
              <div className="p-16 text-center rounded-2xl bg-[#0B0B0E] border border-white/[0.12] space-y-4">
                <Bookmark className="w-12 h-12 text-zinc-600 mx-auto" />
                <div className="text-lg font-bold text-white">No bookmarked stations yet</div>
                <p className="text-zinc-400 text-xs max-w-sm mx-auto">
                  Search and bookmark stations on the Find Stations map to view them here for instant 1-click routing.
                </p>
                <button
                  onClick={() => onNavigate('/customer/stations')}
                  className="px-4 py-2 rounded-xl bg-[#121216] border border-white/20 text-white hover:bg-white/10 font-mono text-xs uppercase transition-all"
                >
                  Find Stations Now →
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {bookmarkedStations.map((st) => (
                  <div 
                    key={st.id} 
                    className="p-6 rounded-2xl bg-[#0B0B0E] border border-white/[0.12] hover:border-white/30 transition-all flex flex-col justify-between space-y-4 shadow-xl"
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs font-mono mb-2">
                        <span className="px-2 py-0.5 rounded bg-white/10 text-white border border-white/20 font-bold uppercase text-[10px]">
                          {st.network}
                        </span>
                        <div className="flex items-center space-x-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold border border-white/20 text-white bg-white/10">
                            {st.status}
                          </span>
                          <button
                            onClick={() => toggleBookmark(st.id)}
                            className="p-1 text-zinc-500 hover:text-white transition-colors"
                            title="Remove from bookmarks"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <h3 className="text-lg font-bold text-white tracking-tight">{st.name}</h3>
                      <p className="text-xs text-zinc-400 mt-1 flex items-center space-x-1.5">
                        <MapPin className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                        <span className="truncate">{st.address}</span>
                      </p>

                      <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-white/[0.08] text-xs font-mono">
                        <div className="bg-[#121216] p-2.5 rounded-xl border border-white/[0.06]">
                          <span className="text-zinc-500 text-[10px] block uppercase">Tariff</span>
                          <span className="text-white font-bold">₹{st.price_per_kwh?.toFixed(2) || '18.50'}/kWh</span>
                        </div>
                        <div className="bg-[#121216] p-2.5 rounded-xl border border-white/[0.06]">
                          <span className="text-zinc-500 text-[10px] block uppercase">Capacity</span>
                          <span className="text-zinc-300 font-bold">{st.peak_power_kw || 150} kW</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-white/[0.08] flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setSelectedStation(st);
                          setSavedDetailStation(st);
                        }}
                        className="flex-1 py-2 px-3 rounded-xl bg-[#121216] hover:bg-white/10 border border-white/15 text-xs font-mono text-zinc-200 hover:text-white flex items-center justify-center space-x-1.5 transition-all"
                      >
                        <Info className="w-3.5 h-3.5 text-zinc-400" />
                        <span>Details</span>
                      </button>
                      <button
                        onClick={() => {
                          setSelectedStation(st);
                          setSavedNavigatingStation(st);
                        }}
                        className="flex-1 py-2 px-3 rounded-xl bg-white text-[#050507] hover:bg-zinc-200 font-bold font-mono text-xs uppercase flex items-center justify-center space-x-1.5 transition-all shadow-md"
                      >
                        <Navigation className="w-3.5 h-3.5 fill-[#050507]" />
                        <span>Navigate</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 9. AI ASSISTANT (Local Ollama Intelligence) */}
        {currentPath === '/customer/assistant' && (
          <AssistantPage setCurrentPage={(p) => {
            if (p === 'discovery' || p === 'stations') onNavigate('/customer/stations');
            else if (p === 'trips') onNavigate('/customer/trips');
            else if (p === 'dashboard') onNavigate('/customer/dashboard');
            else if (p === 'home') onNavigate('/customer/home');
          }} />
        )}

      </main>

      {/* Global Persistent Floating AI Assist */}
      <FloatingAIAssist setCurrentPage={(p) => {
        if (p === 'assistant') onNavigate('/customer/assistant');
        else if (p === 'discovery') onNavigate('/customer/stations');
      }} />

      {/* Bottom Footer on non-cinematic pages */}
      {!isCinematicHome && (
        <footer className="w-full border-t border-white/[0.06] py-4 px-6 text-center text-xs text-zinc-500 font-mono">
          SmartChargeAI • Luxury EV Intelligence Cockpit • Connected to Local Ollama AI & OSRM
        </footer>
      )}

      {/* Station Details Modal for Bookmarked Plazas */}
      {savedDetailStation && (
        <StationDetailModal
          station={savedDetailStation}
          onClose={() => setSavedDetailStation(null)}
          onOpenCalculator={() => { }}
          onNavigate={(s) => {
            setSavedDetailStation(null);
            setSavedNavigatingStation(s);
          }}
        />
      )}

      {/* In-App Live OSRM Navigation Modal for Bookmarked Plazas */}
      {savedNavigatingStation && (
        <NavigationModal
          station={savedNavigatingStation}
          onClose={() => setSavedNavigatingStation(null)}
        />
      )}
    </div>
  );
}
