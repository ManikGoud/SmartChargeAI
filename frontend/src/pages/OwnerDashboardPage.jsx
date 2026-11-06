import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Zap, 
  TrendingUp, 
  Activity, 
  Sliders, 
  CheckCircle2, 
  AlertCircle, 
  RotateCw, 
  Clock, 
  ShieldCheck, 
  DollarSign, 
  Car, 
  PlugZap,
  ArrowUpRight,
  MapPin,
  Lock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { 
  fetchOwnerStations, 
  updateOwnerTariff, 
  updateOwnerPortStatus, 
  fetchOwnerAnalytics 
} from '../services/api';

/**
 * @param {{
 *   setCurrentPage: (page: string) => void;
 * }} props
 */
export function OwnerDashboardPage({ setCurrentPage }) {
  const { user, openLoginModal } = useAuth();
  const [stations, setStations] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editingTariffId, setEditingTariffId] = useState(null);
  const [tariffInput, setTariffInput] = useState('');
  const [actionFeedback, setActionFeedback] = useState(null);

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
      setActionFeedback({ type: 'error', message: 'Please enter a valid price in ₹/kWh.' });
      return;
    }

    const price = parseFloat(tariffInput);
    const res = await updateOwnerTariff(stationId, price, `Updated by Owner at ${new Date().toLocaleTimeString()}`);
    
    if (res.success) {
      setActionFeedback({ type: 'success', message: `Tariff updated to ₹${price.toFixed(2)}/kWh.` });
      setEditingTariffId(null);
      setTariffInput('');
      await loadData();
    } else {
      setActionFeedback({ type: 'error', message: res.error || 'Failed to update tariff.' });
    }
  };

  const handlePortAdjust = async (stationId, plugType, currentAvail, delta, totalCount) => {
    const newAvail = currentAvail + delta;
    if (newAvail < 0 || newAvail > totalCount) return;

    const res = await updateOwnerPortStatus(stationId, plugType, newAvail);
    if (res.success) {
      setActionFeedback({ 
        type: 'success', 
        message: `${plugType} availability updated to ${newAvail}/${totalCount}.` 
      });
      await loadData();
    } else {
      setActionFeedback({ type: 'error', message: res.error || 'Failed to update port status.' });
    }
  };

  // If unauthorized or not station owner / admin
  if (user && user.role !== 'station_owner' && user.role !== 'admin') {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-3xl font-extrabold text-white">Station Owner Console Restricted</h2>
        <p className="text-slate-400 max-w-md mx-auto">
          You are currently signed in as <strong>{user.full_name} ({user.role})</strong>. This console requires Station Owner authorization.
        </p>
        <button
          onClick={() => openLoginModal('station_owner')}
          className="px-6 py-3 rounded-xl bg-[#00FF66] text-black font-bold uppercase font-mono tracking-wider text-xs hover:bg-[#00FF66]/90 transition-all shadow-[0_0_20px_rgba(0,255,102,0.3)]"
        >
          Sign In with Owner ID (OWNER-501)
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Console Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/5">
        <div>
          <div className="flex items-center space-x-2 text-xs font-mono text-[#00FF66] mb-1.5">
            <Building2 className="w-4 h-4" />
            <span>CHARGE POINT OPERATOR (CPO) CONSOLE</span>
            <span className="px-2 py-0.5 rounded bg-[#00FF66]/10 border border-[#00FF66]/30 text-[#00FF66] font-bold">
              {user?.user_id || 'OWNER-501'}
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Station Owner Management
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Real-time control over managed charging plazas, live port occupancy, dynamic tariffs, and revenue metrics.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:border-[#00FF66]/30 text-slate-200 text-xs font-mono font-bold transition-all hover:text-[#00FF66]"
          >
            <RotateCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-[#00FF66]' : ''}`} />
            <span>Sync Live Telemetry</span>
          </button>
          <button
            onClick={() => setCurrentPage('discovery')}
            className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-[#00FF66] text-black font-bold hover:bg-[#00FF66]/90 transition-all text-xs font-mono uppercase tracking-wider shadow-[0_0_20px_rgba(0,255,102,0.3)]"
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>View on Map</span>
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
            {actionFeedback.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
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

      {/* Operator Analytics Grid */}
      {analytics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-panel-glow rounded-3xl p-5 border border-white/10">
            <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2">
              <span>MANAGED PLAZAS</span>
              <Building2 className="w-4 h-4 text-[#00FF66]" />
            </div>
            <div className="text-3xl font-extrabold text-white font-mono">
              {analytics.managed_stations_count}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Hyderabad Metro Area
            </div>
          </div>

          <div className="glass-panel-glow rounded-3xl p-5 border border-white/10">
            <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2">
              <span>PORT UTILIZATION</span>
              <Activity className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-3xl font-extrabold text-white font-mono">
              {analytics.utilization_rate}%
            </div>
            <div className="text-xs text-slate-400 mt-1 flex items-center space-x-1">
              <span className="text-[#00FF66] font-semibold">{analytics.occupied_ports} in-use</span>
              <span>/ {analytics.total_ports} total bays</span>
            </div>
          </div>

          <div className="glass-panel-glow rounded-3xl p-5 border border-white/10">
            <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2">
              <span>ENERGY DISPENSED (TODAY)</span>
              <Zap className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-3xl font-extrabold text-white font-mono">
              {analytics.total_kwh_dispensed} <span className="text-sm text-slate-400">kWh</span>
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Fast DC + Destination AC
            </div>
          </div>

          <div className="glass-panel-glow rounded-3xl p-5 border border-white/10">
            <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2">
              <span>EST. DAILY REVENUE</span>
              <DollarSign className="w-4 h-4 text-[#00FF66]" />
            </div>
            <div className="text-3xl font-extrabold text-[#00FF66] font-mono">
              ₹{analytics.total_revenue_inr.toLocaleString()}
            </div>
            <div className="text-xs text-slate-400 mt-1 flex items-center space-x-1">
              <TrendingUp className="w-3.5 h-3.5 text-[#00FF66]" />
              <span>Real-time tariff telemetry</span>
            </div>
          </div>
        </div>
      )}

      {/* Managed Stations List */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center space-x-2">
            <span>Assigned Charging Plazas</span>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-white/10 text-slate-300">
              {stations.length} Active
            </span>
          </h2>
          <span className="text-xs text-slate-400 font-mono">
            Owner ID: {user?.user_id}
          </span>
        </div>

        {loading ? (
          <div className="text-center py-16 text-slate-400 font-mono text-sm animate-pulse">
            Loading station hardware telemetry...
          </div>
        ) : stations.length === 0 ? (
          <div className="text-center py-16 glass-panel-glow rounded-3xl border border-white/10 p-8">
            <Building2 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white">No stations assigned to this account</h3>
            <p className="text-sm text-slate-400 mt-1">
              Please contact the platform administrator to assign charging infrastructure to your ID.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {stations.map((st) => (
              <div 
                key={st.id} 
                className="glass-panel-glow rounded-3xl p-6 sm:p-8 border border-white/10 hover:border-[#00FF66]/30 transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-mono font-bold text-[#00FF66] uppercase tracking-wider">
                          {st.network}
                        </span>
                        <span className="text-xs text-slate-500 font-mono">
                          ID: {st.id}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-white mt-1">
                        {st.name}
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5 flex items-center space-x-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span className="truncate">{st.address}</span>
                      </p>
                    </div>

                    <span className={`px-2.5 py-1 rounded-full text-xs font-mono font-bold border ${
                      st.status === 'Available'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : st.status === 'Busy'
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                    }`}>
                      {st.status}
                    </span>
                  </div>

                  {/* Tariff Control Section */}
                  <div className="my-5 p-4 rounded-2xl bg-white/5 border border-white/5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-mono text-slate-400 flex items-center space-x-1.5">
                        <DollarSign className="w-3.5 h-3.5 text-[#00FF66]" />
                        <span>Active Tariff Rate</span>
                      </span>
                      {editingTariffId === st.id ? (
                        <button
                          onClick={() => setEditingTariffId(null)}
                          className="text-xs font-mono text-slate-400 hover:text-white"
                        >
                          Cancel
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingTariffId(st.id);
                            setTariffInput(st.price_per_kwh.toString());
                          }}
                          className="text-xs font-mono text-[#00FF66] hover:underline flex items-center space-x-1"
                        >
                          <Sliders className="w-3 h-3" />
                          <span>Adjust Price</span>
                        </button>
                      )}
                    </div>

                    {editingTariffId === st.id ? (
                      <div className="flex items-center space-x-2 mt-2">
                        <div className="relative flex-1">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-sm">₹</span>
                          <input
                            type="number"
                            step="0.5"
                            value={tariffInput}
                            onChange={(e) => setTariffInput(e.target.value)}
                            placeholder="e.g. 19.50"
                            className="w-full bg-dark-900 border border-[#00FF66]/40 rounded-xl pl-8 pr-3 py-1.5 text-sm text-white font-mono focus:outline-none focus:border-[#00FF66]"
                          />
                        </div>
                        <button
                          onClick={() => handleUpdatePrice(st.id)}
                          className="px-4 py-2 rounded-xl bg-[#00FF66] text-black font-bold text-xs uppercase font-mono tracking-wider hover:bg-[#00FF66]/90 transition-all"
                        >
                          Save
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-baseline justify-between">
                        <div className="text-2xl font-extrabold text-white font-mono">
                          ₹{st.price_per_kwh.toFixed(2)} <span className="text-xs text-slate-400 font-normal">/ kWh</span>
                        </div>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {st.pricing_note || 'Standard operator tariff'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Connectors & Port Management */}
                  <div className="space-y-3">
                    <div className="text-xs font-mono text-slate-400 uppercase tracking-wider flex items-center justify-between">
                      <span>Charging Bays & Availability</span>
                      <span className="text-slate-300 font-semibold">{st.available_ports} of {st.total_ports} Available</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {st.connectors.map((c) => (
                        <div 
                          key={c.id} 
                          className="p-3 rounded-2xl bg-dark-900/60 border border-white/5 flex flex-col justify-between space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-white flex items-center space-x-1.5">
                              <PlugZap className="w-3.5 h-3.5 text-cyan-400" />
                              <span>{c.plug_type}</span>
                            </span>
                            <span className="text-xs font-mono text-amber-400 font-semibold">
                              {c.power_kw} kW
                            </span>
                          </div>

                          <div className="flex items-center justify-between pt-1 border-t border-white/5">
                            <div className="text-xs font-mono text-slate-300">
                              <strong className="text-[#00FF66]">{c.available}</strong> / {c.count} Available
                            </div>
                            <div className="flex items-center space-x-1">
                              <button
                                onClick={() => handlePortAdjust(st.id, c.plug_type, c.available, -1, c.count)}
                                disabled={c.available <= 0}
                                title="Simulate vehicle plugged in"
                                className="w-6 h-6 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed text-xs font-mono text-slate-200 flex items-center justify-center border border-white/10"
                              >
                                -
                              </button>
                              <button
                                onClick={() => handlePortAdjust(st.id, c.plug_type, c.available, 1, c.count)}
                                disabled={c.available >= c.count}
                                title="Simulate vehicle departure / bay freed"
                                className="w-6 h-6 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed text-xs font-mono text-slate-200 flex items-center justify-center border border-white/10"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Footer status */}
                <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-xs text-slate-400 font-mono">
                  <span>Operating: {st.operating_hours}</span>
                  <span className="text-[#00FF66] flex items-center space-x-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Owner Verified</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

