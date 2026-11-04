import React from 'react';
import { 
  LayoutDashboard, 
  Car, 
  BatteryCharging, 
  Zap, 
  MapPin, 
  Clock, 
  ArrowRight, 
  Bookmark, 
  Compass, 
  ShieldCheck, 
  TrendingDown, 
  Leaf, 
  Navigation,
  DollarSign
} from 'lucide-react';
import { useVehicle } from '../context/VehicleContext';
import { useStations } from '../context/StationContext';
import { SAMPLE_RECENT_CHARGES, SAMPLE_SAVED_TRIPS } from '../data/sampleData';
import { Badge, DemoDataBadge } from '../components/Badge';

export function DashboardPage({ setCurrentPage }) {
  const { 
    activeVehicle, 
    currentSoC, 
    updateSoC, 
    remainingKwh, 
    usableRangeKm, 
    energyNeededTo80 
  } = useVehicle();

  const { stations, bookmarkedIds, setSelectedStation } = useStations();

  // Bookmarked stations objects
  const bookmarkedStations = stations.filter(s => bookmarkedIds.includes(s.id));

  // Compute total demo stats
  const totalKwhCharged = SAMPLE_RECENT_CHARGES.reduce((sum, item) => sum + item.energyKwh, 0);
  const totalSpend = SAMPLE_RECENT_CHARGES.reduce((sum, item) => sum + item.cost, 0);
  // Avg petrol equivalent: ₹9.5/km vs EV ₹2.1/km (saved ~₹7.4/km)
  const estSavings = Math.round(totalKwhCharged * 5.2 * 7.4);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Dashboard Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/5">
        <div>
          <div className="flex items-center space-x-2 text-xs font-mono text-brand-cyan mb-1.5">
            <LayoutDashboard className="w-4 h-4" />
            <span>PILOT TELEMETRY CONSOLE</span>
            <DemoDataBadge />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            User Intelligence Dashboard
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Personalized EV performance analytics, battery health metrics, bookmarked charging plazas, and journey records.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setCurrentPage('discovery')}
            className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-brand-cyan text-dark-950 font-bold hover:bg-brand-cyan/90 transition-all shadow-cyan-glow text-xs uppercase font-mono tracking-wider"
          >
            <MapPin className="w-4 h-4" />
            <span>Discover Chargers</span>
          </button>
        </div>
      </div>

      {/* Hero Overview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Active EV Telemetry Card (8 Cols) */}
        <div className="lg:col-span-8 glass-panel-glow rounded-3xl p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-mono text-brand-cyan font-bold uppercase tracking-wider flex items-center space-x-1.5">
                <Car className="w-4 h-4" />
                <span>Synchronized Active EV</span>
              </span>
              <button
                onClick={() => setCurrentPage('garage')}
                className="text-xs text-slate-400 hover:text-brand-cyan font-mono transition-colors"
              >
                Switch Vehicle →
              </button>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                  {activeVehicle.make} {activeVehicle.model}
                </h2>
                <div className="text-xs font-mono text-slate-400 mt-0.5">
                  Year {activeVehicle.year} • {activeVehicle.batteryCapacity} kWh Pack • Max {activeVehicle.maxChargingSpeed} kW DC
                </div>
              </div>

              <div className="flex items-baseline space-x-2 bg-dark-950/80 px-4 py-2 rounded-2xl border border-white/5">
                <span className="text-3xl font-black font-mono text-brand-cyan">{currentSoC}%</span>
                <span className="text-xs font-mono text-slate-400">SoC</span>
              </div>
            </div>

            {/* Battery SoC Slider */}
            <div className="space-y-2 mb-6">
              <div className="flex justify-between text-xs font-mono text-slate-400">
                <span>Stored Energy: <strong className="text-white">{remainingKwh} kWh</strong></span>
                <span>Usable Range: <strong className="text-emerald-400">{usableRangeKm} km</strong></span>
              </div>
              <input
                type="range"
                min="5"
                max="100"
                value={currentSoC}
                onChange={(e) => updateSoC(e.target.value)}
                className="w-full h-2 bg-dark-800 rounded-lg appearance-none cursor-pointer accent-brand-cyan"
              />
            </div>

            {/* Micro Stats Grid */}
            <div className="grid grid-cols-3 gap-3 text-xs font-mono">
              <div className="p-3 rounded-xl bg-dark-950/60 border border-white/5">
                <span className="text-slate-500 text-[10px] block">ENERGY DEFICIT TO 80%</span>
                <span className="text-brand-cyan font-bold">{energyNeededTo80} kWh</span>
              </div>
              <div className="p-3 rounded-xl bg-dark-950/60 border border-white/5">
                <span className="text-slate-500 text-[10px] block">FAST CHARGE CAP</span>
                <span className="text-white font-bold">{activeVehicle.maxChargingSpeed} kW DC</span>
              </div>
              <div className="p-3 rounded-xl bg-dark-950/60 border border-white/5">
                <span className="text-slate-500 text-[10px] block">CONNECTORS</span>
                <span className="text-emerald-400 font-bold">{activeVehicle.connectors.join(', ')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Eco & Financial Savings Card (4 Cols) */}
        <div className="lg:col-span-4 glass-panel rounded-3xl p-6 sm:p-8 flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center space-x-2 text-xs font-mono text-emerald-400 font-semibold mb-2">
              <Leaf className="w-4 h-4" />
              <span>ECO-IMPACT & SAVINGS</span>
            </div>
            <h3 className="text-xl font-bold text-white mb-1">
              Operational Efficiency
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Comparison against internal combustion equivalent vehicles based on your charging log.
            </p>
          </div>

          <div className="space-y-4 font-mono">
            <div className="p-3.5 rounded-2xl bg-dark-950/60 border border-white/5">
              <span className="text-[10px] text-slate-500 block uppercase">Estimated Fuel Savings</span>
              <span className="text-2xl font-black text-emerald-400">₹{estSavings.toLocaleString()}</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">vs Petrol/Diesel (Avg. ₹9.5/km)</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-dark-950/60 border border-white/5">
              <span className="text-[10px] text-slate-500 block uppercase">Total Energy Charged</span>
              <span className="text-2xl font-black text-brand-cyan">{totalKwhCharged.toFixed(1)} kWh</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Across {SAMPLE_RECENT_CHARGES.length} recorded sessions</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-dark-950/60 border border-white/5">
              <span className="text-[10px] text-slate-500 block uppercase">CO2 Emissions Avoided</span>
              <span className="text-2xl font-black text-purple-400">~84.2 kg</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Clean Grid Factor 0.82 kg/kWh</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bookmarked Stations Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Bookmark className="w-4 h-4 text-brand-cyan" />
            <h3 className="text-xl font-bold text-white tracking-tight">
              Favorite Charging Plazas ({bookmarkedStations.length})
            </h3>
          </div>
          <button
            onClick={() => setCurrentPage('discovery')}
            className="text-xs text-brand-cyan hover:underline font-mono"
          >
            Explore all stations →
          </button>
        </div>

        {bookmarkedStations.length === 0 ? (
          <div className="glass-panel rounded-2xl p-6 text-center text-xs text-slate-400">
            No bookmarked stations yet. Click the bookmark icon on any station card in Discovery to pin it here.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {bookmarkedStations.map((station) => (
              <div 
                key={station.id}
                className="glass-panel p-4 rounded-2xl border border-white/5 hover:border-brand-cyan/30 transition-all cursor-pointer group"
                onClick={() => {
                  setSelectedStation(station);
                  setCurrentPage('discovery');
                }}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <span className="text-[10px] font-mono text-brand-cyan uppercase font-bold">{station.network}</span>
                    <h4 className="text-sm font-bold text-white group-hover:text-brand-cyan transition-colors">{station.name}</h4>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                    station.status === 'Available' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                  }`}>
                    {station.availablePorts}/{station.totalPorts} Free
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 truncate mb-3">{station.address}</div>
                <div className="flex items-center justify-between text-xs font-mono pt-2 border-t border-white/5">
                  <span className="text-brand-cyan font-bold">{station.peakPowerKw} kW DC</span>
                  <span className="text-emerald-400 font-bold">{station.currency}{station.pricePerKwh}/kWh</span>
                  <span className="text-slate-400">{station.distanceKm} km</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Recent Charging Sessions History */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-brand-cyan" />
            <h3 className="text-xl font-bold text-white tracking-tight">
              Recent Charging History
            </h3>
          </div>
          <DemoDataBadge />
        </div>

        <div className="glass-panel rounded-2xl overflow-hidden border border-white/5">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-dark-950/80 border-b border-white/5 text-slate-400 uppercase text-[10px]">
                <tr>
                  <th className="p-3.5">Plaza / Station</th>
                  <th className="p-3.5">Date</th>
                  <th className="p-3.5">Energy Delivered</th>
                  <th className="p-3.5">Duration</th>
                  <th className="p-3.5">SoC Range</th>
                  <th className="p-3.5">Session Cost</th>
                  <th className="p-3.5">Dispenser</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                {SAMPLE_RECENT_CHARGES.map((chg) => (
                  <tr key={chg.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-3.5 font-bold text-white">{chg.stationName}</td>
                    <td className="p-3.5 text-slate-400">{chg.date}</td>
                    <td className="p-3.5 text-brand-cyan font-bold">{chg.energyKwh} kWh</td>
                    <td className="p-3.5">{chg.durationMins} mins</td>
                    <td className="p-3.5 font-bold text-emerald-400">{chg.startSoC}% → {chg.endSoC}%</td>
                    <td className="p-3.5 font-bold text-white">{chg.currency}{chg.cost.toFixed(2)}</td>
                    <td className="p-3.5 text-slate-400">{chg.chargerType}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Saved Journeys & Route Logs */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Compass className="w-4 h-4 text-brand-cyan" />
            <h3 className="text-xl font-bold text-white tracking-tight">
              Saved Journey Route Profiles
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-400">Battery-aware road trips</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {SAMPLE_SAVED_TRIPS.map((trip) => (
            <div key={trip.id} className="glass-panel p-5 rounded-2xl border border-white/5 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-base font-bold text-white">{trip.title}</h4>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-brand-cyan/10 text-brand-cyan border border-brand-cyan/20">
                  {trip.recommendedStops} Stop Required
                </span>
              </div>
              <div className="text-xs text-slate-400 flex items-center space-x-2">
                <span>{trip.origin}</span>
                <span className="text-brand-cyan">→</span>
                <span>{trip.destination}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-dark-950/60 border border-white/5 text-xs font-mono">
                <div>
                  <span className="text-slate-500 text-[10px] block">TOTAL DISTANCE</span>
                  <span className="text-white font-bold">{trip.distanceKm} km</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">EST. DURATION</span>
                  <span className="text-white font-bold">{trip.estDuration}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">ARRIVAL SOC</span>
                  <span className="text-emerald-400 font-bold">~{trip.batteryArrivalSoC}%</span>
                </div>
              </div>
              <div className="text-[11px] font-mono text-slate-400 pt-1 flex items-center justify-between">
                <span>Recommended Stop: <strong className="text-slate-200">{trip.suggestedStation}</strong></span>
                <span className="text-emerald-400 font-bold">{trip.estCost}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

