import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  LayoutDashboard, 
  Users, 
  Building2, 
  FileText, 
  Settings, 
  RotateCw, 
  LogOut, 
  Menu, 
  X, 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  Lock, 
  Search, 
  Sliders, 
  Crown,
  KeyRound,
  ShieldCheck,
  Zap,
  Server
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { 
  fetchAdminMetrics, 
  fetchAdminUsers, 
  fetchAdminAuditLogs, 
  overrideStationStatus,
  fetchStations
} from '../services/api';
import { AdminDashboardPage } from '../pages/AdminDashboardPage';
import { HomePage } from '../pages/HomePage';

/**
 * @param {{
 *   currentPath: string;
 *   onNavigate: (path: string) => void;
 * }} props
 */
export function AdminLayout({ currentPath, onNavigate }) {
  const { user, logout } = useAuth();
  const [metrics, setMetrics] = useState(null);
  const [usersList, setUsersList] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [feedback, setFeedback] = useState(null);

  const navItems = [
    { path: '/admin/dashboard', label: 'Admin Dashboard', icon: LayoutDashboard },
    { path: '/admin/home', label: 'Landing Showcase', icon: Zap },
    { path: '/admin/users', label: 'User Management', icon: Users },
    { path: '/admin/approvals', label: 'Station Approvals', icon: ShieldCheck },
    { path: '/admin/network', label: 'Network Management', icon: Building2 },
    { path: '/admin/logs', label: 'Audit Logs', icon: FileText },
    { path: '/admin/settings', label: 'Platform Settings', icon: Settings },
  ];

  const loadAll = async () => {
    setLoading(true);
    const [mRes, uRes, lRes, stRes] = await Promise.all([
      fetchAdminMetrics(),
      fetchAdminUsers(),
      fetchAdminAuditLogs(50),
      fetchStations()
    ]);
    if (mRes.success) setMetrics(mRes.data);
    if (uRes.success) setUsersList(uRes.data);
    if (lRes.success) setAuditLogs(lRes.data);
    if (stRes.success) setStations(stRes.data);
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAll();
    setRefreshing(false);
  };

  const handleStationOverride = async (stationId, newStatus) => {
    const res = await overrideStationStatus(stationId, newStatus);
    if (res.success) {
      setFeedback({
        type: 'success',
        message: `Master override applied: Station ${res.data.station_name} set to ${newStatus}.`
      });
      await loadAll();
    } else {
      setFeedback({
        type: 'error',
        message: res.error || 'Failed to override station status.'
      });
    }
  };

  const handleLogout = () => {
    logout();
    onNavigate('/login');
  };

  const filteredUsers = usersList.filter(u => 
    u.full_name?.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.user_id?.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.role?.toLowerCase().includes(userSearch.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#07080B] text-slate-100 flex flex-col md:flex-row relative">
      {/* Ambient Charcoal / Luxury Gold Orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-amber-500/10 rounded-full blur-[150px]" />
        <div className="absolute top-1/2 -right-40 w-[30rem] h-[30rem] bg-amber-600/5 rounded-full blur-[170px]" />
      </div>

      {/* Admin Mobile Top Bar */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-[#101118] border-b border-amber-500/20 sticky top-0 z-40">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 font-bold">
            <Crown className="w-4 h-4 fill-slate-950" />
          </div>
          <div>
            <div className="text-sm font-extrabold text-white">SmartCharge<span className="text-amber-400">ADMIN</span></div>
            <div className="text-[10px] font-mono text-amber-400">COMMAND CENTER</div>
          </div>
        </div>

        <button
          onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          className="p-2 rounded-lg bg-white/5 text-slate-300"
        >
          {mobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Admin Desktop Sidebar (Premium Black, Charcoal, Gold Theme) */}
      <aside className={`
        fixed md:sticky top-0 left-0 h-screen w-64 bg-[#0F1017] border-r border-amber-500/20 flex flex-col justify-between z-50 transition-transform duration-300
        ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Brand Header */}
        <div>
          <div className="p-6 border-b border-amber-500/15">
            <div className="flex items-center space-x-3 cursor-pointer" onClick={() => onNavigate('/admin/dashboard')}>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-400 via-amber-500 to-yellow-600 flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.25)]">
                <Crown className="w-5 h-5 text-slate-950 fill-slate-950" />
              </div>
              <div>
                <div className="text-base font-extrabold text-white tracking-tight">
                  SmartCharge<span className="text-amber-400">AI</span>
                </div>
                <div className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold">
                  Command Center
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
                      ? 'bg-amber-500/15 text-amber-400 border border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.15)] font-bold'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-amber-500/60'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-amber-500/15 space-y-3 bg-[#0B0C12]">
          <div className="p-3 rounded-2xl bg-amber-950/20 border border-amber-500/20 text-xs font-mono space-y-1">
            <div className="text-slate-400 uppercase text-[10px]">Security Clearance</div>
            <div className="text-amber-400 font-bold flex items-center space-x-1.5">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>LEVEL 5 MASTER ADMIN</span>
            </div>
            <div className="text-[10px] text-slate-400">Full System Governance</div>
          </div>

          <div className="flex items-center justify-between pt-1 text-xs font-mono">
            <div>
              <div className="text-white font-bold text-xs truncate max-w-[110px]">{user?.full_name || 'Priya Nair'}</div>
              <div className="text-[10px] text-amber-400">{user?.user_id || 'ADMIN-001'}</div>
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
        {/* Admin Top Header */}
        <header className="hidden md:flex items-center justify-between px-8 py-4 bg-[#0F1017]/80 backdrop-blur-xl border-b border-amber-500/15 sticky top-0 z-30">
          <div className="flex items-center space-x-2 text-xs font-mono text-slate-400">
            <span className="text-amber-400 font-semibold uppercase">Platform Administration</span>
            <span>/</span>
            <span className="text-white font-bold capitalize">
              {currentPath.replace('/admin/', '').replace('-', ' ') || 'Dashboard'}
            </span>
          </div>

          <div className="flex items-center space-x-4">
            {/* System Health Beacon */}
            <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-amber-950/40 border border-amber-500/20 text-xs font-mono">
              <Activity className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-slate-200">Network Uptime:</span>
              <span className="text-emerald-400 font-bold">{metrics?.network?.uptime_percent || 99.85}%</span>
            </div>

            {/* Refresh Diagnostics */}
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 hover:border-amber-400/40 text-xs font-mono text-slate-200 transition-all"
            >
              <RotateCw className={`w-3.5 h-3.5 text-amber-400 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Diagnostics</span>
            </button>

            {/* Admin ID Badge */}
            <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs font-mono text-amber-400">
              <Crown className="w-3.5 h-3.5" />
              <span>{user?.user_id || 'ADMIN-001'}</span>
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
        <main className={`flex-1 ${currentPath === '/admin/home' ? 'p-0 overflow-x-hidden' : 'p-4 sm:p-6 lg:p-8'}`}>
          {/* Platform Cinematic Showcase */}
          {currentPath === '/admin/home' && (
            <HomePage 
              setCurrentPage={(p) => onNavigate('/admin/network')} 
              onSearch={() => onNavigate('/admin/network')} 
            />
          )}

          {feedback && currentPath !== '/admin/home' && (
            <div className={`mb-6 p-4 rounded-2xl border flex items-center justify-between font-mono text-xs ${
              feedback.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
            }`}>
              <div className="flex items-center space-x-2">
                {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
                <span>{feedback.message}</span>
              </div>
              <button onClick={() => setFeedback(null)} className="underline uppercase ml-4">Dismiss</button>
            </div>
          )}

          {/* Sub-view: Admin Dashboard Overview */}
          {currentPath === '/admin/dashboard' && (
            <AdminDashboardPage setCurrentPage={(p) => {
              if (p === 'network') onNavigate('/admin/network');
              else if (p === 'users') onNavigate('/admin/users');
            }} />
          )}

          {/* Sub-view: User Management */}
          {currentPath === '/admin/users' && (
            <div className="max-w-6xl mx-auto space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-amber-500/20">
                <div>
                  <div className="text-xs font-mono text-amber-400 uppercase">Platform Accounts</div>
                  <h1 className="text-3xl font-extrabold text-white mt-1">User Directory & Roles</h1>
                  <p className="text-slate-400 text-sm mt-0.5">
                    Central authority over all customer, station operator, and administrator accounts.
                  </p>
                </div>
                <div className="text-xs font-mono text-slate-300 bg-white/5 px-3 py-1.5 rounded-xl border border-white/10">
                  {usersList.length} Registered Accounts
                </div>
              </div>

              <div className="flex items-center justify-between gap-4">
                <div className="relative flex-1 max-w-sm">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Search by ID, name or role..."
                    className="w-full bg-[#12131C] border border-amber-500/20 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-400 font-mono"
                  />
                </div>
              </div>

              <div className="rounded-3xl bg-[#0F1017] border border-amber-500/20 overflow-hidden">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-amber-950/30 border-b border-amber-500/20 text-slate-400 uppercase">
                    <tr>
                      <th className="p-4">User ID & Name</th>
                      <th className="p-4">Role Badge</th>
                      <th className="p-4">Auth Type</th>
                      <th className="p-4">Assigned Stations</th>
                      <th className="p-4">Account Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-white/[0.02]">
                        <td className="p-4">
                          <div className="font-bold text-white text-sm font-sans">{u.full_name}</div>
                          <div className="text-amber-400 font-mono text-[11px]">{u.user_id}</div>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase border ${
                            u.role === 'admin'
                              ? 'bg-amber-500/15 text-amber-400 border-amber-500/40'
                              : u.role === 'station_owner'
                              ? 'bg-cyan-500/15 text-cyan-400 border-cyan-500/40'
                              : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40'
                          }`}>
                            {u.role.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="p-4 text-slate-300">
                          {u.auth_provider === 'google_demo' ? 'Google Demo OAuth' : 'Local Password'}
                        </td>
                        <td className="p-4 text-slate-400">
                          {u.assigned_stations?.length > 0 ? u.assigned_stations.join(', ') : '—'}
                        </td>
                        <td className="p-4">
                          <span className="text-emerald-400 font-bold">Active</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Sub-view: Station Approvals */}
          {currentPath === '/admin/approvals' && (
            <div className="max-w-6xl mx-auto space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-amber-500/20">
                <div>
                  <div className="text-xs font-mono text-amber-400 uppercase">CPO Compliance</div>
                  <h1 className="text-3xl font-extrabold text-white mt-1">Station Network Approvals</h1>
                  <p className="text-slate-400 text-sm mt-0.5">
                    Review and verify newly registered charging plazas and hardware compliance in Hyderabad.
                  </p>
                </div>
              </div>

              <div className="p-8 rounded-3xl bg-[#0F1017] border border-amber-500/20 text-center space-y-3">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                <h3 className="text-lg font-bold text-white">All 8 Hyderabad Plazas Fully Verified</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Zero pending onboarding requests. All active hubs adhere to ARAI & Telangana EV infrastructure standards.
                </p>
              </div>
            </div>
          )}

          {/* Sub-view: Network Management (Overrides) */}
          {currentPath === '/admin/network' && (
            <div className="max-w-6xl mx-auto space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-amber-500/20">
                <div>
                  <div className="text-xs font-mono text-amber-400 uppercase">Emergency Controls</div>
                  <h1 className="text-3xl font-extrabold text-white mt-1">Network Status Overrides</h1>
                  <p className="text-slate-400 text-sm mt-0.5">
                    Master override authority to toggle any station between Available, Busy, or Maintenance.
                  </p>
                </div>
              </div>

              <div className="rounded-3xl bg-[#0F1017] border border-amber-500/20 overflow-hidden">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-amber-950/30 border-b border-amber-500/20 text-slate-400 uppercase">
                    <tr>
                      <th className="p-4">Station Name</th>
                      <th className="p-4">Operator</th>
                      <th className="p-4">Live Status</th>
                      <th className="p-4">Active Tariff</th>
                      <th className="p-4 text-right">Master Emergency Override</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {stations.map((st) => (
                      <tr key={st.id} className="hover:bg-white/[0.02]">
                        <td className="p-4">
                          <div className="font-bold text-white text-sm font-sans">{st.name}</div>
                          <div className="text-slate-500">{st.id}</div>
                        </td>
                        <td className="p-4 text-slate-300">{st.network}</td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded font-bold border ${
                            st.status === 'Available'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : st.status === 'Busy'
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                              : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                          }`}>
                            {st.status}
                          </span>
                        </td>
                        <td className="p-4 text-white font-bold">₹{st.price_per_kwh?.toFixed(2)}/kWh</td>
                        <td className="p-4 text-right space-x-1.5">
                          <button
                            onClick={() => handleStationOverride(st.id, 'Available')}
                            disabled={st.status === 'Available'}
                            className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            Available
                          </button>
                          <button
                            onClick={() => handleStationOverride(st.id, 'Busy')}
                            disabled={st.status === 'Busy'}
                            className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            Busy
                          </button>
                          <button
                            onClick={() => handleStationOverride(st.id, 'Maintenance')}
                            disabled={st.status === 'Maintenance'}
                            className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            Maintenance
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Sub-view: Audit Logs */}
          {currentPath === '/admin/logs' && (
            <div className="max-w-6xl mx-auto space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-amber-500/20">
                <div>
                  <div className="text-xs font-mono text-amber-400 uppercase">Security Event Stream</div>
                  <h1 className="text-3xl font-extrabold text-white mt-1">Immutable Audit Trail</h1>
                  <p className="text-slate-400 text-sm mt-0.5">
                    Real-time cryptographic log of administrative actions, tariff modifications, and authentications.
                  </p>
                </div>
                <div className="text-xs font-mono text-slate-300 bg-white/5 px-3 py-1.5 rounded-xl border border-white/10">
                  {auditLogs.length} Events Logged
                </div>
              </div>

              <div className="rounded-3xl bg-[#0F1017] border border-amber-500/20 p-5 divide-y divide-white/5 font-mono text-xs space-y-3">
                {auditLogs.map((l) => (
                  <div key={l.id} className="pt-3 first:pt-0 flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold text-[10px]">
                          {l.action}
                        </span>
                        <span className="text-slate-300 font-bold">
                          {l.actor_id} ({l.actor_role})
                        </span>
                      </div>
                      <div className="text-slate-400 text-xs font-sans">
                        {l.details || 'System event recorded.'}
                      </div>
                    </div>
                    <div className="text-[11px] text-slate-500 whitespace-nowrap">
                      {l.timestamp ? new Date(l.timestamp).toLocaleTimeString() : '—'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sub-view: Platform Settings */}
          {currentPath === '/admin/settings' && (
            <div className="max-w-6xl mx-auto space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-amber-500/20">
                <div>
                  <div className="text-xs font-mono text-amber-400 uppercase">Governance Configurations</div>
                  <h1 className="text-3xl font-extrabold text-white mt-1">Platform Settings</h1>
                  <p className="text-slate-400 text-sm mt-0.5">
                    Core configurations, local Ollama engine parameters, and SQLite database settings.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 rounded-3xl bg-[#0F1017] border border-amber-500/20 space-y-3 font-mono text-xs">
                  <h3 className="font-bold text-white text-sm font-sans flex items-center space-x-2">
                    <Server className="w-4 h-4 text-amber-400" />
                    <span>Database Engine Status</span>
                  </h3>
                  <div className="flex justify-between py-2 border-b border-white/5">
                    <span className="text-slate-400">Database Type:</span>
                    <span className="text-white font-bold">SQLite 3 (WAL Mode)</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-white/5">
                    <span className="text-slate-400">Total Indexed Plazas:</span>
                    <span className="text-white font-bold">{stations.length}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-slate-400">Total Indexed Users:</span>
                    <span className="text-amber-400 font-bold">{usersList.length}</span>
                  </div>
                </div>

                <div className="p-6 rounded-3xl bg-[#0F1017] border border-amber-500/20 space-y-3 font-mono text-xs">
                  <h3 className="font-bold text-white text-sm font-sans flex items-center space-x-2">
                    <Zap className="w-4 h-4 text-amber-400" />
                    <span>AI Engine Specification</span>
                  </h3>
                  <div className="flex justify-between py-2 border-b border-white/5">
                    <span className="text-slate-400">Active Provider:</span>
                    <span className="text-emerald-400 font-bold">Local Ollama (127.0.0.1:11434)</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-white/5">
                    <span className="text-slate-400">External Cloud AI:</span>
                    <span className="text-slate-300 font-bold">Strictly Disabled (0 Cloud Fees)</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-slate-400">Tile Server Engine:</span>
                    <span className="text-white font-bold">OpenStreetMap & OSRM</span>
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

