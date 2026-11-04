import React from 'react';
import { 
  X, 
  MapPin, 
  Zap, 
  Clock, 
  Star, 
  DollarSign, 
  Navigation, 
  CheckCircle2, 
  ShieldAlert, 
  BatteryCharging, 
  Wifi, 
  Coffee, 
  ShieldCheck,
  Bookmark
} from 'lucide-react';
import { Badge, DemoDataBadge } from './Badge';
import { useVehicle } from '../context/VehicleContext';
import { useStations } from '../context/StationContext';

export function StationDetailModal({ station, onClose, onOpenCalculator }) {
  const { activeVehicle, currentSoC, energyNeededTo80 } = useVehicle();
  const { bookmarkedIds, toggleBookmark } = useStations();

  if (!station) return null;

  const isBookmarked = bookmarkedIds.includes(station.id);
  const isAvailable = station.status === 'Available';

  // Compatibility
  const compatibleConnectors = activeVehicle
    ? station.connectors.filter(c => activeVehicle.connectors.includes(c.type))
    : station.connectors;
  const isCompatible = compatibleConnectors.length > 0;

  const peakCompatiblePower = isCompatible
    ? Math.min(
        Math.max(...compatibleConnectors.map(c => c.powerKw)),
        activeVehicle ? activeVehicle.maxChargingSpeed : station.peakPowerKw
      )
    : 0;

  // Estimated charging time to 80%
  // Time (hours) = Energy (kWh) / Average Power (kW) * 1.15 (accounting for taper above 70%)
  const estMinsTo80 = peakCompatiblePower > 0 && energyNeededTo80 > 0
    ? Math.round((energyNeededTo80 / (peakCompatiblePower * 0.85)) * 60)
    : 0;

  // Estimated cost to 80%
  const estCostTo80 = (energyNeededTo80 * station.pricePerKwh).toFixed(2);

  // Google Maps navigation URL
  const gmapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${station.lat},${station.lng}`;

  // Deterministic plaza visual asset mapping
  const plazaImages = {
    'st-1': '/assets/shot1.png',
    'st-2': '/assets/shot2.png',
    'st-3': '/assets/shot3.png',
    'st-4': '/assets/k1.png',
    'st-5': '/assets/shot4.png',
    'st-6': '/assets/k2.png',
    'st-7': '/assets/shot1.png',
    'st-8': '/assets/shot2.png'
  };
  const plazaPhoto = plazaImages[station.id] || '/assets/shot1.png';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark-950/80 backdrop-blur-md overflow-y-auto">
      <div 
        className="relative w-full max-w-2xl bg-dark-900 border border-brand-cyan/30 rounded-3xl shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Gradient Bar */}
        <div className="h-2 w-full bg-gradient-to-r from-brand-cyan via-brand-blue to-emerald-400"></div>

        {/* Modal Header */}
        <div className="p-6 border-b border-white/10 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 mb-1.5">
              <span className="text-xs font-mono uppercase tracking-wider text-brand-cyan font-bold">
                {station.network}
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-xs text-slate-400 font-mono">
                Operator: {station.operator}
              </span>
              <DemoDataBadge />
            </div>
            <h2 className="text-2xl font-extrabold text-white tracking-tight">
              {station.name}
            </h2>
            <div className="flex items-center space-x-2 text-xs text-slate-400 mt-1">
              <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span>{station.address}</span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => toggleBookmark(station.id)}
              className={`p-2.5 rounded-xl border transition-all ${
                isBookmarked 
                  ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' 
                  : 'bg-white/5 text-slate-400 border-white/10 hover:text-white'
              }`}
            >
              <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-rose-400' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2.5 rounded-xl bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Plaza Photo View Banner */}
          <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-dark-950 aspect-[21/9] group">
            <img 
              src={plazaPhoto} 
              alt={station.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-dark-950/80 backdrop-blur-md border border-white/10 text-[10px] font-mono text-brand-cyan">
              Verified Plaza Asset • {station.network}
            </div>
            <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-lg bg-dark-950/80 backdrop-blur-md border border-white/10 text-[10px] font-mono text-slate-300">
              Peak Power: <strong className="text-white">{station.peakPowerKw} kW</strong>
            </div>
          </div>

          {/* Active Vehicle Compatibility Banner */}
          <div className={`p-4 rounded-2xl border ${
            isCompatible 
              ? 'bg-brand-cyan/5 border-brand-cyan/30' 
              : 'bg-rose-500/5 border-rose-500/30'
          }`}>
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-xl mt-0.5 ${
                isCompatible ? 'bg-brand-cyan/10 text-brand-cyan' : 'bg-rose-500/10 text-rose-400'
              }`}>
                {isCompatible ? <CheckCircle2 className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white">
                    {isCompatible ? 'Vehicle Match Confirmed' : 'Connector Incompatibility Alert'}
                  </h4>
                  <span className="text-[11px] font-mono text-slate-400">
                    Target EV: {activeVehicle?.make} {activeVehicle?.model}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  {isCompatible ? (
                    <>
                      Compatible with your EV's <span className="text-brand-cyan font-mono font-semibold">{compatibleConnectors.map(c => c.type).join(', ')}</span> port. 
                      Effective peak throughput is capped at <span className="text-brand-cyan font-mono font-semibold">{peakCompatiblePower} kW DC</span> (Vehicle BMS limit: {activeVehicle?.maxChargingSpeed} kW).
                    </>
                  ) : (
                    <>
                      This station does not offer connectors compatible with your vehicle's {activeVehicle?.connectors.join(', ')} socket.
                    </>
                  )}
                </p>

                {/* Instant Calculation Preview */}
                {isCompatible && currentSoC < 80 && (
                  <div className="mt-3 pt-3 border-t border-brand-cyan/15 grid grid-cols-2 gap-3 text-xs font-mono">
                    <div className="bg-dark-950/60 p-2.5 rounded-xl border border-white/5">
                      <span className="text-slate-500 text-[10px] block">EST. TIME TO 80% ({currentSoC}% → 80%)</span>
                      <span className="text-brand-cyan font-bold text-sm">~{estMinsTo80} minutes</span>
                    </div>
                    <div className="bg-dark-950/60 p-2.5 rounded-xl border border-white/5">
                      <span className="text-slate-500 text-[10px] block">EST. SESSION COST ({energyNeededTo80} kWh)</span>
                      <span className="text-emerald-400 font-bold text-sm">{station.currency}{estCostTo80}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="glass-panel p-3.5 rounded-xl">
              <span className="text-[10px] text-slate-500 font-mono block">LIVE STATUS</span>
              <span className={`text-sm font-bold font-mono ${isAvailable ? 'text-emerald-400' : 'text-amber-400'}`}>
                ● {station.status}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">{station.availablePorts} of {station.totalPorts} ports idle</span>
            </div>

            <div className="glass-panel p-3.5 rounded-xl">
              <span className="text-[10px] text-slate-500 font-mono block">STATION POWER</span>
              <span className="text-sm font-bold font-mono text-brand-cyan">
                {station.peakPowerKw} kW DC
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Ultra-Fast Tier</span>
            </div>

            <div className="glass-panel p-3.5 rounded-xl">
              <span className="text-[10px] text-slate-500 font-mono block">BASE TARIFF</span>
              <span className="text-sm font-bold font-mono text-emerald-400">
                {station.currency}{station.pricePerKwh.toFixed(2)}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">per kWh delivered</span>
            </div>

            <div className="glass-panel p-3.5 rounded-xl">
              <span className="text-[10px] text-slate-500 font-mono block">RATING</span>
              <div className="flex items-center space-x-1 mt-0.5">
                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                <span className="text-sm font-bold font-mono text-slate-200">{station.rating}</span>
                <span className="text-[10px] text-slate-500">({station.reviewCount})</span>
              </div>
            </div>
          </div>

          {/* Connector Plugs List */}
          <div>
            <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold mb-2.5">
              Available Dispenser Plugs
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {station.connectors.map((c, i) => (
                <div key={i} className="p-3 rounded-xl bg-dark-950/70 border border-white/5 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-brand-cyan/10 border border-brand-cyan/20 flex items-center justify-center text-brand-cyan">
                      <Zap className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">{c.type} Fast Plug</div>
                      <div className="text-[11px] font-mono text-slate-400">{c.powerKw} kW Max • {station.currency}{c.pricePerKwh}/kWh</div>
                    </div>
                  </div>
                  <span className={`text-[11px] font-mono font-semibold ${
                    c.available > 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}>
                    {c.available}/{c.count} Free
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Amenities & Operating Hours */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="glass-panel p-4 rounded-xl">
              <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold mb-2">
                On-Site Amenities
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {station.amenities.map((item, idx) => (
                  <span key={idx} className="px-2.5 py-1 rounded-lg text-xs bg-dark-850 border border-white/5 text-slate-300">
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="glass-panel p-4 rounded-xl">
              <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold mb-2">
                Operating Schedule & Notes
              </h4>
              <div className="text-xs space-y-1.5 text-slate-300">
                <div className="flex items-center space-x-2">
                  <Clock className="w-3.5 h-3.5 text-brand-cyan" />
                  <span>Hours: <strong className="text-white">{station.operatingHours}</strong></span>
                </div>
                <div className="text-slate-400 text-[11px] pt-1">
                  {station.pricingNote}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-6 border-t border-white/10 bg-dark-950/80 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-[11px] font-mono text-slate-500">
            Coordinates: {station.lat.toFixed(4)}, {station.lng.toFixed(4)}
          </div>

          <div className="flex items-center space-x-3 w-full sm:w-auto">
            <a
              href={gmapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-initial flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-brand-cyan text-dark-950 font-bold hover:bg-brand-cyan/90 transition-all shadow-cyan-glow text-xs"
            >
              <Navigation className="w-4 h-4" />
              <span>Navigate in Google Maps</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

