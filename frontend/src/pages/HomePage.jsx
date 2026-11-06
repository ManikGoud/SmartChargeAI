import React, { useState } from 'react';
import { 
  Zap, 
  MapPin, 
  Car, 
  Search, 
  ArrowRight, 
  Sparkles, 
  ShieldCheck, 
  BatteryCharging, 
  Navigation, 
  Cpu, 
  Clock, 
  ChevronRight,
  TrendingDown,
  Compass,
  CheckCircle2,
  SlidersHorizontal
} from 'lucide-react';
import { DemoDataBadge } from '../components/Badge';
import { useVehicle } from '../context/VehicleContext';
import { CinematicScrollExperience } from '../components/CinematicScrollExperience';
import { ExplodedViewSection } from '../components/ExplodedViewSection';

/**
 * @param {{
 *   setCurrentPage: (page: string) => void;
 *   onSearch?: (query: string) => void;
 * }} props
 */
export function HomePage({ setCurrentPage, onSearch }) {
  const { activeVehicle, currentSoC, updateSoC, usableRangeKm, remainingKwh, energyNeededTo80 } = useVehicle();
  const [query, setQuery] = useState('');

  const quickFilterPills = [
    '350 kW Ultra-Fast',
    'CCS-2 Only',
    'Available Now',
    'Outer Ring Road',
    'Free Parking'
  ];

  const handleSearchSubmit = (/** @type {React.FormEvent} */ e) => {
    e.preventDefault();
    if (onSearch) onSearch(query);
    setCurrentPage('discovery');
  };

  const handleQuickFilterClick = (/** @type {string} */ filterText) => {
    setQuery(filterText);
    if (onSearch) onSearch(filterText);
    setCurrentPage('discovery');
  };

  const workflowSteps = [
    { num: '01', title: 'Search', desc: 'Locate chargers across multiple networks by destination or corridor.' },
    { num: '02', title: 'Filter', desc: 'Eliminate incompatible connectors (CCS2, Type 2) and slow dispensers.' },
    { num: '03', title: 'Compare', desc: 'Inspect per-kWh tariffs, peak power output, and stall availability.' },
    { num: '04', title: 'AI Match', desc: 'Score stations with multi-criteria optimization tailored to your EV.' },
    { num: '05', title: 'Plan Trip', desc: 'Generate battery-aware multi-stop routes with guaranteed arrival SoC.' },
    { num: '06', title: 'Navigate', desc: 'Turn-by-turn guidance directly to the optimal charging stall.' },
    { num: '07', title: 'Charge', desc: 'Optimized charging sessions minimizing cost and battery degradation.' },
  ];

  const featureCards = [
    {
      icon: Cpu,
      title: 'AI Multi-Factor Recommendations',
      desc: 'Holistic scoring algorithm evaluating distance, speed compatibility, live pricing, and stall queues.',
      tag: 'Core Intelligence'
    },
    {
      icon: Compass,
      title: 'EV Journey Trip Planner',
      desc: 'Simulates battery consumption curves based on vehicle range, elevation buffers, and required charging stops.',
      tag: 'Dynamic Routing'
    },
    {
      icon: Clock,
      title: 'Mathematical Cost Calculator',
      desc: 'Non-linear CC-CV charging curve calculations modeling real-world taper past 80% SoC.',
      tag: 'Physics Modeling'
    },
    {
      icon: BatteryCharging,
      title: 'Vehicle Compatibility Match',
      desc: 'Restricts recommendations to chargers matching your EV’s onboard charger limits and port geometry.',
      tag: 'Zero Mistakes'
    }
  ];

  return (
    <div className="space-y-24 pb-24 overflow-hidden bg-[#050507] text-white">
      {/* 1. 4-Chapter Scroll-Driven Cinematic 3D Canvas Background Experience (LOCKED & PRESERVED) */}
      <CinematicScrollExperience 
        setCurrentPage={setCurrentPage} 
        onSearch={onSearch} 
      />

      {/* 2. Interactive Charging Station Search Bar Section (Monochrome Automotive) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20">
        <div className="bg-[#0B0B0E] border border-white/[0.12] rounded-xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
            <div>
              <span className="text-[10px] font-mono tracking-[0.15em] uppercase text-[#A1A1AA] font-semibold flex items-center space-x-1.5">
                <Search className="w-3.5 h-3.5 text-[#A1A1AA]" />
                <span>Infrastructure Directory</span>
              </span>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-white mt-1 tracking-tight">
                Locate High-Power Charging Plazas
              </h3>
            </div>
            <div className="text-xs font-mono text-[#A1A1AA] bg-[#121216] border border-white/[0.12] px-3 py-1.5 rounded-md">
              SYNCHRONIZED VEHICLE: <strong className="text-white">{activeVehicle.make.toUpperCase()} {activeVehicle.model.toUpperCase()} ({activeVehicle.maxChargingSpeed >= 200 ? '800V' : '400V'})</strong>
            </div>
          </div>

          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#71717A]" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by area, corridor, highway, or network (e.g. Gachibowli, ORR, Tata Power, 150kW)..."
                className="w-full pl-12 pr-4 py-3.5 rounded-lg bg-[#050507] border border-white/[0.12] text-white placeholder-[#71717A] text-sm focus:outline-none focus:border-white transition-all font-mono"
              />
            </div>
            <button
              type="submit"
              className="w-full sm:w-auto px-8 py-3.5 rounded-lg bg-white text-[#050507] font-bold font-mono text-xs uppercase tracking-wider hover:bg-zinc-200 transition-all shadow-md shrink-0 flex items-center justify-center space-x-2"
            >
              <span>Search Dispensers</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Filter Chips */}
          <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-white/[0.12]">
            <span className="text-[11px] font-mono text-[#71717A] uppercase tracking-wider mr-2">Quick Filters:</span>
            {quickFilterPills.map((pill, idx) => (
              <button
                key={idx}
                onClick={() => handleQuickFilterClick(pill)}
                className="px-3 py-1 rounded-md bg-[#121216] border border-white/[0.12] text-xs font-mono text-[#A1A1AA] hover:text-white hover:bg-[#18181D] hover:border-white/30 transition-all"
              >
                {pill}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Simplified Network Live Telemetry Strip (Monochrome Digital Instrument) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#0B0B0E] border border-white/[0.12] rounded-xl p-6 sm:p-8 relative">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-5 mb-6 border-b border-white/[0.12] gap-2">
            <div className="flex items-center space-x-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-white inline-block shadow-[0_0_6px_rgba(255,255,255,0.8)]"></span>
              <h3 className="text-[11px] font-mono uppercase tracking-[0.16em] text-[#A1A1AA] font-bold">
                Live Network Telemetry · 800V HPC Corridors
              </h3>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-[9px] font-mono uppercase tracking-widest text-[#A1A1AA] border border-white/[0.12] px-2 py-0.5 rounded bg-[#121216]">
                Verified Benchmark
              </span>
              <DemoDataBadge />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="space-y-1.5 md:border-r md:border-white/[0.12] md:pr-4">
              <div className="text-3xl sm:text-4xl font-extrabold font-mono text-white tracking-tight">1,420+</div>
              <p className="text-[10px] font-mono text-[#A1A1AA] uppercase tracking-widest">Compatible Dispensers</p>
              <span className="text-[11px] text-[#71717A] font-mono">98.4% Operational Target</span>
            </div>
            <div className="space-y-1.5 md:border-r md:border-white/[0.12] md:pr-4">
              <div className="text-3xl sm:text-4xl font-extrabold font-mono text-white tracking-tight">350 kW</div>
              <p className="text-[10px] font-mono text-[#A1A1AA] uppercase tracking-widest">Peak Power Dispenser</p>
              <span className="text-[11px] text-[#71717A] font-mono">800V Ultra-Fast Capable</span>
            </div>
            <div className="space-y-1.5 md:border-r md:border-white/[0.12] md:pr-4">
              <div className="text-3xl sm:text-4xl font-extrabold font-mono text-white tracking-tight">₹17.20</div>
              <p className="text-[10px] font-mono text-[#A1A1AA] uppercase tracking-widest">Median Tariff / kWh</p>
              <span className="text-[11px] text-[#71717A] font-mono">Off-Peak Highway Average</span>
            </div>
            <div className="space-y-1.5">
              <div className="text-3xl sm:text-4xl font-extrabold font-mono text-white tracking-tight">99.2%</div>
              <p className="text-[10px] font-mono text-[#A1A1AA] uppercase tracking-widest">First-Attempt Handshake</p>
              <span className="text-[11px] text-[#71717A] font-mono">Zero Incompatible Standard</span>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Connected 7-Step Charging Workflow (Architectural Pipeline) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-2 mb-10">
          <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-[0.2em] font-bold block">
            The SmartChargeAI Pipeline
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Architected for Precision EV Journeys.
          </h2>
          <p className="text-zinc-400 max-w-xl mx-auto text-sm">
            Every charging decision is modeled against vehicle intake curves, grid tariffs, and real-time stall occupancy.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
          {workflowSteps.map((step, idx) => (
            <div 
              key={idx}
              className="bg-[#0B0B0E] p-4 rounded-lg border border-white/[0.12] hover:border-white/30 hover:bg-[#121216] transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono font-bold text-[#A1A1AA]">
                    {step.num}
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-[#71717A] group-hover:text-white transition-colors" />
                </div>
                <h4 className="text-sm font-bold text-white mb-1 tracking-tight">{step.title}</h4>
                <p className="text-[11px] text-[#A1A1AA] leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. "My EV" Dedicated Section (Automotive Specification Sheet) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#0B0B0E] border border-white/[0.12] rounded-xl p-6 sm:p-10 relative overflow-hidden shadow-2xl">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            {/* Left: Vehicle Specs & Interactive Planning Slider */}
            <div className="space-y-6 flex-1 w-full">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-md text-xs font-mono bg-[#121216] text-[#A1A1AA] border border-white/[0.12] flex items-center space-x-1.5 font-bold">
                  <Car className="w-3.5 h-3.5 text-[#A1A1AA]" />
                  <span>Active Vehicle Specification</span>
                </span>
                <span className="text-xs font-mono text-[#71717A]">
                  {activeVehicle.year} Model Year
                </span>
              </div>

              <div>
                <h3 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                  {activeVehicle.make} {activeVehicle.model}
                </h3>
                <p className="text-xs font-mono text-[#A1A1AA] mt-1">
                  Calibrated Vehicle Specifications • Configured for SmartChargeAI Automated Routing
                </p>
              </div>

              {/* Vehicle Specifications Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                <div className="p-3.5 rounded-lg bg-[#050507] border border-white/[0.12]">
                  <span className="text-[10px] text-[#71717A] block uppercase tracking-wider">Pack Capacity</span>
                  <span className="text-base font-bold text-white">{activeVehicle.batteryCapacity} kWh</span>
                </div>
                <div className="p-3.5 rounded-lg bg-[#050507] border border-white/[0.12]">
                  <span className="text-[10px] text-[#71717A] block uppercase tracking-wider">Peak DC Rate</span>
                  <span className="text-base font-bold text-white">{activeVehicle.maxChargingSpeed} kW</span>
                </div>
                <div className="p-3.5 rounded-lg bg-[#050507] border border-white/[0.12]">
                  <span className="text-[10px] text-[#71717A] block uppercase tracking-wider">Rated Range</span>
                  <span className="text-base font-bold text-zinc-300">{activeVehicle.rangeKm} km</span>
                </div>
                <div className="p-3.5 rounded-lg bg-[#050507] border border-white/[0.12]">
                  <span className="text-[10px] text-[#71717A] block uppercase tracking-wider">Connectors</span>
                  <span className="text-xs font-bold text-white truncate block">{activeVehicle.connectors.join(', ')}</span>
                </div>
              </div>

              {/* Trip Simulation Battery Level */}
              <div className="p-4 rounded-lg bg-[#050507] border border-white/[0.12] space-y-3">
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-[#A1A1AA] font-bold flex items-center space-x-1.5">
                    <BatteryCharging className="w-4 h-4 text-[#A1A1AA]" />
                    <span>Route Planning Battery Simulation:</span>
                  </span>
                  <span className="text-white font-bold text-sm">{currentSoC}% ({remainingKwh} kWh)</span>
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
                  <span>Simulated Usable Range: <strong className="text-white font-bold">{usableRangeKm} km</strong></span>
                  <span>Energy Needed to 80%: <strong className="text-white font-bold">{energyNeededTo80} kWh</strong></span>
                </div>
                <p className="text-[10px] font-mono text-[#71717A] italic">
                  * Note: Adjusting this slider calibrates battery simulation in Trip Planner and Cost Calculator without altering your physical EV state.
                </p>
              </div>

              {/* Action Buttons (Solid White Primary & Titanium Outline Secondary) */}
              <div className="flex items-center space-x-3 pt-2">
                <button
                  onClick={() => setCurrentPage('dashboard')}
                  className="px-5 py-2.5 rounded-lg bg-transparent border border-white/20 hover:border-white/40 text-white font-mono text-xs font-bold transition-all"
                >
                  Switch EV in Dashboard →
                </button>
                <button
                  onClick={() => setCurrentPage('garage')}
                  className="px-5 py-2.5 rounded-lg bg-white text-[#050507] hover:bg-zinc-200 font-mono text-xs font-bold uppercase tracking-wider transition-all"
                >
                  Open Full EV Garage →
                </button>
              </div>
            </div>

            {/* Right: Vehicle Chassis Showcase */}
            <div className="w-full lg:w-96 shrink-0 relative rounded-lg overflow-hidden bg-[#050507] border border-white/[0.08] p-6 flex flex-col items-center justify-center">
              <img 
                src={activeVehicle.image || '/assets/batman_be6.png'} 
                alt={activeVehicle.model}
                className="w-full h-52 object-contain drop-shadow-[0_15px_30px_rgba(0,0,0,0.95)]"
                onError={(e) => { (/** @type {HTMLImageElement} */ (e.currentTarget)).src = '/assets/batman_be6.png'; }}
              />
              <div className="w-full pt-3 mt-3 border-t border-white/[0.06] flex items-center justify-between text-xs font-mono text-zinc-400">
                <span>Color: <strong className="text-white">{activeVehicle.color}</strong></span>
                <span className="text-zinc-300 font-bold">{activeVehicle.maxChargingSpeed >= 200 ? '800V Architecture' : '400V Architecture'}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Core Platform Capabilities Grid (Architectural Cards) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-2 mb-10">
          <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-[0.2em] font-bold block">
            Platform Capabilities
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Built for Modern EV Drivers & Fleet Operators
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {featureCards.map((feat, i) => {
            const Icon = feat.icon;
            return (
              <div 
                key={i} 
                className="bg-[#0B0B0E] rounded-xl p-8 border border-white/[0.12] hover:border-white/30 transition-all relative overflow-hidden group"
              >
                <div className="flex items-start justify-between mb-6">
                  <div className="w-12 h-12 rounded-lg bg-[#121216] border border-white/[0.12] flex items-center justify-center text-white group-hover:scale-105 transition-transform">
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-mono text-[#A1A1AA] bg-[#121216] px-2.5 py-1 rounded border border-white/[0.12]">
                    {feat.tag}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2 tracking-tight">
                  {feat.title}
                </h3>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  {feat.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* 7. Original Exploded Powertrain & Flow Animation (Interactive 3D Architectural Exploder) */}
      <ExplodedViewSection />
    </div>
  );
}
