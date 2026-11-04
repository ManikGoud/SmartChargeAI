import React, { useState } from 'react';
import { 
  Car, 
  BatteryCharging, 
  PlusCircle, 
  Zap, 
  Gauge, 
  ShieldCheck, 
  Cpu, 
  SlidersHorizontal,
  CheckCircle2,
  Info,
  Video,
  Image as ImageIcon
} from 'lucide-react';
import { useVehicle } from '../context/VehicleContext';
import { VehicleCard } from '../components/VehicleCard';
import { AddVehicleModal } from '../components/AddVehicleModal';
import { Badge, DemoDataBadge } from '../components/Badge';

export function GaragePage({ setCurrentPage }) {
  const [garageMediaMode, setGarageMediaMode] = useState('image'); // 'image' | 'video'
  const garageVideoRef = useRef(null);
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

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  useEffect(() => {
    if (garageMediaMode === 'video' && garageVideoRef.current) {
      const v = garageVideoRef.current;
      v.defaultMuted = true;
      v.muted = true;
      v.playsInline = true;
      const p = v.play();
      if (p !== undefined) {
        p.catch(() => {
          v.muted = true;
          v.play().catch(() => {});
        });
      }
    }
  }, [garageMediaMode]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/5">
        <div>
          <div className="flex items-center space-x-2 text-xs font-mono text-brand-cyan mb-1.5">
            <Car className="w-4 h-4" />
            <span>VEHICLE TELEMETRY & BMS MANAGEMENT</span>
            <DemoDataBadge />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            EV Vehicle Garage
          </h1>
          <p className="text-slate-400 text-sm mt-1 max-w-2xl">
            Select or register your electric vehicle. SmartChargeAI uses these battery parameters to calibrate charge duration curves, calculate session costs, and eliminate incompatible chargers.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="self-start md:self-auto flex items-center space-x-2 px-5 py-3 rounded-2xl bg-brand-cyan text-dark-950 font-bold hover:bg-brand-cyan/90 transition-all shadow-cyan-glow text-xs uppercase font-mono tracking-wider"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Add Custom EV</span>
        </button>
      </div>

      {/* Active Vehicle Spotlight Telemetry HUD */}
      <section className="glass-panel-glow rounded-3xl p-6 sm:p-8 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
          {/* Left: Active EV Info */}
          <div className="space-y-6 flex-1 w-full">
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 rounded-full text-xs font-mono bg-brand-cyan/10 text-brand-cyan border border-brand-cyan/30 flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-brand-cyan animate-ping"></span>
                <span>Active EV Synchronized</span>
              </span>
              <span className="text-xs font-mono text-slate-400">
                Architecture: {activeVehicle.maxChargingSpeed >= 200 ? '800V High-Throughput' : '400V Standard'}
              </span>
            </div>

            <div>
              <div className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-1">
                {activeVehicle.year} {activeVehicle.make}
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                {activeVehicle.model}
              </h2>
            </div>

            {/* Interactive State of Charge Controller */}
            <div className="p-4 rounded-2xl bg-dark-950/80 border border-white/10 space-y-3">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-slate-300 font-bold flex items-center space-x-1.5">
                  <BatteryCharging className="w-4 h-4 text-brand-cyan" />
                  <span>Interactive Battery State of Charge (SoC)</span>
                </span>
                <span className="text-brand-cyan text-sm font-black">{currentSoC}%</span>
              </div>

              {/* Range Slider */}
              <input
                type="range"
                min="5"
                max="100"
                value={currentSoC}
                onChange={(e) => updateSoC(e.target.value)}
                className="w-full h-2.5 bg-dark-800 rounded-lg appearance-none cursor-pointer accent-brand-cyan"
              />

              <div className="grid grid-cols-3 gap-2 pt-2 text-center text-xs font-mono border-t border-white/5">
                <div className="p-2 rounded-lg bg-dark-900 border border-white/5">
                  <span className="text-slate-500 text-[10px] block">STORED ENERGY</span>
                  <span className="text-white font-bold">{remainingKwh} / {activeVehicle.batteryCapacity} kWh</span>
                </div>
                <div className="p-2 rounded-lg bg-dark-900 border border-white/5">
                  <span className="text-slate-500 text-[10px] block">CURRENT ESTIMATED RANGE</span>
                  <span className="text-emerald-400 font-bold">~{usableRangeKm} km</span>
                </div>
                <div className="p-2 rounded-lg bg-dark-900 border border-white/5">
                  <span className="text-slate-500 text-[10px] block">ENERGY TO 80%</span>
                  <span className="text-brand-cyan font-bold">{energyNeededTo80} kWh</span>
                </div>
              </div>
            </div>

            {/* Connectors & Fast Charging */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-mono text-slate-400">Supported Standards:</span>
              {activeVehicle.connectors.map((c, i) => (
                <span key={i} className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-white/5 text-slate-200 border border-white/10">
                  {c}
                </span>
              ))}
              <span className="text-xs font-mono text-slate-400 ml-2">Peak DC:</span>
              <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-brand-cyan/10 text-brand-cyan border border-brand-cyan/20">
                {activeVehicle.maxChargingSpeed} kW
              </span>
            </div>
          </div>

          {/* Right: Visual Showcase Image or Video Feed */}
          <div className="w-full lg:w-96 shrink-0 relative rounded-2xl overflow-hidden bg-dark-950 border border-white/10 p-4 flex flex-col items-center justify-center">
            {/* Mode Switcher */}
            <div className="w-full flex items-center justify-between pb-2 mb-2 border-b border-white/5 text-[10px] font-mono">
              <span className="text-slate-400">TELEMETRY VIEW:</span>
              <div className="flex items-center space-x-1 bg-dark-900 rounded-lg p-0.5 border border-white/5">
                <button
                  onClick={() => setGarageMediaMode('image')}
                  className={`px-2 py-0.5 rounded transition-all ${
                    garageMediaMode === 'image' ? 'bg-brand-cyan text-dark-950 font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Chassis Photo
                </button>
                <button
                  onClick={() => setGarageMediaMode('video')}
                  className={`px-2 py-0.5 rounded transition-all ${
                    garageMediaMode === 'video' ? 'bg-brand-cyan text-dark-950 font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Live Highway Feed
                </button>
              </div>
            </div>

            {garageMediaMode === 'image' ? (
              <img 
                src={activeVehicle.image} 
                alt={activeVehicle.model}
                className="w-full h-48 object-contain drop-shadow-[0_15px_30px_rgba(0,0,0,0.9)] transition-all"
                onError={(e) => { e.target.src = '/assets/batman_be6.png'; }}
              />
            ) : (
              <div className="w-full h-48 rounded-xl overflow-hidden relative border border-white/10 bg-black">
                <video
                  ref={garageVideoRef}
                  src="/assets/take%202.mp4"
                  autoPlay
                  loop
                  muted
                  playsInline
                  preload="auto"
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-dark-950/80 text-[9px] font-mono text-emerald-400 border border-emerald-500/20">
                  ● Telemetry Stream (take 2.mp4)
                </div>
              </div>
            )}

            <div className="w-full flex items-center justify-between pt-3 border-t border-white/5 text-[11px] font-mono text-slate-400">
              <span>Color: {activeVehicle.color}</span>
              <button 
                onClick={() => setCurrentPage('discovery')}
                className="text-brand-cyan hover:underline font-bold"
              >
                Find Compatible Plugs →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Vehicle Garage Grid */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-white tracking-tight">
              Vehicle Garage Profiles ({vehicles.length})
            </h3>
            <p className="text-xs text-slate-400">Click any vehicle to switch active EV context across the application</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vehicles.map((v) => (
            <VehicleCard
              key={v.id}
              vehicle={v}
              isActive={activeVehicle.id === v.id}
              currentSoC={currentSoC}
              onSoCChange={updateSoC}
              onSelect={selectVehicle}
            />
          ))}
        </div>
      </section>

      {/* Add Custom Vehicle Modal */}
      <AddVehicleModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />
    </div>
  );
}

