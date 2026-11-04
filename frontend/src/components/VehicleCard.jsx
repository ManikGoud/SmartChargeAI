import React from 'react';
import { Zap, BatteryCharging, CheckCircle2, ShieldCheck, Gauge, Award } from 'lucide-react';
import { Badge } from './Badge';

export function VehicleCard({ vehicle, isActive, onSelect, currentSoC, onSoCChange }) {
  const soc = isActive ? currentSoC : vehicle.currentSoC;
  const usableRange = Math.round((vehicle.rangeKm * soc) / 100);
  const remainingKwh = ((vehicle.batteryCapacity * soc) / 100).toFixed(1);

  return (
    <div 
      className={`glass-panel rounded-3xl p-6 transition-all duration-300 relative overflow-hidden flex flex-col justify-between ${
        isActive 
          ? 'border-brand-cyan/60 shadow-cyan-glow bg-dark-900/90' 
          : 'border-white/5 hover:border-white/20'
      }`}
    >
      {/* Active Indicator Ribbon */}
      {isActive && (
        <div className="absolute top-0 right-0 bg-brand-cyan text-dark-950 px-4 py-1 rounded-bl-2xl text-[10px] font-mono font-extrabold uppercase tracking-widest flex items-center space-x-1 shadow-md">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Active EV</span>
        </div>
      )}

      <div>
        {/* Make and Model */}
        <div className="flex items-center space-x-2 text-xs font-mono text-brand-cyan mb-1">
          <span>{vehicle.year}</span>
          <span>•</span>
          <span className="uppercase">{vehicle.make}</span>
          {vehicle.isCustom && (
            <span className="px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 text-[9px] border border-purple-500/30">
              CUSTOM
            </span>
          )}
        </div>
        <h3 className="text-xl font-extrabold text-white mb-3">
          {vehicle.model}
        </h3>

        {/* Visual EV Image Asset */}
        <div className="relative w-full h-40 rounded-2xl overflow-hidden bg-dark-950/80 border border-white/5 mb-5 flex items-center justify-center p-2 group">
          <img 
            src={vehicle.image} 
            alt={`${vehicle.make} ${vehicle.model}`}
            className="w-full h-full object-contain filter drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)] group-hover:scale-105 transition-transform duration-500"
            onError={(e) => {
              // Fallback to default asset if custom image missing
              e.target.src = '/assets/batman_be6.png';
            }}
          />
          <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded text-[10px] font-mono bg-dark-900/80 backdrop-blur-sm border border-white/10 text-slate-400">
            {vehicle.color}
          </div>
        </div>

        {/* Vehicle Specs Grid */}
        <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-dark-950/60 border border-white/5 mb-4 text-xs font-mono">
          <div>
            <span className="text-slate-500 text-[10px] block">BATTERY</span>
            <span className="text-white font-bold">{vehicle.batteryCapacity} <span className="text-[10px] font-normal text-slate-400">kWh</span></span>
          </div>
          <div>
            <span className="text-slate-500 text-[10px] block">MAX DC RATE</span>
            <span className="text-brand-cyan font-bold">{vehicle.maxChargingSpeed} <span className="text-[10px] font-normal text-slate-400">kW</span></span>
          </div>
          <div>
            <span className="text-slate-500 text-[10px] block">MAX RANGE</span>
            <span className="text-emerald-400 font-bold">{vehicle.rangeKm} <span className="text-[10px] font-normal text-slate-400">km</span></span>
          </div>
        </div>

        {/* Supported Connectors */}
        <div className="mb-4">
          <span className="text-[10px] font-mono uppercase text-slate-500 block mb-1.5">Supported Plugs</span>
          <div className="flex flex-wrap gap-1.5">
            {vehicle.connectors.map((c, i) => (
              <span key={i} className="px-2 py-0.5 rounded text-[11px] font-mono bg-dark-850 text-slate-300 border border-white/10">
                {c}
              </span>
            ))}
          </div>
        </div>

        {/* Battery SoC Slider (Interactive for active vehicle) */}
        <div className="p-3.5 rounded-xl bg-dark-950/70 border border-white/5 space-y-2 mb-4">
          <div className="flex justify-between items-center text-xs font-mono">
            <span className="text-slate-400 flex items-center space-x-1">
              <BatteryCharging className="w-3.5 h-3.5 text-brand-cyan" />
              <span>Charge Level (SoC)</span>
            </span>
            <span className="font-bold text-brand-cyan">{soc}% ({remainingKwh} kWh)</span>
          </div>

          <input
            type="range"
            min="5"
            max="100"
            value={soc}
            disabled={!isActive}
            onChange={(e) => onSoCChange && onSoCChange(e.target.value)}
            className={`w-full h-1.5 rounded-lg appearance-none cursor-pointer ${
              isActive ? 'bg-dark-800 accent-brand-cyan' : 'bg-dark-850 opacity-60 cursor-not-allowed'
            }`}
          />

          <div className="flex justify-between items-center text-[11px] font-mono text-slate-400 pt-1">
            <span>Usable Range:</span>
            <span className="text-emerald-400 font-bold">~{usableRange} km</span>
          </div>
        </div>
      </div>

      {/* Select Action Button */}
      <button
        onClick={() => onSelect(vehicle.id)}
        disabled={isActive}
        className={`w-full py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center space-x-2 ${
          isActive 
            ? 'bg-brand-cyan/10 text-brand-cyan border border-brand-cyan/30 cursor-default' 
            : 'bg-white/5 text-slate-200 border border-white/10 hover:bg-brand-cyan hover:text-dark-950 hover:border-brand-cyan shadow-sm'
        }`}
      >
        {isActive ? (
          <>
            <CheckCircle2 className="w-4 h-4" />
            <span>Currently Selected</span>
          </>
        ) : (
          <span>Select this Vehicle</span>
        )}
      </button>
    </div>
  );
}

