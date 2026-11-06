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
  BatteryCharging,
  Navigation
} from 'lucide-react';
import { useVehicle } from '../context/VehicleContext';
import { useStations } from '../context/StationContext';

export function StationCard({ station, onSelect, onNavigate, isSelected }) {
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
      className={`rounded-xl p-5 transition-all duration-200 relative group cursor-pointer border ${
        isSelected 
          ? 'bg-[#121216] border-white shadow-2xl' 
          : 'bg-[#0B0B0E] border-white/[0.12] hover:border-white/30 hover:bg-[#101014]'
      }`}
      onClick={() => onSelect && onSelect(station)}
    >
      {/* Top row: Network / Operator & Bookmark */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#A1A1AA] font-bold">
              {station.network}
            </span>
            <span className="text-[#71717A]">•</span>
            <span className="text-[11px] text-[#A1A1AA] font-mono">
              {station.distanceKm} km away
            </span>
            {isAvailable && (
              <>
                <span className="text-[#71717A]">•</span>
                <span className="inline-flex items-center space-x-1 text-[10px] font-mono text-white">
                  <span className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_6px_rgba(255,255,255,0.8)]"></span>
                  <span>ONLINE</span>
                </span>
              </>
            )}
          </div>
          <h3 className="text-base font-bold text-white group-hover:text-zinc-200 transition-colors leading-snug">
            {station.name}
          </h3>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleBookmark(station.id);
          }}
          className={`p-2 rounded-lg border transition-all ${
            isBookmarked 
              ? 'bg-white text-[#050507] border-white' 
              : 'bg-[#121216] text-[#A1A1AA] border-white/[0.12] hover:text-white hover:border-white/30'
          }`}
          title={isBookmarked ? "Remove from favorites" : "Save to favorites"}
        >
          <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-current' : ''}`} />
        </button>
      </div>

      {/* Address */}
      <div className="flex items-center space-x-1.5 text-xs text-[#A1A1AA] mb-4">
        <MapPin className="w-3.5 h-3.5 text-[#71717A] shrink-0" />
        <span className="truncate">{station.address}</span>
      </div>

      {/* Primary Metrics Grid (Strict Monochrome Telemetry) */}
      <div className="grid grid-cols-3 gap-2 py-3 px-3.5 rounded-lg bg-[#050507] border border-white/[0.12] mb-4 text-xs font-mono">
        <div>
          <span className="text-[#71717A] text-[10px] block uppercase">Peak Power</span>
          <span className="text-white font-bold text-sm">
            {station.peakPowerKw} <span className="text-[10px] font-normal text-[#A1A1AA]">kW DC</span>
          </span>
        </div>
        <div>
          <span className="text-[#71717A] text-[10px] block uppercase">Tariff</span>
          <span className="text-white font-bold text-sm">
            {station.currency}{station.pricePerKwh.toFixed(2)}
            <span className="text-[10px] font-normal text-[#A1A1AA]">/kWh</span>
          </span>
        </div>
        <div>
          <span className="text-[#71717A] text-[10px] block uppercase">Availability</span>
          <span className="text-white font-bold text-sm">
            {station.availablePorts}/{station.totalPorts} <span className="text-[10px] font-normal text-[#A1A1AA]">Free</span>
          </span>
        </div>
      </div>

      {/* Connector tags and compatibility */}
      <div className="flex flex-wrap items-center gap-1.5 mb-4">
        {station.connectors.map((c, i) => (
          <span 
            key={i} 
            className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#121216] text-[#A1A1AA] border border-white/[0.12]"
          >
            {c.type} ({c.powerKw}kW)
          </span>
        ))}
        {isCompatible ? (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-white/10 text-white border border-white/20 flex items-center space-x-1 font-semibold">
            <Check className="w-3 h-3 text-white" />
            <span>Vehicle Match</span>
          </span>
        ) : (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#121216] text-[#71717A] border border-white/[0.08] flex items-center space-x-1">
            <ShieldAlert className="w-3 h-3 text-[#71717A]" />
            <span>Incompatible</span>
          </span>
        )}
      </div>

      {/* Bottom Action Row */}
      <div className="flex items-center justify-between pt-3 border-t border-white/[0.08] text-xs">
        <div className="flex items-center space-x-1 text-[#A1A1AA] font-mono text-[11px]">
          <Star className="w-3.5 h-3.5 text-white fill-white" />
          <span className="font-bold text-white">{station.rating}</span>
          <span className="text-[#71717A]">({station.reviewCount})</span>
        </div>

        <div className="flex items-center space-x-2">
          {onNavigate && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onNavigate(station);
              }}
              className="px-2.5 py-1.5 rounded-lg bg-transparent border border-white/[0.12] hover:border-white/30 text-[#A1A1AA] hover:text-white flex items-center space-x-1 text-xs font-mono transition-all cursor-pointer"
              title="Start in-app navigation to this station"
            >
              <Navigation className="w-3 h-3 text-white" />
              <span>Navigate</span>
            </button>
          )}

          <button 
            onClick={(e) => {
              e.stopPropagation();
              onSelect && onSelect(station);
            }}
            className="px-3 py-1.5 rounded-lg bg-white text-[#050507] hover:bg-zinc-200 font-mono text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5 transition-all shadow-sm cursor-pointer"
          >
            <span>Details</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
