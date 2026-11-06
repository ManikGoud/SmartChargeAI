import React from 'react';
import { 
  MapPin, 
  Info, 
  Navigation, 
  Check 
} from 'lucide-react';

/**
 * AIStationRecommendationCard
 * Isolated component for verified AI charging station recommendations.
 * Strict Black & White Monochrome Automotive Digital Cockpit theme.
 *
 * @param {{
 *   station: any;
 *   activeVehicle?: any;
 *   onViewDetails: (st: any) => void;
 *   onNavigate: (st: any) => void;
 *   onViewMap: (st: any) => void;
 * }} props
 */
export function AIStationRecommendationCard({
  station,
  activeVehicle,
  onViewDetails,
  onNavigate,
  onViewMap
}) {
  if (!station) return null;

  const availPorts = station.availablePorts !== undefined 
    ? station.availablePorts 
    : (station.available_ports || 0);

  const totalPorts = station.totalPorts !== undefined 
    ? station.totalPorts 
    : (station.total_ports || 0);

  const isAvailable = station.status === 'Available' && availPorts > 0;
  const powerKw = station.peakPowerKw || station.peak_power_kw || 60;
  
  const effectivePower = activeVehicle?.maxChargingSpeed 
    ? Math.min(powerKw, activeVehicle.maxChargingSpeed) 
    : powerKw;

  const tariff = station.pricePerKwh !== undefined 
    ? station.pricePerKwh 
    : (station.price_per_kwh || 18);

  const distance = station.distanceKm !== undefined 
    ? station.distanceKm 
    : station.distance_km;

  const isCompatible = activeVehicle?.connectors && Array.isArray(station.connectors)
    ? station.connectors.some((c) => activeVehicle.connectors.includes(c.type || c.plug_type))
    : true;

  return (
    <div className="rounded-2xl p-4 bg-[#0B0B0E] border border-white/[0.12] hover:border-white/30 transition-all space-y-3 shadow-xl">
      {/* Card Header: Network & Live Port Status */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-white/10 text-white border border-white/20">
          {station.network}
        </span>
        <span className={`text-[10px] font-mono font-semibold px-2.5 py-0.5 rounded flex items-center space-x-1.5 border ${
          isAvailable 
            ? 'bg-white/10 text-white border-white/20' 
            : 'bg-[#18181C] text-zinc-400 border-white/10'
        }`}>
          {isAvailable && <span className="w-1.5 h-1.5 rounded-full bg-white inline-block shadow-[0_0_6px_rgba(255,255,255,0.8)]" />}
          <span>{station.status} • {availPorts}/{totalPorts} Ports Idle</span>
        </span>
      </div>

      {/* Station Name & Address */}
      <div>
        <h4 className="text-base font-bold text-white tracking-tight">{station.name}</h4>
        <p className="text-xs text-zinc-400 flex items-center space-x-1.5 mt-0.5">
          <MapPin className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
          <span className="truncate">{station.address}</span>
        </p>
      </div>

      {/* Telemetry Metric Pills */}
      <div className="grid grid-cols-3 gap-2 py-1 text-[11px] font-mono">
        <div className="bg-[#121216] rounded-xl p-2.5 text-center border border-white/[0.08]">
          <span className="text-zinc-500 block text-[9px] uppercase tracking-wider">Tariff</span>
          <span className="text-white font-bold text-xs font-mono">₹{Number(tariff).toFixed(2)}/kWh</span>
        </div>
        <div className="bg-[#121216] rounded-xl p-2.5 text-center border border-white/[0.08]">
          <span className="text-zinc-500 block text-[9px] uppercase tracking-wider">Max DC Power</span>
          <span className="text-white font-bold text-xs font-mono">{powerKw} kW</span>
        </div>
        <div className="bg-[#121216] rounded-xl p-2.5 text-center border border-white/[0.08]">
          <span className="text-zinc-500 block text-[9px] uppercase tracking-wider">Distance</span>
          <span className="text-zinc-300 font-bold text-xs font-mono">
            {distance !== undefined ? `${distance} km` : 'Near'}
          </span>
        </div>
      </div>

      {/* Connectors & Vehicle Compatibility */}
      <div className="flex flex-wrap items-center justify-between gap-1 text-[10px] font-mono pt-1">
        <div className="flex flex-wrap gap-1">
          {Array.isArray(station.connectors) ? station.connectors.map((c, i) => (
            <span key={i} className="px-1.5 py-0.5 rounded bg-[#121216] text-zinc-300 border border-white/[0.08]">
              {c.type || c.plug_type} ({c.powerKw || c.power_kw}kW)
            </span>
          )) : null}
        </div>
        {isCompatible ? (
          <span className="text-zinc-300 text-[10px] font-semibold flex items-center space-x-1 font-mono">
            <Check className="w-3 h-3 text-white" />
            <span>Intake: <strong className="text-white font-bold">{effectivePower} kW</strong></span>
          </span>
        ) : null}
      </div>

      {/* Action Buttons: View Details, Navigate to Hub, View on Map */}
      <div className="pt-2 border-t border-white/[0.08] flex items-center space-x-2">
        <button
          type="button"
          onClick={() => onViewDetails(station)}
          className="flex-1 py-2 px-3 rounded-xl bg-[#121216] hover:bg-white/10 border border-white/15 text-xs font-mono text-zinc-200 hover:text-white flex items-center justify-center space-x-1.5 transition-all"
        >
          <Info className="w-3.5 h-3.5 text-zinc-400" />
          <span>Details</span>
        </button>

        <button
          type="button"
          onClick={() => onNavigate(station)}
          className="flex-1 py-2 px-3 rounded-xl bg-white hover:bg-zinc-200 text-[#050507] text-xs font-bold font-mono uppercase flex items-center justify-center space-x-1.5 transition-all shadow-md"
        >
          <Navigation className="w-3.5 h-3.5 fill-[#050507]" />
          <span>Navigate</span>
        </button>

        <button
          type="button"
          onClick={() => onViewMap(station)}
          title="View on Interactive Map"
          className="py-2 px-3 rounded-xl bg-[#121216] hover:bg-white/10 border border-white/15 text-xs font-mono text-zinc-300 hover:text-white flex items-center justify-center space-x-1 transition-all"
        >
          <MapPin className="w-3.5 h-3.5 text-zinc-400" />
          <span className="hidden sm:inline">Map</span>
        </button>
      </div>
    </div>
  );
}
