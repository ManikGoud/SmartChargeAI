import React from 'react';
import { 
  Zap, 
  MapPin, 
  Star, 
  Bookmark, 
  CheckCircle2, 
  ShieldAlert, 
  Clock, 
  Navigation, 
  X, 
  Calculator,
  ExternalLink,
  Share2
} from 'lucide-react';
import { useVehicle } from '../context/VehicleContext';
import { useStations } from '../context/StationContext';

export function StationDetailModal({ station, onClose, onOpenCalculator, onNavigate }) {
  const { activeVehicle, currentSoC, energyNeededTo80 } = useVehicle();
  const { bookmarkedIds, toggleBookmark } = useStations();

  if (!station) return null;

  const isBookmarked = bookmarkedIds.includes(station.id);
  const isAvailable = station.status === 'Available';

  // Check vehicle compatibility
  const compatibleConnectors = activeVehicle ? station.connectors.filter(c => 
    activeVehicle.connectors.includes(c.type)
  ) : [];

  const isCompatible = compatibleConnectors.length > 0;
  const peakCompatiblePower = activeVehicle 
    ? Math.min(station.peakPowerKw, activeVehicle.maxChargingSpeed)
    : station.peakPowerKw;

  // Simple estimated charge time to 80%
  const estMinsTo80 = peakCompatiblePower > 0 
    ? Math.max(10, Math.round((energyNeededTo80 / peakCompatiblePower) * 60 * 1.15)) 
    : 30;

  // Estimated cost to 80%
  const estCostTo80 = (energyNeededTo80 * station.pricePerKwh).toFixed(2);

  // Plaza photo fallback
  const plazaPhoto = station.image || '/assets/batman_be6.png';

  // External Map link
  const osmUrl = `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=17.445%2C78.382%3B${station.lat}%2C${station.lng}`;

  const handleStartNavigation = () => {
    if (onNavigate) {
      onNavigate(station);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div 
        className="relative w-full max-w-2xl bg-[#0B0B0E] border border-white/[0.12] rounded-xl shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Monochrome Hairline Accent */}
        <div className="h-1 w-full bg-white/20"></div>

        {/* Modal Header */}
        <div className="p-6 border-b border-white/[0.08] flex items-start justify-between gap-4 bg-[#0B0B0E]">
          <div>
            <div className="flex items-center space-x-2 mb-1.5">
              <span className="text-xs font-mono uppercase tracking-wider text-[#A1A1AA] font-bold">
                {station.network}
              </span>
              <span className="text-[#71717A]">•</span>
              <span className="text-xs text-[#A1A1AA] font-mono">
                Operator: {station.operator}
              </span>
            </div>
            <h2 className="text-2xl font-extrabold text-white tracking-tight">
              {station.name}
            </h2>
            <div className="flex items-center space-x-2 text-xs text-[#A1A1AA] mt-1">
              <MapPin className="w-3.5 h-3.5 text-[#71717A] shrink-0" />
              <span>{station.address}</span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => toggleBookmark(station.id)}
              className={`p-2.5 rounded-lg border transition-all ${
                isBookmarked 
                  ? 'bg-white text-[#050507] border-white' 
                  : 'bg-[#121216] text-[#A1A1AA] border-white/[0.12] hover:text-white hover:border-white/30'
              }`}
            >
              <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2.5 rounded-lg bg-[#121216] text-[#A1A1AA] hover:text-white border border-white/[0.12] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Plaza Photo View Banner */}
          <div className="relative rounded-xl overflow-hidden border border-white/[0.12] bg-[#050507] aspect-[21/9] group">
            <img 
              src={plazaPhoto} 
              alt={station.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute top-3 left-3 px-2.5 py-1 rounded bg-black/80 backdrop-blur-md border border-white/[0.12] text-[10px] font-mono text-white">
              Verified Plaza Asset • {station.network}
            </div>
            <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded bg-black/80 backdrop-blur-md border border-white/[0.12] text-[10px] font-mono text-[#A1A1AA]">
              Peak Power: <strong className="text-white">{station.peakPowerKw} kW</strong>
            </div>
          </div>

          {/* Active Vehicle Compatibility Banner */}
          <div className={`p-4 rounded-xl border ${
            isCompatible 
              ? 'bg-[#121216] border-white/[0.12]' 
              : 'bg-[#121216] border-white/[0.08]'
          }`}>
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg mt-0.5 bg-white/10 text-white">
                {isCompatible ? <CheckCircle2 className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white">
                    {isCompatible ? 'Vehicle Match Confirmed' : 'Connector Incompatibility Alert'}
                  </h4>
                  <span className="text-[11px] font-mono text-[#A1A1AA]">
                    Target EV: {activeVehicle?.make} {activeVehicle?.model}
                  </span>
                </div>
                <p className="text-xs text-[#A1A1AA] mt-1 leading-relaxed">
                  {isCompatible ? (
                    <>
                      Compatible with your EV's <span className="text-white font-mono font-semibold">{compatibleConnectors.map(c => c.type).join(', ')}</span> port. 
                      Effective peak throughput is capped at <span className="text-white font-mono font-semibold">{peakCompatiblePower} kW DC</span> (Vehicle BMS limit: {activeVehicle?.maxChargingSpeed} kW).
                    </>
                  ) : (
                    <>
                      This station does not offer connectors compatible with your vehicle's {activeVehicle?.connectors.join(', ')} socket.
                    </>
                  )}
                </p>

                {/* Instant Calculation Preview */}
                {isCompatible && currentSoC < 80 && (
                  <div className="mt-3 pt-3 border-t border-white/[0.08] grid grid-cols-2 gap-3 text-xs font-mono">
                    <div className="bg-[#050507] p-2.5 rounded-lg border border-white/[0.12]">
                      <span className="text-[#71717A] text-[10px] block">EST. TIME TO 80% ({currentSoC}% → 80%)</span>
                      <span className="text-white font-bold text-sm">~{estMinsTo80} minutes</span>
                    </div>
                    <div className="bg-[#050507] p-2.5 rounded-lg border border-white/[0.12]">
                      <span className="text-[#71717A] text-[10px] block">EST. SESSION COST ({energyNeededTo80} kWh)</span>
                      <span className="text-white font-bold text-sm">{station.currency}{estCostTo80}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-[#121216] p-3.5 rounded-lg border border-white/[0.12]">
              <span className="text-[10px] text-[#71717A] font-mono block">LIVE STATUS</span>
              <span className="text-sm font-bold font-mono text-white flex items-center space-x-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_6px_rgba(255,255,255,0.8)]"></span>
                <span>{station.status}</span>
              </span>
              <span className="text-[10px] text-[#A1A1AA] block mt-0.5">{station.availablePorts} of {station.totalPorts} ports idle</span>
            </div>

            <div className="bg-[#121216] p-3.5 rounded-lg border border-white/[0.12]">
              <span className="text-[10px] text-[#71717A] font-mono block">STATION POWER</span>
              <span className="text-sm font-bold font-mono text-white mt-0.5 block">
                {station.peakPowerKw} kW DC
              </span>
              <span className="text-[10px] text-[#71717A] block mt-0.5">HPC Fast Tier</span>
            </div>

            <div className="bg-[#121216] p-3.5 rounded-lg border border-white/[0.12]">
              <span className="text-[10px] text-[#71717A] font-mono block">BASE TARIFF</span>
              <span className="text-sm font-bold font-mono text-white mt-0.5 block">
                {station.currency}{station.pricePerKwh.toFixed(2)}
              </span>
              <span className="text-[10px] text-[#71717A] block mt-0.5">per kWh delivered</span>
            </div>

            <div className="bg-[#121216] p-3.5 rounded-lg border border-white/[0.12]">
              <span className="text-[10px] text-[#71717A] font-mono block">RATING</span>
              <div className="flex items-center space-x-1 mt-0.5">
                <Star className="w-3.5 h-3.5 text-white fill-white" />
                <span className="text-sm font-bold font-mono text-white">{station.rating}</span>
                <span className="text-[10px] text-[#71717A]">({station.reviewCount})</span>
              </div>
            </div>
          </div>

          {/* Connector Plugs List */}
          <div>
            <h4 className="text-xs font-mono uppercase tracking-wider text-[#A1A1AA] font-semibold mb-2.5">
              Available Dispenser Plugs
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {station.connectors.map((c, i) => (
                <div key={i} className="p-3 rounded-lg bg-[#050507] border border-white/[0.12] flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-[#121216] border border-white/[0.12] flex items-center justify-center text-white">
                      <Zap className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">{c.type} Fast Plug</div>
                      <div className="text-[11px] font-mono text-[#A1A1AA]">{c.powerKw} kW Max • {station.currency}{c.pricePerKwh}/kWh</div>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono font-semibold text-white">
                    {c.available}/{c.count} Free
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Amenities & Operating Hours */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-[#121216] p-4 rounded-lg border border-white/[0.12]">
              <h4 className="text-xs font-mono uppercase tracking-wider text-[#A1A1AA] font-semibold mb-2">
                On-Site Amenities
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {station.amenities.map((item, idx) => (
                  <span key={idx} className="px-2.5 py-1 rounded text-xs bg-[#050507] border border-white/[0.12] text-white font-mono">
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-[#121216] p-4 rounded-lg border border-white/[0.12]">
              <h4 className="text-xs font-mono uppercase tracking-wider text-[#A1A1AA] font-semibold mb-2">
                Operating Schedule & Notes
              </h4>
              <div className="text-xs space-y-1.5 text-zinc-300 font-mono">
                <div className="flex items-center space-x-2">
                  <Clock className="w-3.5 h-3.5 text-white" />
                  <span>Hours: <strong className="text-white">{station.operatingHours}</strong></span>
                </div>
                <div className="text-[#A1A1AA] text-[11px] pt-1">
                  {station.pricingNote}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-6 border-t border-white/[0.08] bg-[#0B0B0E] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-[11px] font-mono text-[#71717A]">
            GPS Coordinates: {station.lat.toFixed(4)}, {station.lng.toFixed(4)}
          </div>

          <div className="flex items-center space-x-3 w-full sm:w-auto">
            <button
              onClick={handleStartNavigation}
              className="flex-1 sm:flex-initial flex items-center justify-center space-x-2 px-5 py-2.5 rounded-lg bg-white text-[#050507] font-bold hover:bg-zinc-200 transition-all text-xs font-mono uppercase tracking-wider shadow-md cursor-pointer"
            >
              <Navigation className="w-4 h-4" />
              <span>Start In-App Navigation</span>
            </button>
            <a
              href={osmUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center space-x-1.5 px-3.5 py-2.5 rounded-lg bg-[#121216] border border-white/[0.12] text-[#A1A1AA] hover:text-white transition-all text-xs font-mono"
              title="Open directions in external OpenStreetMap website"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">OSM Web</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
