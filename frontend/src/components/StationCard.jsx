import React from 'react';
import { 
  Zap, 
  MapPin, 
  Star, 
  Bookmark, 
  Check, 
  Clock, 
  ArrowRight,
  ShieldAlert,
  BatteryCharging
} from 'lucide-react';
import { Badge, DemoDataBadge } from './Badge';
import { useVehicle } from '../context/VehicleContext';
import { useStations } from '../context/StationContext';

export function StationCard({ station, onSelect, isSelected }) {
  const { activeVehicle } = useVehicle();
  const { bookmarkedIds, toggleBookmark } = useStations();

  const isBookmarked = bookmarkedIds.includes(station.id);
  const isAvailable = station.status === 'Available';

  // Check vehicle compatibility
  const isCompatible = activeVehicle ? station.connectors.some(c => 
    activeVehicle.connectors.includes(c.type)
  ) : true;

  // Max compatible speed
  const effectiveMaxSpeed = activeVehicle 
    ? Math.min(station.peakPowerKw, activeVehicle.maxChargingSpeed)
    : station.peakPowerKw;

  return (
    <div 
      className={`glass-panel rounded-2xl p-5 transition-all duration-300 relative group hover:border-brand-cyan/40 hover:shadow-cyan-glow cursor-pointer ${
        isSelected ? 'border-brand-cyan shadow-cyan-glow bg-dark-900/90' : 'border-white/5'
      }`}
      onClick={() => onSelect && onSelect(station)}
    >
      {/* Top row: Network / Operator & Bookmark */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-[11px] font-mono uppercase tracking-wider text-brand-cyan font-semibold">
              {station.network}
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-[11px] text-slate-400 font-mono">
              {station.distanceKm} km away
            </span>
          </div>
          <h3 className="text-base font-bold text-white group-hover:text-brand-cyan transition-colors leading-snug">
            {station.name}
          </h3>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleBookmark(station.id);
          }}
          className={`p-2 rounded-xl border transition-all ${
            isBookmarked 
              ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' 
              : 'bg-white/5 text-slate-400 border-white/5 hover:text-white hover:bg-white/10'
          }`}
          title={isBookmarked ? "Remove from favorites" : "Save to favorites"}
        >
          <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-rose-400' : ''}`} />
        </button>
      </div>

      {/* Address */}
      <div className="flex items-center space-x-1.5 text-xs text-slate-400 mb-4">
        <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
        <span className="truncate">{station.address}</span>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-3 gap-2 py-3 px-3 rounded-xl bg-dark-950/70 border border-white/5 mb-4 text-xs font-mono">
        <div>
          <span className="text-slate-500 text-[10px] block">PEAK POWER</span>
          <span className="text-brand-cyan font-bold text-sm">
            {station.peakPowerKw} <span className="text-[10px] font-normal">kW DC</span>
          </span>
        </div>
        <div>
          <span className="text-slate-500 text-[10px] block">PRICE / KWH</span>
          <span className="text-emerald-400 font-bold text-sm">
            {station.currency}{station.pricePerKwh.toFixed(2)}
          </span>
        </div>
        <div>
          <span className="text-slate-500 text-[10px] block">AVAILABILITY</span>
          <span className={`font-bold text-sm ${isAvailable ? 'text-emerald-400' : 'text-amber-400'}`}>
            {station.availablePorts}/{station.totalPorts} <span className="text-[10px] font-normal">Free</span>
          </span>
        </div>
      </div>

      {/* Connector tags and compatibility */}
      <div className="flex flex-wrap items-center gap-1.5 mb-4">
        {station.connectors.map((c, i) => (
          <span 
            key={i} 
            className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-dark-850 text-slate-300 border border-white/10"
          >
            {c.type} ({c.powerKw}kW)
          </span>
        ))}
        {isCompatible ? (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-brand-cyan/10 text-brand-cyan border border-brand-cyan/20 flex items-center space-x-1">
            <Check className="w-3 h-3" />
            <span>Vehicle Match</span>
          </span>
        ) : (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center space-x-1">
            <ShieldAlert className="w-3 h-3" />
            <span>Incompatible</span>
          </span>
        )}
      </div>

      {/* Bottom Action Row */}
      <div className="flex items-center justify-between pt-3 border-t border-white/5 text-xs">
        <div className="flex items-center space-x-1 text-slate-400 font-mono text-[11px]">
          <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
          <span className="font-bold text-slate-200">{station.rating}</span>
          <span>({station.reviewCount})</span>
        </div>

        <button 
          onClick={(e) => {
            e.stopPropagation();
            onSelect && onSelect(station);
          }}
          className="flex items-center space-x-1.5 text-brand-cyan font-semibold hover:text-white transition-colors group-hover:translate-x-0.5"
        >
          <span>View Station</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

