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
  Navigation,
  DollarSign,
  TrendingUp,
  Cpu,
  Layers,
  Sparkles,
  Sliders
} from 'lucide-react';
import { useVehicle } from '../context/VehicleContext';
import { useStations } from '../context/StationContext';
import { SAMPLE_RECENT_CHARGES, SAMPLE_SAVED_TRIPS } from '../data/sampleData';
import { useAuth } from '../context/AuthContext';

/**
 * @param {{
 *   setCurrentPage: (page: string) => void;
 * }} props
 */
export function DashboardPage({ setCurrentPage }) {
  const { 
    vehicles,
    activeVehicle, 
    selectVehicle,
    currentSoC, 
    updateSoC, 
    remainingKwh, 
    usableRangeKm, 
    energyNeededTo80 
  } = useVehicle();

  const { stations, bookmarkedIds, setSelectedStation } = useStations();
  const { user, openLoginModal } = useAuth();

  // Bookmarked stations objects
  const bookmarkedStations = stations.filter((/** @type {any} */ s) => bookmarkedIds.includes(s.id));

  // Compute total telemetry stats
  const totalKwhCharged = SAMPLE_RECENT_CHARGES.reduce((sum, item) => sum + item.energyKwh, 0);
  const totalSpend = SAMPLE_RECENT_CHARGES.reduce((sum, item) => sum + item.cost, 0);
  const avgCostPerKwh = totalKwhCharged > 0 ? (totalSpend / totalKwhCharged).toFixed(2) : '18.50';
  // Avg petrol equivalent: ₹9.5/km vs EV ₹2.1/km (saved ~₹7.4/km)
  const estSavings = Math.round(totalKwhCharged * 5.2 * 7.4);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 font-sans text-white">
      {/* A. DASHBOARD EDITORIAL HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-white/[0.12]">
        <div>
          <div className="flex items-center space-x-2.5 text-xs font-mono text-[#A1A1AA] mb-2 uppercase tracking-widest">
            <span className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_6px_rgba(255,255,255,0.8)]"></span>
            <span>Digital Cockpit Telemetry</span>
            <span className="text-[#71717A]">•</span>
            <span className="px-2 py-0.5 rounded bg-[#121216] border border-white/[0.12] text-white font-semibold">
              {user?.user_id || 'CUST-1001'} {user?.full_name ? `· ${user.full_name}` : ''}
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Driver Performance & Telemetry Console
          </h1>
          <p className="text-[#A1A1AA] text-sm mt-1 max-w-2xl leading-relaxed">
            Real-time battery calibration, synchronized vehicle specifications, active charging plaza telemetry, and recorded efficiency metrics.
          </p>
        </div>

        {/* Header Action Shortcuts */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {!user && (
            <button
              onClick={() => openLoginModal('customer')}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-lg bg-[#121216] border border-white/[0.12] hover:border-white/30 text-white font-mono text-xs font-bold uppercase tracking-wider transition-all"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#A1A1AA]" />
              <span>Sign In</span>
            </button>
          )}
          <button
            onClick={() => setCurrentPage('garage')}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-lg bg-[#121216] border border-white/[0.12] hover:border-white/30 text-[#A1A1AA] hover:text-white font-mono text-xs font-bold uppercase tracking-wider transition-all"
          >
            <Car className="w-3.5 h-3.5" />
            <span>My Garage</span>
          </button>
          <button
            onClick={() => setCurrentPage('discovery')}
            className="flex items-center space-x-2 px-5 py-2.5 rounded-lg bg-white text-[#050507] hover:bg-zinc-200 font-mono text-xs font-bold uppercase tracking-wider transition-all shadow-md"
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Find Stations →</span>
          </button>
        </div>
      </div>

      {/* B. VEHICLE TELEMETRY & EFFICIENCY SECTION (Automotive Instrument Layout) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Active EV Telemetry Cockpit Module (8 Cols) */}
        <div className="lg:col-span-8 bg-[#0B0B0E] border border-white/[0.12] rounded-xl p-6 sm:p-8 flex flex-col justify-between shadow-2xl relative overflow-hidden">
          <div>
            {/* Top row: Module Tag & Direct EV Switcher */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-white/[0.08]">
              <div className="flex items-center space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_6px_rgba(255,255,255,0.8)]"></span>
                <span className="text-xs font-mono uppercase tracking-widest text-[#A1A1AA] font-bold">
                  Active Vehicle Telemetry
                </span>
              </div>

              {/* Direct Vehicle Switcher */}
              <div className="flex items-center space-x-2">
                <span className="text-xs font-mono text-[#71717A] hidden sm:inline">Calibrated EV:</span>
                <select
                  value={activeVehicle.id}
                  onChange={(e) => selectVehicle(e.target.value)}
                  className="bg-[#121216] border border-white/[0.12] text-white text-xs font-mono rounded-lg px-3 py-1.5 focus:outline-none focus:border-white cursor-pointer"
                >
                  {vehicles.map((/** @type {any} */ v) => (
                    <option key={v.id} value={v.id} className="bg-[#050507] text-white">
                      {v.year} {v.make} {v.model} ({v.batteryCapacity} kWh)
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => setCurrentPage('garage')}
                  className="text-xs text-[#A1A1AA] hover:text-white font-mono transition-colors ml-1"
                >
                  Configure →
                </button>
              </div>
            </div>

            {/* Vehicle Title & Large Numerical Battery Gauge */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
              <div>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                  {activeVehicle.make} {activeVehicle.model}
                </h2>
                <div className="text-xs font-mono text-[#A1A1AA] mt-1.5 flex flex-wrap items-center gap-2">
                  <span>Model Year {activeVehicle.year}</span>
                  <span className="text-[#71717A]">•</span>
                  <span>{activeVehicle.batteryCapacity} kWh Pack</span>
                  <span className="text-[#71717A]">•</span>
                  <span>{activeVehicle.maxChargingSpeed >= 200 ? '800V Architecture' : '400V Architecture'}</span>
                </div>
              </div>

              {/* High-Contrast Large Metric Cluster */}
              <div className="flex items-baseline space-x-2 bg-[#121216] px-5 py-3 rounded-xl border border-white/[0.12] shrink-0">
                <span className="text-4xl sm:text-5xl font-black font-mono text-white tracking-tight">
                  {currentSoC}%
                </span>
                <div className="text-left font-mono">
                  <span className="text-[10px] text-[#71717A] block uppercase leading-none">BATTERY</span>
                  <span className="text-xs text-[#A1A1AA] font-bold">STATE OF CHARGE</span>
                </div>
              </div>
            </div>

            {/* Interactive Simulation Slider */}
            <div className="p-4 rounded-lg bg-[#050507] border border-white/[0.12] space-y-3 mb-6">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-[#A1A1AA] font-bold flex items-center space-x-1.5">
                  <BatteryCharging className="w-4 h-4 text-[#A1A1AA]" />
                  <span>Battery Telemetry Calibration (Simulation):</span>
                </span>
                <span className="text-white font-bold">{remainingKwh} kWh Stored</span>
              </div>

              <input
                type="range"
                min="5"
                max="100"
                value={currentSoC}
                onChange={(e) => updateSoC(e.target.value)}
                className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-white"
              />

              <div className="flex justify-between text-[11px] font-mono text-[#A1A1AA]">
                <span>Usable Range: <strong className="text-white font-bold">{usableRangeKm} km</strong></span>
                <span>Energy to 80%: <strong className="text-white font-bold">{energyNeededTo80} kWh</strong></span>
              </div>
            </div>

            {/* Micro Vehicle Telemetry Grid */}
            <div className="grid grid-cols-3 gap-3 text-xs font-mono">
              <div className="p-3.5 rounded-lg bg-[#050507] border border-white/[0.12]">
                <span className="text-[#71717A] text-[10px] block uppercase tracking-wider">Peak Intake</span>
                <span className="text-base font-bold text-white mt-0.5 block">{activeVehicle.maxChargingSpeed} kW DC</span>
              </div>
              <div className="p-3.5 rounded-lg bg-[#050507] border border-white/[0.12]">
                <span className="text-[#71717A] text-[10px] block uppercase tracking-wider">Deficit to 80%</span>
                <span className="text-base font-bold text-white mt-0.5 block">{energyNeededTo80} kWh</span>
              </div>
              <div className="p-3.5 rounded-lg bg-[#050507] border border-white/[0.12]">
                <span className="text-[#71717A] text-[10px] block uppercase tracking-wider">Connectors</span>
                <span className="text-xs font-bold text-white mt-1 block truncate">{activeVehicle.connectors.join(', ')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Operational Efficiency & Savings Card (4 Cols) */}
        <div className="lg:col-span-4 bg-[#0B0B0E] border border-white/[0.12] rounded-xl p-6 sm:p-8 flex flex-col justify-between space-y-6 shadow-2xl">
          <div>
            <div className="flex items-center space-x-2 text-xs font-mono text-[#A1A1AA] font-bold uppercase tracking-widest mb-2">
              <Zap className="w-3.5 h-3.5 text-white" />
              <span>Operational Efficiency</span>
            </div>
            <h3 className="text-xl font-bold text-white tracking-tight">
              Economic & Energy Yield
            </h3>
            <p className="text-xs text-[#A1A1AA] leading-relaxed mt-1">
              Automated savings benchmarking versus internal combustion engines based on your verified charging sessions.
            </p>
          </div>

          <div className="space-y-3 font-mono">
            <div className="p-4 rounded-lg bg-[#050507] border border-white/[0.12]">
              <span className="text-[10px] text-[#71717A] block uppercase tracking-wider">Estimated Fuel Savings</span>
              <span className="text-3xl font-extrabold text-white mt-0.5 block">₹{estSavings.toLocaleString()}</span>
              <span className="text-[10px] text-[#71717A] block mt-1">vs Petrol/Diesel (Avg. ₹9.50/km)</span>
            </div>

            <div className="p-4 rounded-lg bg-[#050507] border border-white/[0.12]">
              <span className="text-[10px] text-[#71717A] block uppercase tracking-wider">Energy Delivered</span>
              <span className="text-2xl font-extrabold text-white mt-0.5 block">{totalKwhCharged.toFixed(1)} kWh</span>
              <span className="text-[10px] text-[#71717A] block mt-1">Across {SAMPLE_RECENT_CHARGES.length} recorded sessions</span>
            </div>

            <div className="p-4 rounded-lg bg-[#050507] border border-white/[0.12]">
              <span className="text-[10px] text-[#71717A] block uppercase tracking-wider">Average Tariff</span>
              <span className="text-2xl font-extrabold text-white mt-0.5 block">₹{avgCostPerKwh} / kWh</span>
              <span className="text-[10px] text-[#71717A] block mt-1">Total spend: ₹{totalSpend.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* C. CHARGING STATISTICS & QUICK ACTION SHORTCUTS */}
      <section className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
          <div className="flex items-center space-x-2">
            <span className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_6px_rgba(255,255,255,0.8)]"></span>
            <h3 className="text-xs font-mono uppercase tracking-widest text-[#A1A1AA] font-bold">
              Cockpit Quick Actions
            </h3>
          </div>
          <span className="text-[11px] font-mono text-[#71717A]">Direct Navigation Shortcuts</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <button
            onClick={() => setCurrentPage('discovery')}
            className="p-4 rounded-xl bg-[#0B0B0E] border border-white/[0.12] hover:border-white/30 hover:bg-[#121216] transition-all text-left group"
          >
            <MapPin className="w-5 h-5 text-white mb-2 group-hover:scale-110 transition-transform" />
            <div className="text-sm font-bold text-white">Find Stations</div>
            <div className="text-[11px] text-[#71717A] font-mono mt-0.5">Explore 1,420+ plazas →</div>
          </button>

          <button
            onClick={() => setCurrentPage('trips')}
            className="p-4 rounded-xl bg-[#0B0B0E] border border-white/[0.12] hover:border-white/30 hover:bg-[#121216] transition-all text-left group"
          >
            <Compass className="w-5 h-5 text-white mb-2 group-hover:scale-110 transition-transform" />
            <div className="text-sm font-bold text-white">Plan a Trip</div>
            <div className="text-[11px] text-[#71717A] font-mono mt-0.5">Multi-stop corridor routing →</div>
          </button>

          <button
            onClick={() => setCurrentPage('cost-compare')}
            className="p-4 rounded-xl bg-[#0B0B0E] border border-white/[0.12] hover:border-white/30 hover:bg-[#121216] transition-all text-left group"
          >
            <DollarSign className="w-5 h-5 text-white mb-2 group-hover:scale-110 transition-transform" />
            <div className="text-sm font-bold text-white">Cost Compare</div>
            <div className="text-[11px] text-[#71717A] font-mono mt-0.5">Tariffs & petrol savings →</div>
          </button>

          <button
            onClick={() => setCurrentPage('garage')}
            className="p-4 rounded-xl bg-[#0B0B0E] border border-white/[0.12] hover:border-white/30 hover:bg-[#121216] transition-all text-left group"
          >
            <Car className="w-5 h-5 text-white mb-2 group-hover:scale-110 transition-transform" />
            <div className="text-sm font-bold text-white">My Garage</div>
            <div className="text-[11px] text-[#71717A] font-mono mt-0.5">Manage {vehicles.length} calibrated EVs →</div>
          </button>

          <button
            onClick={() => setCurrentPage('history')}
            className="p-4 rounded-xl bg-[#0B0B0E] border border-white/[0.12] hover:border-white/30 hover:bg-[#121216] transition-all text-left group"
          >
            <Clock className="w-5 h-5 text-white mb-2 group-hover:scale-110 transition-transform" />
            <div className="text-sm font-bold text-white">Charging History</div>
            <div className="text-[11px] text-[#71717A] font-mono mt-0.5">Verified session logs →</div>
          </button>
        </div>
      </section>

      {/* D. BOOKMARKED CHARGING PLAZAS */}
      <section className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
          <div className="flex items-center space-x-2">
            <Bookmark className="w-4 h-4 text-white" />
            <h3 className="text-xl font-bold text-white tracking-tight">
              Bookmarked Charging Plazas ({bookmarkedStations.length})
            </h3>
          </div>
          <button
            onClick={() => setCurrentPage('discovery')}
            className="text-xs text-[#A1A1AA] hover:text-white font-mono transition-colors"
          >
            Explore all stations →
          </button>
        </div>

        {bookmarkedStations.length === 0 ? (
          <div className="bg-[#0B0B0E] border border-white/[0.12] rounded-xl p-8 text-center text-xs text-[#A1A1AA] space-y-2">
            <Bookmark className="w-8 h-8 text-[#71717A] mx-auto mb-1" />
            <div className="text-sm font-bold text-white">No bookmarked stations yet</div>
            <p className="text-xs text-[#71717A] max-w-sm mx-auto">
              Click the bookmark icon on any charging plaza card in Find Stations to pin it here for 1-click live navigation.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {bookmarkedStations.map((/** @type {any} */ station) => (
              <div 
                key={station.id}
                className="bg-[#0B0B0E] p-5 rounded-xl border border-white/[0.12] hover:border-white/30 transition-all cursor-pointer group flex flex-col justify-between"
                onClick={() => {
                  setSelectedStation(station);
                  setCurrentPage('discovery');
                }}
              >
                <div>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <span className="text-[10px] font-mono text-[#A1A1AA] uppercase font-bold tracking-wider">{station.network}</span>
                      <h4 className="text-base font-bold text-white group-hover:text-zinc-200 transition-colors mt-0.5">{station.name}</h4>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#121216] border border-white/[0.12] text-white">
                      {station.availablePorts}/{station.totalPorts} Free
                    </span>
                  </div>
                  <div className="text-xs text-[#A1A1AA] truncate mb-3 flex items-center space-x-1">
                    <MapPin className="w-3 h-3 text-[#71717A] shrink-0" />
                    <span>{station.address}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs font-mono pt-3 border-t border-white/[0.08]">
                  <span className="text-white font-bold">{station.peakPowerKw} kW DC</span>
                  <span className="text-white font-bold">{station.currency}{station.pricePerKwh}/kWh</span>
                  <span className="text-[#71717A]">{station.distanceKm} km</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* E. CHARGING ACTIVITY HISTORY TABLE */}
      <section className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-white" />
            <h3 className="text-xl font-bold text-white tracking-tight">
              Recent Charging Activity
            </h3>
          </div>
          <span className="text-xs font-mono text-[#71717A]">Verified Dispenser Telemetry</span>
        </div>

        <div className="bg-[#0B0B0E] rounded-xl overflow-hidden border border-white/[0.12]">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#121216] border-b border-white/[0.12] text-[#A1A1AA] uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-4">Charging Plaza</th>
                  <th className="p-4">Date & Time</th>
                  <th className="p-4">Energy Added</th>
                  <th className="p-4">Duration</th>
                  <th className="p-4">Battery Delta</th>
                  <th className="p-4">Total Cost</th>
                  <th className="p-4">Dispenser Protocol</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06] text-zinc-300">
                {SAMPLE_RECENT_CHARGES.map((chg) => (
                  <tr key={chg.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-4 font-bold text-white font-sans text-sm">{chg.stationName}</td>
                    <td className="p-4 text-[#A1A1AA]">{chg.date}</td>
                    <td className="p-4 font-bold text-white">{chg.energyKwh} kWh</td>
                    <td className="p-4 text-[#A1A1AA]">{chg.durationMins} mins</td>
                    <td className="p-4 text-white">
                      <span className="text-[#A1A1AA]">{chg.startSoC}%</span> → <strong className="text-white">{chg.endSoC}%</strong>
                    </td>
                    <td className="p-4 font-bold text-white">{chg.currency}{chg.cost.toFixed(2)}</td>
                    <td className="p-4 text-[#71717A]">{chg.chargerType}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* F. SAVED JOURNEY ROUTE PROFILES */}
      <section className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
          <div className="flex items-center space-x-2">
            <Compass className="w-4 h-4 text-white" />
            <h3 className="text-xl font-bold text-white tracking-tight">
              Calibrated Journey Corridors
            </h3>
          </div>
          <button
            onClick={() => setCurrentPage('trips')}
            className="text-xs text-[#A1A1AA] hover:text-white font-mono transition-colors"
          >
            Open Trip Planner →
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {SAMPLE_SAVED_TRIPS.map((trip) => (
            <div key={trip.id} className="bg-[#0B0B0E] p-6 rounded-xl border border-white/[0.12] space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-base font-bold text-white tracking-tight">{trip.title}</h4>
                <span className="px-2.5 py-1 rounded text-[10px] font-mono bg-[#121216] text-white border border-white/[0.12] font-semibold">
                  {trip.recommendedStops} Recommended Stop
                </span>
              </div>
              <div className="text-xs text-[#A1A1AA] flex items-center space-x-2 font-mono">
                <span>{trip.origin}</span>
                <span className="text-white">→</span>
                <span>{trip.destination}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 p-3 rounded-lg bg-[#050507] border border-white/[0.12] text-xs font-mono">
                <div>
                  <span className="text-[#71717A] text-[10px] block uppercase">Distance</span>
                  <span className="text-white font-bold">{trip.distanceKm} km</span>
                </div>
                <div>
                  <span className="text-[#71717A] text-[10px] block uppercase">Duration</span>
                  <span className="text-white font-bold">{trip.estDuration}</span>
                </div>
                <div>
                  <span className="text-[#71717A] text-[10px] block uppercase">Arrival SoC</span>
                  <span className="text-white font-bold">~{trip.batteryArrivalSoC}%</span>
                </div>
              </div>
              <div className="text-xs font-mono text-[#A1A1AA] pt-2 border-t border-white/[0.08] flex items-center justify-between">
                <span>HPC Stop: <strong className="text-white">{trip.suggestedStation}</strong></span>
                <span className="text-white font-bold">{trip.estCost}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
