import React, { useState, useEffect, useMemo } from 'react';
import { 
  DollarSign, 
  Clock, 
  Zap, 
  TrendingDown, 
  Car, 
  CheckCircle2, 
  ShieldAlert, 
  SlidersHorizontal,
  Info,
  ArrowUpDown,
  Award
} from 'lucide-react';
import { useVehicle } from '../context/VehicleContext';
import { useStations } from '../context/StationContext';
import { calculateChargingCost } from '../services/api';
import { Badge, DemoDataBadge } from '../components/Badge';

export function CostComparisonPage({ setCurrentPage }) {
  const { activeVehicle, currentSoC, vehicles, selectVehicle } = useVehicle();
  const { stations } = useStations();

  // Inputs
  const [startSoC, setStartSoC] = useState(20);
  const [targetSoC, setTargetSoC] = useState(80);
  const [sortBy, setSortBy] = useState('cost'); // 'cost', 'time', 'power', 'price'

  // Computed energy required (kWh)
  const capacity = activeVehicle?.batteryCapacity || 72.0;
  const energyRequired = useMemo(() => {
    const delta = Math.max(0, targetSoC - startSoC);
    return Math.round((capacity * delta) / 100 * 10) / 10;
  }, [capacity, startSoC, targetSoC]);

  // Non-linear CC-CV Charging calculation helper
  const computeStationSession = (station) => {
    const isCompatible = activeVehicle
      ? station.connectors?.some(c => activeVehicle.connectors.includes(c.type || c.plug_type))
      : true;

    const matchingPlugs = station.connectors?.filter(c => 
      activeVehicle ? activeVehicle.connectors.includes(c.type || c.plug_type) : true
    ) || [];

    const stationMaxKw = matchingPlugs.length > 0 
      ? Math.max(...matchingPlugs.map(c => c.powerKw || c.power_kw))
      : station.peakPowerKw;

    const effectiveKw = Math.min(stationMaxKw, activeVehicle?.maxChargingSpeed || 150.0);

    // Cost
    const totalCost = Math.round(energyRequired * station.pricePerKwh * 100) / 100;

    // Time (CC-CV Model)
    let totalMinutes = 0;
    const bulkStart = Math.min(startSoC, 80);
    const bulkEnd = Math.min(targetSoC, 80);
    if (bulkEnd > bulkStart) {
      const bulkKwh = (capacity * (bulkEnd - bulkStart)) / 100;
      totalMinutes += (bulkKwh / (effectiveKw * 0.92)) * 60;
    }
    if (targetSoC > 80) {
      const taperStart = Math.max(startSoC, 80);
      const taperKwh = (capacity * (targetSoC - taperStart)) / 100;
      const taperKw = Math.min(effectiveKw * 0.35, 25.0);
      totalMinutes += (taperKwh / (taperKw * 0.90)) * 60;
    }

    return {
      station,
      isCompatible,
      effectiveKw,
      totalCost,
      totalMinutes: Math.max(5, Math.ceil(totalMinutes)),
      pricePerKwh: station.pricePerKwh
    };
  };

  const comparisons = useMemo(() => {
    return stations.map(computeStationSession).sort((a, b) => {
      if (sortBy === 'cost') return a.totalCost - b.totalCost;
      if (sortBy === 'time') return a.totalMinutes - b.totalMinutes;
      if (sortBy === 'power') return b.effectiveKw - a.effectiveKw;
      if (sortBy === 'price') return a.pricePerKwh - b.pricePerKwh;
      return 0;
    });
  }, [stations, activeVehicle, energyRequired, startSoC, targetSoC, sortBy]);

  // Identify Best in class
  const cheapestSession = useMemo(() => {
    const comp = comparisons.filter(c => c.isCompatible);
    return comp.length > 0 ? comp.reduce((min, c) => c.totalCost < min.totalCost ? c : min, comp[0]) : null;
  }, [comparisons]);

  const fastestSession = useMemo(() => {
    const comp = comparisons.filter(c => c.isCompatible);
    return comp.length > 0 ? comp.reduce((min, c) => c.totalMinutes < min.totalMinutes ? c : min, comp[0]) : null;
  }, [comparisons]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/5">
        <div>
          <div className="flex items-center space-x-2 text-xs font-mono text-brand-cyan mb-1.5">
            <DollarSign className="w-4 h-4" />
            <span>SESSION TARIFF & CHARGING SPEED MATRIX</span>
            <DemoDataBadge />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Charging Cost & Duration Comparison
          </h1>
          <p className="text-slate-400 text-sm mt-1 max-w-2xl">
            Compare public charging plazas in Hyderabad side-by-side using real-world CC-CV non-linear charging physics and station-specific tariffs.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setCurrentPage('discovery')}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:border-brand-cyan/30 text-xs font-mono text-slate-300 hover:text-white"
          >
            <span>Open Station Map →</span>
          </button>
        </div>
      </div>

      {/* Control Panel: Vehicle & Range Sliders */}
      <div className="glass-panel-glow rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-6 border-b border-white/5">
          {/* Vehicle Switcher */}
          <div className="space-y-1 flex-1">
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">Benchmark Vehicle</span>
            <div className="flex items-center space-x-3">
              <select
                value={activeVehicle?.id}
                onChange={e => selectVehicle(e.target.value)}
                className="bg-dark-950 text-white font-bold border border-brand-cyan/30 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-brand-cyan"
              >
                {vehicles.map(v => (
                  <option key={v.id} value={v.id}>
                    {v.make} {v.model} ({v.batteryCapacity} kWh • Max {v.maxChargingSpeed} kW)
                  </option>
                ))}
              </select>
              <span className="text-xs font-mono text-emerald-400 hidden sm:inline">
                ● Max Rate: {activeVehicle?.maxChargingSpeed} kW DC
              </span>
            </div>
          </div>

          {/* Energy Summary Card */}
          <div className="flex items-center space-x-4 bg-dark-950/80 px-5 py-3 rounded-2xl border border-white/10">
            <div>
              <span className="text-[10px] font-mono text-slate-500 uppercase block">ENERGY REQUIRED</span>
              <span className="text-2xl font-black font-mono text-brand-cyan">{energyRequired} kWh</span>
            </div>
            <div className="text-xs font-mono text-slate-400 pl-4 border-l border-white/10">
              <span>Delta: </span>
              <strong className="text-white">{startSoC}% → {targetSoC}%</strong> ({targetSoC - startSoC}% SoC)
            </div>
          </div>
        </div>

        {/* Dual Sliders: Start SoC and Target SoC */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono text-xs">
          {/* Start SoC */}
          <div className="bg-dark-950/60 p-4 rounded-2xl border border-white/5 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Starting Battery Level:</span>
              <span className="text-brand-cyan font-bold text-sm">{startSoC}%</span>
            </div>
            <input
              type="range"
              min="5"
              max="75"
              value={startSoC}
              onChange={e => {
                const val = Number(e.target.value);
                setStartSoC(val);
                if (val >= targetSoC) setTargetSoC(Math.min(100, val + 10));
              }}
              className="w-full h-2 bg-dark-800 rounded-lg appearance-none cursor-pointer accent-brand-cyan"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>5% (Deep Reserve)</span>
              <span>75%</span>
            </div>
          </div>

          {/* Target SoC */}
          <div className="bg-dark-950/60 p-4 rounded-2xl border border-white/5 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Target Unplug Level:</span>
              <span className="text-emerald-400 font-bold text-sm">{targetSoC}%</span>
            </div>
            <input
              type="range"
              min="20"
              max="100"
              value={targetSoC}
              onChange={e => {
                const val = Number(e.target.value);
                setTargetSoC(val);
                if (val <= startSoC) setStartSoC(Math.max(5, val - 10));
              }}
              className="w-full h-2 bg-dark-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>20%</span>
              <span className={targetSoC > 80 ? 'text-amber-400 font-bold' : 'text-slate-400'}>
                {targetSoC > 80 ? '⚠️ Taper saturation active past 80%' : '80% (Fast Charge Sweet-spot)'}
              </span>
              <span>100% (Full)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Best in Class Highlights Strip */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Cheapest Card */}
        {cheapestSession && (
          <div className="glass-panel p-6 rounded-3xl border border-emerald-500/30 bg-emerald-500/5 relative overflow-hidden">
            <div className="flex items-start justify-between mb-4">
              <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                <Award className="w-3.5 h-3.5" />
                <span>CHEAPEST SESSION</span>
              </span>
              <span className="text-2xl font-black font-mono text-emerald-400">
                ₹{cheapestSession.totalCost.toFixed(2)}
              </span>
            </div>
            <h4 className="text-lg font-bold text-white mb-1">{cheapestSession.station.name}</h4>
            <div className="text-xs text-slate-400 mb-3">{cheapestSession.station.address}</div>
            <div className="flex items-center space-x-4 text-xs font-mono text-slate-300 pt-3 border-t border-white/5">
              <span>Tariff: <strong className="text-white">₹{cheapestSession.pricePerKwh}/kWh</strong></span>
              <span>•</span>
              <span>Est. Time: <strong className="text-white">{cheapestSession.totalMinutes} mins</strong></span>
              <span>•</span>
              <span className="text-emerald-400">Save up to ₹{(comparisons[comparisons.length - 1].totalCost - cheapestSession.totalCost).toFixed(0)}</span>
            </div>
          </div>
        )}

        {/* Fastest Card */}
        {fastestSession && (
          <div className="glass-panel p-6 rounded-3xl border border-brand-cyan/30 bg-brand-cyan/5 relative overflow-hidden">
            <div className="flex items-start justify-between mb-4">
              <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-brand-cyan/20 text-brand-cyan border border-brand-cyan/40">
                <Zap className="w-3.5 h-3.5" />
                <span>FASTEST SESSION</span>
              </span>
              <span className="text-2xl font-black font-mono text-brand-cyan">
                {fastestSession.totalMinutes} mins
              </span>
            </div>
            <h4 className="text-lg font-bold text-white mb-1">{fastestSession.station.name}</h4>
            <div className="text-xs text-slate-400 mb-3">{fastestSession.station.address}</div>
            <div className="flex items-center space-x-4 text-xs font-mono text-slate-300 pt-3 border-t border-white/5">
              <span>Effective Power: <strong className="text-brand-cyan">{fastestSession.effectiveKw} kW DC</strong></span>
              <span>•</span>
              <span>Tariff: <strong className="text-white">₹{fastestSession.pricePerKwh}/kWh</strong></span>
              <span>•</span>
              <span>Total Cost: <strong className="text-white">₹{fastestSession.totalCost.toFixed(2)}</strong></span>
            </div>
          </div>
        )}
      </div>

      {/* Side-by-Side Comparison Matrix */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h3 className="text-xl font-bold text-white">
            Hyderabad Charging Plazas Breakdown ({comparisons.length})
          </h3>

          {/* Sort Controls */}
          <div className="flex items-center space-x-2 text-xs font-mono">
            <span className="text-slate-400 flex items-center space-x-1">
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span>Sort By:</span>
            </span>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="bg-dark-900 border border-white/10 rounded-xl px-2.5 py-1 text-slate-200 focus:outline-none focus:border-brand-cyan"
            >
              <option value="cost">Lowest Total Cost</option>
              <option value="time">Shortest Duration</option>
              <option value="power">Highest Power (kW)</option>
              <option value="price">Lowest Tariff (₹/kWh)</option>
            </select>
          </div>
        </div>

        {/* Comparison Table / Cards */}
        <div className="glass-panel rounded-3xl overflow-hidden border border-white/5">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-dark-950/90 text-slate-400 uppercase text-[10px] border-b border-white/5">
                <tr>
                  <th className="p-4">Station & Network</th>
                  <th className="p-4">Tariff / kWh</th>
                  <th className="p-4">Total Session Cost</th>
                  <th className="p-4">Effective Power</th>
                  <th className="p-4">Estimated Time</th>
                  <th className="p-4">Cost vs Cheapest</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                {comparisons.map((c, idx) => {
                  const isCheapest = cheapestSession && c.station.id === cheapestSession.station.id;
                  const isFastest = fastestSession && c.station.id === fastestSession.station.id;
                  const diffCost = cheapestSession ? c.totalCost - cheapestSession.totalCost : 0;

                  return (
                    <tr 
                      key={c.station.id}
                      className={`hover:bg-white/5 transition-colors ${
                        isCheapest ? 'bg-emerald-500/5' : isFastest ? 'bg-brand-cyan/5' : ''
                      }`}
                    >
                      <td className="p-4">
                        <div className="font-bold text-white text-sm flex items-center space-x-2">
                          <span>{c.station.name}</span>
                          {isCheapest && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                              CHEAPEST
                            </span>
                          )}
                          {isFastest && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] bg-brand-cyan/20 text-brand-cyan font-bold border border-brand-cyan/30">
                              FASTEST
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">{c.station.network} • {c.station.address.split(',')[0]}</div>
                      </td>

                      <td className="p-4 font-bold text-white text-sm">
                        ₹{c.pricePerKwh.toFixed(2)}
                      </td>

                      <td className="p-4">
                        <div className="font-extrabold text-base text-emerald-400">₹{c.totalCost.toFixed(2)}</div>
                        <div className="text-[10px] text-slate-400">For {energyRequired} kWh</div>
                      </td>

                      <td className="p-4">
                        <div className="font-bold text-brand-cyan text-sm">{c.effectiveKw} kW DC</div>
                        <div className="text-[10px] text-slate-500">Rated {c.station.peakPowerKw} kW</div>
                      </td>

                      <td className="p-4">
                        <div className="font-bold text-white text-sm">~{c.totalMinutes} mins</div>
                        <div className="text-[10px] text-slate-400">{c.totalMinutes < 20 ? 'Ultra-Rapid' : c.totalMinutes < 40 ? 'Fast' : 'Standard'}</div>
                      </td>

                      <td className="p-4 font-mono">
                        {diffCost === 0 ? (
                          <span className="text-emerald-400 font-bold">Best Price</span>
                        ) : (
                          <span className="text-slate-400">+₹{diffCost.toFixed(2)}</span>
                        )}
                      </td>

                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-md text-[10px] font-bold ${
                          c.station.status === 'Available' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                        }`}>
                          {c.station.availablePorts}/{c.station.totalPorts} Free
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Physics Explainer: Why the CC-CV 80% Threshold Matters */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-brand-cyan/20 space-y-4">
        <div className="flex items-center space-x-2 text-brand-cyan font-mono text-xs font-bold uppercase tracking-wider">
          <Info className="w-4 h-4" />
          <span>EV BATTERY PHYSICS EXPLAINER: THE CC-CV SATURATION CURVE</span>
        </div>
        <h4 className="text-lg font-bold text-white">
          Why Does Charging from 80% to 100% Take Just as Long as 20% to 80%?
        </h4>
        <p className="text-xs text-slate-300 leading-relaxed max-w-4xl">
          Lithium-ion EV traction batteries utilize two distinct charging phases:
          <br /><br />
          <strong>1. Constant Current (CC) Phase (0% to 80% SoC):</strong> The vehicle accepts maximum dispenser amperage (e.g., 150 kW to 350 kW), replenishing high amounts of energy in 15–25 minutes.
          <br />
          <strong>2. Constant Voltage (CV) Phase (80% to 100% SoC):</strong> To prevent lithium plating, dendrite growth, and thermal runaway, the Battery Management System (BMS) intentionally throttles input power down to 10 kW–25 kW. Charging during this phase costs more time per kWh gained.
        </p>
      </div>
    </div>
  );
}

