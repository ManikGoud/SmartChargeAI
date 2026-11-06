import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Navigation } from 'lucide-react';
import { DemoDataBadge } from './Badge';

// Helper component to smoothly re-center map when station or list changes
function MapRecenter({ targetCoords, targetZoomLevel }) {
  const map = useMap();
  useEffect(() => {
    if (targetCoords && targetCoords[0] && targetCoords[1]) {
      map.flyTo(targetCoords, targetZoomLevel || 12, { duration: 1.2 });
    }
  }, [targetCoords, targetZoomLevel, map]);
  return null;
}

// Generate futuristic SVG DivIcon
const createChargerIcon = (itemStation, isItemPinSelected) => {
  const isPlugAvailable = itemStation.status === 'Available';
  const pinColor = isItemPinSelected ? '#00F0FF' : isPlugAvailable ? '#10B981' : '#F59E0B';
  const pinGlow = isItemPinSelected 
    ? 'drop-shadow(0 0 10px rgba(0, 240, 255, 0.9))' 
    : isPlugAvailable 
      ? 'drop-shadow(0 0 6px rgba(16, 185, 129, 0.6))' 
      : 'drop-shadow(0 0 6px rgba(245, 158, 11, 0.6))';

  const html = `
    <div style="position: relative; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
      <div style="
        position: absolute;
        width: 32px;
        height: 32px;
        background: #0B0F17;
        border: 2px solid ${pinColor};
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        filter: ${pinGlow};
        box-shadow: 0 4px 12px rgba(0,0,0,0.5);
      ">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="${pinColor}" stroke="${pinColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
        </svg>
      </div>
      <div style="
        position: absolute;
        bottom: -4px;
        padding: 1px 4px;
        background: #07090E;
        border: 1px solid ${pinColor};
        border-radius: 4px;
        font-family: monospace;
        font-size: 8px;
        font-weight: bold;
        color: #FFFFFF;
      ">
        ${itemStation.peakPowerKw}kW
      </div>
    </div>
  `;

  return L.divIcon({
    className: 'custom-ev-pin',
    html: html,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -22],
  });
};

export function LeafletMap({ stations, selectedStation, onSelectStation, onNavigate }) {
  const defaultMapCenter = /** @type {[number, number]} */ ([17.4400, 78.3800]); // Hyderabad (HITEC City / Madhapur)
  const activeCenter = /** @type {[number, number]} */ (selectedStation ? [selectedStation.lat, selectedStation.lng] : defaultMapCenter);

  return (
    <div className="w-full h-full relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
      <MapContainer
        center={defaultMapCenter}
        zoom={12}
        scrollWheelZoom={true}
        className="w-full h-full z-10"
        style={{ minHeight: '400px', background: '#07090E' }}
      >
        <MapRecenter targetCoords={activeCenter} targetZoomLevel={selectedStation ? 14 : 12} />
        
        {/* OpenStreetMap Standard Tiles (100% Free, Open Source, Zero API Key, No Watermark) */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          className="dark-map-tiles"
          maxZoom={19}
        />

        {/* Station Markers */}
        {stations.map((stn) => {
          const isCurrentSelected = selectedStation?.id === stn.id;
          return (
            <Marker
              key={stn.id}
              position={[stn.lat, stn.lng]}
              icon={createChargerIcon(stn, isCurrentSelected)}
              eventHandlers={{
                click: () => onSelectStation && onSelectStation(stn),
              }}
            >
              <Popup className="dark-leaflet-popup">
                <div className="p-1 text-slate-100 min-w-[200px]">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-semibold text-xs text-white leading-tight">
                      {stn.name}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 mb-2">{stn.address}</div>
                  <div className="grid grid-cols-2 gap-1 text-[11px] font-mono mb-2">
                    <div className="bg-dark-900 p-1.5 rounded border border-white/5">
                      <span className="text-slate-500 block text-[9px]">PEAK POWER</span>
                      <span className="text-brand-cyan font-bold">{stn.peakPowerKw} kW DC</span>
                    </div>
                    <div className="bg-dark-900 p-1.5 rounded border border-white/5">
                      <span className="text-slate-500 block text-[9px]">PRICE</span>
                      <span className="text-emerald-400 font-bold">{stn.currency}{stn.pricePerKwh}/kWh</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-1.5 border-t border-white/10 text-[10px]">
                    <span className={stn.status === 'Available' ? 'text-emerald-400 font-semibold' : 'text-amber-400 font-semibold'}>
                      ● {stn.availablePorts}/{stn.totalPorts} Free
                    </span>
                    <div className="flex items-center space-x-1.5">
                      {onNavigate && (
                        <button
                          onClick={() => onNavigate(stn)}
                          className="px-2 py-1 rounded bg-[#00FF66] text-black font-bold hover:bg-[#00FF66]/90 transition-colors flex items-center space-x-1 cursor-pointer"
                        >
                          <Navigation className="w-2.5 h-2.5" />
                          <span>Navigate</span>
                        </button>
                      )}
                      <button
                        onClick={() => onSelectStation && onSelectStation(stn)}
                        className="px-2 py-1 rounded bg-white/15 text-white font-bold hover:bg-white/25 transition-colors cursor-pointer"
                      >
                        Details
                      </button>
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Map Overlay Badge */}
      <div className="absolute top-3 right-3 z-20 pointer-events-none">
        <DemoDataBadge />
      </div>

      <div className="absolute bottom-3 left-3 z-20 bg-dark-950/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-[11px] font-mono text-slate-300 flex items-center space-x-3 pointer-events-none">
        <span className="flex items-center space-x-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
          <span>Available</span>
        </span>
        <span className="flex items-center space-x-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
          <span>Occupied</span>
        </span>
      </div>

      {/* Free & Open-Source Map Badge */}
      <div className="absolute bottom-3 right-3 z-20 bg-dark-950/85 backdrop-blur-md px-2.5 py-1 rounded-xl border border-white/10 text-[10px] font-mono text-slate-300 flex items-center space-x-1.5 pointer-events-none">
        <span className="w-1.5 h-1.5 rounded-full bg-brand-cyan animate-pulse"></span>
        <span>OpenStreetMap • Free & Open-Source</span>
      </div>
    </div>
  );
}
