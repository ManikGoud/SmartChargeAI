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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 font-sans text-white">
      {/* Editorial Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-white/[0.12]">
        <div>
          <div className="flex items-center space-x-2.5 text-xs font-mono text-[#A1A1AA] uppercase tracking-widest mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_6px_rgba(255,255,255,0.8)]"></span>
            <span>Mathematical Physics Model</span>
            <span className="text-[#71717A]">•</span>
            <span>Non-Linear CC-CV Saturation</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            CHARGING TARIFF & COST COMPARISON
          </h1>
          <p className="text-[#A1A1AA] text-sm mt-1 max-w-2xl leading-relaxed">
            Compare public charging plazas in Hyderabad side-by-side using real-world CC-CV battery physics and dispenser-specific tariffs.
          </p>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <button
            onClick={() => setCurrentPage('discovery')}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-lg bg-[#0B0B0E] border border-white/[0.12] hover:border-white/30 text-xs font-mono text-[#A1A1AA] hover:text-white transition-all"
          >
            <span>Open Station Map →</span>
          </button>
        </div>
      </div>

      {/* Control Panel: Benchmark EV & Range Sliders */}
      <div className="bg-[#0B0B0E] border border-white/[0.12] rounded-xl p-6 sm:p-8 space-y-6 shadow-2xl">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-6 border-b border-white/[0.08]">
          {/* Vehicle Switcher */}
          <div className="space-y-1 flex-1">
            <span className="text-xs font-mono text-[#71717A] uppercase tracking-wider">Benchmark Vehicle</span>
            <div className="flex items-center space-x-3">
              <select
                value={activeVehicle?.id}
                onChange={e => selectVehicle(e.target.value)}
                className="bg-[#050507] text-white font-bold border border-white/[0.12] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-white font-mono cursor-pointer"
              >
                {vehicles.map(v => (
                  <option key={v.id} value={v.id} className="bg-[#050507] text-white">
                    {v.make} {v.model} ({v.batteryCapacity} kWh • Max {v.maxChargingSpeed} kW)
                  </option>
                ))}
              </select>
              <span className="text-xs font-mono text-[#A1A1AA] hidden sm:inline">
                Max DC Rate: <strong className="text-white">{activeVehicle?.maxChargingSpeed} kW</strong>
              </span>
            </div>
          </div>

          {/* Energy Summary Card */}
          <div className="flex items-center space-x-5 bg-[#050507] px-5 py-3 rounded-xl border border-white/[0.12]">
            <div>
              <span className="text-[10px] font-mono text-[#71717A] uppercase block">Energy Required</span>
              <span className="text-2xl font-black font-mono text-white">{energyRequired} kWh</span>
            </div>
            <div className="text-xs font-mono text-[#A1A1AA] pl-5 border-l border-white/[0.12]">
              <span>Delta: </span>
              <strong className="text-white">{startSoC}% → {targetSoC}%</strong> ({targetSoC - startSoC}% SoC)
            </div>
          </div>
        </div>

        {/* Dual Sliders: Start SoC and Target SoC */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono text-xs">
          {/* Start SoC */}
          <div className="bg-[#050507] p-4 rounded-lg border border-white/[0.12] space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-[#A1A1AA]">Starting Battery Level:</span>
              <span className="text-white font-bold text-sm">{startSoC}%</span>
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
              className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-white"
            />
            <div className="flex justify-between text-[10px] text-[#71717A]">
              <span>5% (Deep Reserve)</span>
              <span>75%</span>
            </div>
          </div>

          {/* Target SoC */}
          <div className="bg-[#050507] p-4 rounded-lg border border-white/[0.12] space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-[#A1A1AA]">Target Unplug Level:</span>
              <span className="text-white font-bold text-sm">{targetSoC}%</span>
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
              className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-white"
            />
            <div className="flex justify-between text-[10px] text-[#71717A]">
              <span>20%</span>
              <span className={targetSoC > 80 ? 'text-zinc-300 font-bold' : 'text-[#71717A]'}>
                {targetSoC > 80 ? 'Taper saturation active past 80%' : '80% (Fast Charge Optimum)'}
              </span>
              <span>100% Full</span>
            </div>
          </div>
        </div>
      </div>

      {/* Best in Class Highlights Strip */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Cheapest Card */}
        {cheapestSession && (
          <div className="bg-[#0B0B0E] p-6 rounded-xl border border-white/[0.12] relative overflow-hidden shadow-2xl">
            <div className="flex items-start justify-between mb-4">
              <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded text-xs font-mono font-bold bg-[#121216] text-white border border-white/[0.12]">
                <Award className="w-3.5 h-3.5 text-white" />
                <span>CHEAPEST SESSION</span>
              </span>
              <span className="text-3xl font-black font-mono text-white">
                ₹{cheapestSession.totalCost.toFixed(2)}
              </span>
            </div>
            <h4 className="text-lg font-bold text-white mb-1">{cheapestSession.station.name}</h4>
            <div className="text-xs text-[#A1A1AA] mb-4">{cheapestSession.station.address}</div>
            <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-[#A1A1AA] pt-3 border-t border-white/[0.08]">
              <span>Tariff: <strong className="text-white">₹{cheapestSession.pricePerKwh}/kWh</strong></span>
              <span>•</span>
              <span>Dwell: <strong className="text-white">{cheapestSession.totalMinutes} mins</strong></span>
              <span>•</span>
              <span className="text-white">Save up to ₹{(comparisons[comparisons.length - 1].totalCost - cheapestSession.totalCost).toFixed(0)}</span>
            </div>
          </div>
        )}

        {/* Fastest Card */}
        {fastestSession && (
          <div className="bg-[#0B0B0E] p-6 rounded-xl border border-white/[0.12] relative overflow-hidden shadow-2xl">
            <div className="flex items-start justify-between mb-4">
              <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded text-xs font-mono font-bold bg-[#121216] text-white border border-white/[0.12]">
                <Zap className="w-3.5 h-3.5 text-white" />
                <span>FASTEST SESSION</span>
              </span>
              <span className="text-3xl font-black font-mono text-white">
                {fastestSession.totalMinutes} mins
              </span>
            </div>
            <h4 className="text-lg font-bold text-white mb-1">{fastestSession.station.name}</h4>
            <div className="text-xs text-[#A1A1AA] mb-4">{fastestSession.station.address}</div>
            <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-[#A1A1AA] pt-3 border-t border-white/[0.08]">
              <span>Throughput: <strong className="text-white">{fastestSession.effectiveKw} kW DC</strong></span>
              <span>•</span>
              <span>Tariff: <strong className="text-white">₹{fastestSession.pricePerKwh}/kWh</strong></span>
              <span>•</span>
              <span>Cost: <strong className="text-white">₹{fastestSession.totalCost.toFixed(2)}</strong></span>
            </div>
          </div>
        )}
      </div>

      {/* Side-by-Side Comparison Matrix */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/[0.08]">
          <h3 className="text-xl font-bold text-white tracking-tight">
            Charging Plazas Comparison Matrix ({comparisons.length})
          </h3>

          {/* Sort Controls */}
          <div className="flex items-center space-x-2 text-xs font-mono">
            <span className="text-[#71717A] flex items-center space-x-1">
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span>Sort By:</span>
            </span>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="bg-[#0B0B0E] border border-white/[0.12] text-white rounded-lg px-3 py-1.5 focus:outline-none focus:border-white font-mono cursor-pointer"
            >
              <option value="cost">Lowest Total Cost</option>
              <option value="time">Shortest Duration</option>
              <option value="power">Highest Power (kW)</option>
              <option value="price">Lowest Tariff (₹/kWh)</option>
            </select>
          </div>
        </div>

        {/* Comparison Table */}
        <div className="bg-[#0B0B0E] rounded-xl overflow-hidden border border-white/[0.12]">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#121216] text-[#A1A1AA] uppercase text-[10px] tracking-wider border-b border-white/[0.12]">
                <tr>
                  <th className="p-4">Charging Plaza</th>
                  <th className="p-4">Tariff / kWh</th>
                  <th className="p-4">Session Cost</th>
                  <th className="p-4">Peak Intake</th>
                  <th className="p-4">Dwell Time</th>
                  <th className="p-4">Delta vs Cheapest</th>
                  <th className="p-4">Availability</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06] text-zinc-300">
                {comparisons.map((c) => {
                  const isCheapest = cheapestSession && c.station.id === cheapestSession.station.id;
                  const isFastest = fastestSession && c.station.id === fastestSession.station.id;
                  const diffCost = cheapestSession ? c.totalCost - cheapestSession.totalCost : 0;

                  return (
                    <tr 
                      key={c.station.id}
                      className={`hover:bg-white/[0.02] transition-colors ${
                        isCheapest ? 'bg-white/[0.03]' : isFastest ? 'bg-white/[0.02]' : ''
                      }`}
                    >
                      <td className="p-4">
                        <div className="font-bold text-white text-sm flex items-center space-x-2 font-sans">
                          <span>{c.station.name}</span>
                          {isCheapest && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] bg-white text-[#050507] font-bold font-mono">
                              CHEAPEST
                            </span>
                          )}
                          {isFastest && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] bg-[#121216] text-white border border-white/20 font-bold font-mono">
                              FASTEST
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-[#A1A1AA] mt-0.5">{c.station.network} • {c.station.address.split(',')[0]}</div>
                      </td>

                      <td className="p-4 font-bold text-white text-sm">
                        ₹{c.pricePerKwh.toFixed(2)}
                      </td>

                      <td className="p-4">
                        <div className="font-extrabold text-base text-white">₹{c.totalCost.toFixed(2)}</div>
                        <div className="text-[10px] text-[#71717A]">For {energyRequired} kWh</div>
                      </td>

                      <td className="p-4">
                        <div className="font-bold text-white text-sm">{c.effectiveKw} kW DC</div>
                        <div className="text-[10px] text-[#71717A]">Rated {c.station.peakPowerKw} kW</div>
                      </td>

                      <td className="p-4">
                        <div className="font-bold text-white text-sm">~{c.totalMinutes} mins</div>
                        <div className="text-[10px] text-[#71717A]">{c.totalMinutes < 20 ? 'Ultra-Rapid' : c.totalMinutes < 40 ? 'Fast' : 'Standard'}</div>
                      </td>

                      <td className="p-4 font-mono">
                        {diffCost === 0 ? (
                          <span className="text-white font-bold">Best Price</span>
                        ) : (
                          <span className="text-[#A1A1AA]">+₹{diffCost.toFixed(2)}</span>
                        )}
                      </td>

                      <td className="p-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#121216] border border-white/[0.12] text-white">
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

      {/* Physics Explainer: Constant Current vs Constant Voltage */}
      <div className="bg-[#0B0B0E] rounded-xl p-6 sm:p-8 border border-white/[0.12] space-y-3 shadow-2xl">
        <div className="flex items-center space-x-2 text-white font-mono text-xs font-bold uppercase tracking-wider">
          <Info className="w-4 h-4 text-white" />
          <span>Battery Physics: The Non-Linear CC-CV Saturation Curve</span>
        </div>
        <h4 className="text-lg font-bold text-white tracking-tight">
          Why Does Charging from 80% to 100% Take Just as Long as 20% to 80%?
        </h4>
        <p className="text-xs text-[#A1A1AA] leading-relaxed max-w-4xl font-mono">
          Lithium-ion EV traction batteries utilize two distinct charging phases:
          <br /><br />
          <strong>1. Constant Current (CC) Phase (0% to 80% SoC):</strong> The vehicle accepts maximum dispenser amperage (e.g., 150 kW to 350 kW), replenishing high amounts of energy in 15–25 minutes.
          <br />
          <strong>2. Constant Voltage (CV) Phase (80% to 100% SoC):</strong> To prevent lithium plating, dendrite growth, and thermal runaway, the Battery Management System (BMS) intentionally throttles input power down to 10 kW–25 kW. Charging during this phase costs more dwell time per kWh gained.
        </p>
      </div>
    </div>
  );
}
