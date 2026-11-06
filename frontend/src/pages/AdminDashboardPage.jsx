import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  Users, 
  Server, 
  Activity, 
  RotateCw, 
  CheckCircle2, 
  AlertTriangle, 
  Building2, 
  User, 
  Sliders, 
  Clock, 
  Lock, 
  FileText,
  Search,
  Zap,
  Check,
  Ban
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { 
  fetchAdminMetrics, 
  fetchAdminUsers, 
  fetchAdminAuditLogs, 
  overrideStationStatus,
  fetchStations
} from '../services/api';

/**
 * @param {{
 *   setCurrentPage: (page: string) => void;
 * }} props
 */
export function AdminDashboardPage({ setCurrentPage }) {
  const { user, openLoginModal } = useAuth();
  const [metrics, setMetrics] = useState(null);
  const [usersList, setUsersList] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionFeedback, setActionFeedback] = useState(null);
  const [userSearch, setUserSearch] = useState('');
  const [activeTab, setActiveTab] = useState('stations'); // 'stations' | 'users' | 'logs'

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
      setActionFeedback({
        type: 'success',
        message: `Station ${res.data.station_name} status set to ${newStatus}.`
      });
      await loadAll();
    } else {
      setActionFeedback({
        type: 'error',
        message: res.error || 'Failed to override station status.'
      });
    }
  };

  // If not admin
  if (user && user.role !== 'admin') {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center mx-auto text-purple-400">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-3xl font-extrabold text-white">Administrator Access Required</h2>
        <p className="text-slate-400 max-w-md mx-auto">
          You are currently signed in as <strong>{user.full_name} ({user.role})</strong>. The Command Center requires authorized Administrator credentials.
        </p>
        <button
          onClick={() => openLoginModal('admin')}
          className="px-6 py-3 rounded-xl bg-purple-600 text-white font-bold uppercase font-mono tracking-wider text-xs hover:bg-purple-500 transition-all shadow-[0_0_20px_rgba(168,85,247,0.3)]"
        >
          Sign In with Admin ID (ADMIN-001)
        </button>
      </div>
    );
  }

  const filteredUsers = usersList.filter(u => 
    u.full_name.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.user_id.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.role.toLowerCase().includes(userSearch.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Admin Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/5">
        <div>
          <div className="flex items-center space-x-2 text-xs font-mono text-purple-400 mb-1.5">
            <ShieldAlert className="w-4 h-4" />
            <span>PLATFORM ADMINISTRATOR COMMAND CENTER</span>
            <span className="px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/30 text-purple-400 font-bold">
              {user?.user_id || 'ADMIN-001'}
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            System Administration
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Global infrastructure monitoring, account authorization, emergency station overrides, and security audit stream.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:border-purple-500/30 text-slate-200 text-xs font-mono font-bold transition-all hover:text-purple-400"
          >
            <RotateCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-purple-400' : ''}`} />
            <span>Refresh Diagnostics</span>
          </button>
        </div>
      </div>

      {/* Action Feedback Banner */}
      {actionFeedback && (
        <div className={`p-4 rounded-2xl border flex items-center justify-between animate-in fade-in ${
          actionFeedback.type === 'success' 
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
            : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
        }`}>
          <div className="flex items-center space-x-3">
            {actionFeedback.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertTriangle className="w-5 h-5 shrink-0" />}
            <span className="text-sm font-medium">{actionFeedback.message}</span>
          </div>
          <button 
            onClick={() => setActionFeedback(null)} 
            className="text-xs hover:underline uppercase font-mono tracking-wider ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Metrics Row */}
      {metrics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-panel-glow rounded-3xl p-5 border border-white/10">
            <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2">
              <span>REGISTERED ACCOUNTS</span>
              <Users className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-3xl font-extrabold text-white font-mono">
              {metrics.users.total}
            </div>
            <div className="text-xs text-slate-400 mt-1 flex space-x-2 font-mono">
              <span className="text-cyan-400">{metrics.users.customers} Cust</span>
              <span>•</span>
              <span className="text-[#00FF66]">{metrics.users.station_owners} Owners</span>
              <span>•</span>
              <span className="text-purple-400">{metrics.users.administrators} Admin</span>
            </div>
          </div>

          <div className="glass-panel-glow rounded-3xl p-5 border border-white/10">
            <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2">
              <span>NETWORK STATIONS</span>
              <Building2 className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-3xl font-extrabold text-white font-mono">
              {metrics.network.total_stations}
            </div>
            <div className="text-xs text-slate-400 mt-1 flex items-center space-x-1.5">
              <span className="text-emerald-400 font-semibold">{metrics.network.available_ports}</span>
              <span>of {metrics.network.total_ports} ports available</span>
            </div>
          </div>

          <div className="glass-panel-glow rounded-3xl p-5 border border-white/10">
            <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2">
              <span>SYSTEM UPTIME</span>
              <Activity className="w-4 h-4 text-[#00FF66]" />
            </div>
            <div className="text-3xl font-extrabold text-[#00FF66] font-mono">
              {metrics.network.uptime_percent}%
            </div>
            <div className="text-xs text-slate-400 mt-1 font-mono">
              FastAPI + SQLite WAL Engine
            </div>
          </div>

          <div className="glass-panel-glow rounded-3xl p-5 border border-white/10">
            <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2">
              <span>SECURITY AUDIT EVENTS</span>
              <FileText className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-3xl font-extrabold text-amber-400 font-mono">
              {metrics.database.total_audit_events}
            </div>
            <div className="text-xs text-slate-400 mt-1 font-mono">
              Role & Tariff Modifications
            </div>
          </div>
        </div>
      )}

      {/* Command Center Tabs */}
      <div className="space-y-6">
        <div className="flex border-b border-white/10 gap-6 text-sm font-mono">
          <button
            onClick={() => setActiveTab('stations')}
            className={`pb-3 font-semibold transition-all flex items-center space-x-2 ${
              activeTab === 'stations'
                ? 'border-b-2 border-purple-500 text-purple-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Station Overrides ({stations.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`pb-3 font-semibold transition-all flex items-center space-x-2 ${
              activeTab === 'users'
                ? 'border-b-2 border-purple-500 text-purple-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>User Directory ({usersList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('logs')}
            className={`pb-3 font-semibold transition-all flex items-center space-x-2 ${
              activeTab === 'logs'
                ? 'border-b-2 border-purple-500 text-purple-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Audit Stream ({auditLogs.length})</span>
          </button>
        </div>

        {/* Tab 1: Station Overrides */}
        {activeTab === 'stations' && (
          <div className="space-y-4">
            <div className="text-xs text-slate-400 font-mono flex items-center justify-between">
              <span>ADMINISTRATIVE STATUS CONTROLS</span>
              <span>Emergency status toggles apply instantly across the network</span>
            </div>

            <div className="glass-panel-glow rounded-3xl border border-white/10 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-white/5 border-b border-white/10 text-slate-400 font-mono uppercase tracking-wider">
                    <tr>
                      <th className="p-4">Station Details</th>
                      <th className="p-4">Network / Operator</th>
                      <th className="p-4">Current Status</th>
                      <th className="p-4">Tariff</th>
                      <th className="p-4">Ports</th>
                      <th className="p-4 text-right">Master Override</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {stations.map((st) => (
                      <tr key={st.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="p-4">
                          <div className="font-bold text-white text-sm">{st.name}</div>
                          <div className="text-[11px] text-slate-500 font-mono">ID: {st.id}</div>
                        </td>
                        <td className="p-4 text-slate-300">
                          <div>{st.network}</div>
                          <div className="text-[11px] text-slate-500">{st.operator}</div>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded font-mono font-bold text-[11px] border ${
                            st.status === 'Available'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : st.status === 'Busy'
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                              : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                          }`}>
                            {st.status}
                          </span>
                        </td>
                        <td className="p-4 font-mono font-semibold text-slate-200">
                          ₹{st.price_per_kwh?.toFixed(2)} / kWh
                        </td>
                        <td className="p-4 font-mono text-slate-300">
                          {st.available_ports} / {st.total_ports}
                        </td>
                        <td className="p-4 text-right space-x-1.5">
                          <button
                            onClick={() => handleStationOverride(st.id, 'Available')}
                            disabled={st.status === 'Available'}
                            className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono text-[11px] disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Force Available"
                          >
                            Available
                          </button>
                          <button
                            onClick={() => handleStationOverride(st.id, 'Busy')}
                            disabled={st.status === 'Busy'}
                            className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 font-mono text-[11px] disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Force Busy"
                          >
                            Busy
                          </button>
                          <button
                            onClick={() => handleStationOverride(st.id, 'Maintenance')}
                            disabled={st.status === 'Maintenance'}
                            className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 font-mono text-[11px] disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Force Maintenance"
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
          </div>
        )}

        {/* Tab 2: User Directory */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Filter by name, ID, or role..."
                  className="w-full bg-dark-900 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-500 font-mono"
                />
              </div>
              <span className="text-xs text-slate-400 font-mono">
                {filteredUsers.length} accounts found
              </span>
            </div>

            <div className="glass-panel-glow rounded-3xl border border-white/10 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-white/5 border-b border-white/10 text-slate-400 font-mono uppercase tracking-wider">
                    <tr>
                      <th className="p-4">User ID & Name</th>
                      <th className="p-4">Assigned Role</th>
                      <th className="p-4">Auth Provider</th>
                      <th className="p-4">Managed Plazas</th>
                      <th className="p-4">Account Status</th>
                      <th className="p-4">Created Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="p-4">
                          <div className="font-bold text-white font-mono text-sm">{u.user_id}</div>
                          <div className="text-slate-400">{u.full_name}</div>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded font-mono font-bold text-[11px] uppercase border ${
                            u.role === 'admin'
                              ? 'bg-purple-500/15 text-purple-400 border-purple-500/30'
                              : u.role === 'station_owner'
                              ? 'bg-[#00FF66]/15 text-[#00FF66] border-[#00FF66]/30'
                              : 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30'
                          }`}>
                            {u.role.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="p-4 font-mono text-slate-300">
                          {u.auth_provider === 'google_demo' ? (
                            <span className="text-amber-400 flex items-center space-x-1">
                              <span>Google Demo OAuth</span>
                            </span>
                          ) : (
                            <span>Local Password</span>
                          )}
                        </td>
                        <td className="p-4 font-mono text-slate-400">
                          {u.assigned_stations && u.assigned_stations.length > 0 ? (
                            <span className="text-emerald-400 font-semibold">{u.assigned_stations.join(', ')}</span>
                          ) : (
                            <span className="text-slate-600">—</span>
                          )}
                        </td>
                        <td className="p-4">
                          <span className="flex items-center space-x-1 text-emerald-400 font-mono">
                            <Check className="w-3.5 h-3.5" />
                            <span>Active</span>
                          </span>
                        </td>
                        <td className="p-4 font-mono text-slate-500 text-[11px]">
                          {u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Security & Operational Audit Log */}
        {activeTab === 'logs' && (
          <div className="space-y-4">
            <div className="text-xs text-slate-400 font-mono">
              SECURITY AUDIT LOGS (IMMUTABLE DATABASE EVENTS)
            </div>

            <div className="glass-panel-glow rounded-3xl border border-white/10 p-4 divide-y divide-white/5 space-y-3 font-mono text-xs">
              {auditLogs.map((log) => (
                <div key={log.id} className="pt-3 first:pt-0 flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.5 rounded bg-white/10 text-white font-bold text-[10px]">
                        {log.action}
                      </span>
                      <span className="text-purple-400 font-semibold">
                        {log.actor_id} ({log.actor_role})
                      </span>
                    </div>
                    <div className="text-slate-300 text-xs font-sans">
                      {log.details || 'System event executed.'}
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-500 whitespace-nowrap">
                    {log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : '—'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

