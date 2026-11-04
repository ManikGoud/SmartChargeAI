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
  Layers, 
  SlidersHorizontal,
  ChevronRight,
  TrendingDown,
  Compass,
  Bot,
  BarChart3,
  Route,
  Camera,
  Image as ImageIcon
} from 'lucide-react';
import { Badge, DemoDataBadge } from '../components/Badge';
import { useVehicle } from '../context/VehicleContext';
import { CinematicScrollExperience } from '../components/CinematicScrollExperience';
import { DrivingSequencesSection } from '../components/DrivingSequencesSection';
import { ExplodedViewSection } from '../components/ExplodedViewSection';

export function HomePage({ setCurrentPage, onSearch }) {
  const { activeVehicle, currentSoC, usableRangeKm } = useVehicle();
  const [query, setQuery] = useState('');
  const [selectedAssetIdx, setSelectedAssetIdx] = useState(0);

  const visualAssets = [
    {
      title: 'High-Power Highway Charging Plaza',
      subtitle: 'Outer Ring Road (ORR) Gachibowli Corridor',
      src: '/assets/shot1.png',
      tag: 'Ultra-Fast Hub',
      desc: '350 kW liquid-cooled dispensers supporting 800V architectures and high-density throughput.'
    },
    {
      title: 'Dual-Port 240 kW CCS-2 Dispensers',
      subtitle: 'HITEC City Commercial Charging Zone',
      src: '/assets/shot2.png',
      tag: 'CCS-2 Standard',
      desc: 'Simultaneous dynamic load sharing across multiple active vehicle charging sessions.'
    },
    {
      title: 'Dedicated Rapid Turnaround Bays',
      subtitle: 'Secunderabad Transport Junction',
      src: '/assets/shot3.png',
      tag: 'Highway Corridor',
      desc: 'Wide-berth bays designed for long-distance commercial and private EV transit.'
    },
    {
      title: 'Fleet Charging & Telematics Monitoring',
      subtitle: 'Shamshabad RGIA Airport Logistics Plaza',
      src: '/assets/shot4.png',
      tag: 'Fleet Telematics',
      desc: 'SmartChargeAI IoT gateway monitoring real-time grid capacity and transformer load.'
    },
    {
      title: 'Rapid DC Dispenser Interface Unit',
      subtitle: 'Banjara Hills FastHub',
      src: '/assets/k1.png',
      tag: 'Smart UI/UX',
      desc: 'Direct contactless card, RFID, and automated Plug & Charge vehicle handshakes.'
    },
    {
      title: 'High-Efficiency Overnight Depot',
      subtitle: 'Kokapet Central Charging Station',
      src: '/assets/k2.png',
      tag: 'Green Energy',
      desc: 'Solar canopy-coupled battery energy storage buffer mitigating peak grid demand.'
    }
  ];

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (onSearch) onSearch(query);
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
    <div className="space-y-24 pb-20 overflow-hidden">
      {/* 4-Chapter Scroll-Driven Cinematic 3D Canvas Background Experience */}
      <CinematicScrollExperience 
        setCurrentPage={setCurrentPage} 
        onSearch={onSearch} 
      />

      {/* Network Live Metrics Strip (Labeled Demo Values) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="glass-panel-glow rounded-3xl p-6 sm:p-8 relative">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 mb-6 border-b border-white/5 gap-2">
            <div>
              <h3 className="text-sm font-mono uppercase tracking-wider text-slate-200 font-bold flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Active Charging Network Telemetry</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Aggregated real-time metrics across registered high-power charging plazas</p>
            </div>
            <DemoDataBadge />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="space-y-1">
              <span className="text-3xl sm:text-4xl font-extrabold font-mono text-white tracking-tight">1,420+</span>
              <p className="text-xs font-mono text-slate-400 uppercase">Compatible Ports Indexed</p>
              <span className="text-[10px] text-emerald-400 font-mono">98.4% Uptime Target</span>
            </div>
            <div className="space-y-1">
              <span className="text-3xl sm:text-4xl font-extrabold font-mono text-brand-cyan tracking-tight">120 kW</span>
              <p className="text-xs font-mono text-slate-400 uppercase">Average Fast Charger Power</p>
              <span className="text-[10px] text-slate-400 font-mono">Up to 350 kW Ultra-Fast</span>
            </div>
            <div className="space-y-1">
              <span className="text-3xl sm:text-4xl font-extrabold font-mono text-emerald-400 tracking-tight">₹17.20</span>
              <p className="text-xs font-mono text-slate-400 uppercase">Median Tariff / kWh</p>
              <span className="text-[10px] text-brand-cyan font-mono">-24% vs Peak Grid Rates</span>
            </div>
            <div className="space-y-1">
              <span className="text-3xl sm:text-4xl font-extrabold font-mono text-purple-400 tracking-tight">4.8 t</span>
              <p className="text-xs font-mono text-slate-400 uppercase">Simulated CO2 Avoided</p>
              <span className="text-[10px] text-slate-400 font-mono">Equivalent 140 Trees Planted</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Workflow: Search -> Filter -> Compare -> AI Match -> Plan -> Navigate -> Charge */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-3 mb-12">
          <span className="text-xs font-mono text-brand-cyan uppercase tracking-widest font-semibold">
            The SmartChargeAI Paradigm
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Seamless 7-Step Charging Intelligence
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto text-sm">
            From the moment your battery drops to the second you unplug, our pipeline automates every decision.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
          {workflowSteps.map((step, idx) => (
            <div 
              key={idx}
              className="glass-panel p-4 rounded-2xl border border-white/5 hover:border-brand-cyan/40 hover:bg-dark-900 transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-mono font-bold text-brand-cyan bg-brand-cyan/10 px-2 py-0.5 rounded-md border border-brand-cyan/20">
                    {step.num}
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-brand-cyan transition-colors" />
                </div>
                <h4 className="text-sm font-bold text-white mb-1.5">{step.title}</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Core Features Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-3 mb-12">
          <span className="text-xs font-mono text-brand-cyan uppercase tracking-widest font-semibold">
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
                className="glass-panel rounded-3xl p-8 border border-white/5 hover:border-brand-cyan/30 transition-all relative overflow-hidden group"
              >
                <div className="flex items-start justify-between mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-brand-cyan/10 border border-brand-cyan/20 flex items-center justify-center text-brand-cyan group-hover:scale-110 transition-transform">
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-mono text-slate-400 bg-white/5 px-2.5 py-1 rounded-lg border border-white/5">
                    {feat.tag}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-brand-cyan transition-colors">
                  {feat.title}
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  {feat.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Cinematic Driving Sequences Cinema & Scrubber (take 1.mp4, take 2.mp4, take 3.mp4) */}
      <DrivingSequencesSection />

      {/* Interactive 3D Exploded Powertrain & Architecture (flow.mp4 & flowframe) */}
      <ExplodedViewSection />

      {/* Infrastructure Visual Asset Gallery */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="glass-panel rounded-3xl border border-white/10 p-6 sm:p-8 relative">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 mb-6 border-b border-white/10 gap-2">
            <div>
              <div className="inline-flex items-center space-x-2 text-xs font-mono text-brand-cyan mb-1">
                <Camera className="w-3.5 h-3.5" />
                <span>Verified Plaza Infrastructure Showcase</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-extrabold text-white">
                Indexed High-Power Charging Plaza Network
              </h3>
            </div>
            <div className="text-xs font-mono text-slate-400">
              Asset {selectedAssetIdx + 1} of {visualAssets.length}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Main Showcase Image Display */}
            <div className="lg:col-span-8 relative rounded-2xl overflow-hidden border border-white/10 bg-dark-950 aspect-video group">
              <img 
                src={visualAssets[selectedAssetIdx].src} 
                alt={visualAssets[selectedAssetIdx].title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute top-3 left-3 px-3 py-1 rounded-lg bg-dark-950/80 backdrop-blur-md border border-white/10 text-xs font-mono text-brand-cyan font-bold">
                {visualAssets[selectedAssetIdx].tag}
              </div>
              <div className="absolute bottom-3 left-3 right-3 p-3 rounded-xl bg-dark-950/85 backdrop-blur-md border border-white/10">
                <h4 className="text-sm font-bold text-white">{visualAssets[selectedAssetIdx].title}</h4>
                <p className="text-xs text-slate-400 mt-0.5">{visualAssets[selectedAssetIdx].subtitle}</p>
              </div>
            </div>

            {/* Thumbnail Navigation */}
            <div className="lg:col-span-4 space-y-2">
              <span className="text-xs font-mono uppercase tracking-wider text-slate-400 block mb-2">
                Select Charging Hub View:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-1 gap-2">
                {visualAssets.map((asset, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedAssetIdx(idx)}
                    className={`flex items-center space-x-3 p-2 rounded-xl text-left border transition-all ${
                      selectedAssetIdx === idx
                        ? 'bg-brand-cyan/15 border-brand-cyan text-brand-cyan shadow-cyan-glow'
                        : 'bg-dark-950/60 border-white/5 text-slate-400 hover:text-white hover:border-white/20'
                    }`}
                  >
                    <img 
                      src={asset.src} 
                      alt="" 
                      className="w-12 h-10 object-cover rounded-lg shrink-0 border border-white/10"
                    />
                    <div className="min-w-0">
                      <div className="text-xs font-bold truncate text-white">{asset.title.split(' ')[0]} {asset.title.split(' ')[1]}</div>
                      <div className="text-[10px] text-slate-400 truncate">{asset.tag}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Cinematic Showcase: EV Charging Telemetry in Focus */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="glass-panel rounded-3xl border border-white/10 p-8 sm:p-12 relative overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            {/* Visual Asset Spotlight */}
            <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-dark-950 shadow-2xl group">
              <img 
                src="/assets/batman_be6.png" 
                alt="SmartChargeAI Connected Vehicle"
                className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute top-3 left-3 px-3 py-1 rounded-lg bg-dark-900/80 backdrop-blur-md border border-white/10 text-xs font-mono text-slate-300">
                Connected Vehicle HUD • 800V Architecture
              </div>
              <div className="absolute bottom-3 right-3 px-3 py-1 rounded-lg bg-emerald-500/20 backdrop-blur-md border border-emerald-500/30 text-xs font-mono text-emerald-400 font-bold">
                BMS Synchronized
              </div>
            </div>

            {/* Explanation & Action */}
            <div className="space-y-6">
              <span className="text-xs font-mono text-brand-cyan uppercase tracking-widest font-semibold">
                Vehicle-to-Cloud Integration
              </span>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Not a Car Ad. A Groundbreaking Charging Operating System.
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                SmartChargeAI is focused entirely on post-purchase EV ownership excellence. By knowing the precise battery chemistry, connector standard, and thermal charging curve of your vehicle, we shield you from broken chargers, slow AC sockets, and surge prices.
              </p>

              <div className="space-y-3 font-mono text-xs">
                <div className="flex items-center space-x-3 text-slate-300">
                  <span className="w-5 h-5 rounded-full bg-brand-cyan/20 text-brand-cyan flex items-center justify-center font-bold">✓</span>
                  <span>Eliminates connector mismatch anxiety (CCS2 vs CHAdeMO vs Type 2)</span>
                </div>
                <div className="flex items-center space-x-3 text-slate-300">
                  <span className="w-5 h-5 rounded-full bg-brand-cyan/20 text-brand-cyan flex items-center justify-center font-bold">✓</span>
                  <span>Avoids charging above 80% when CC-CV saturation slows throughput</span>
                </div>
                <div className="flex items-center space-x-3 text-slate-300">
                  <span className="w-5 h-5 rounded-full bg-brand-cyan/20 text-brand-cyan flex items-center justify-center font-bold">✓</span>
                  <span>Recommends alternate stations when waiting queues exceed 15 mins</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setCurrentPage('discovery')}
                  className="px-6 py-3 rounded-xl bg-brand-cyan text-dark-950 font-bold hover:bg-brand-cyan/90 transition-all text-xs font-mono uppercase tracking-wider shadow-cyan-glow"
                >
                  Start Charging Session Discovery →
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

