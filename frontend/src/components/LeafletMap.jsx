import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Zap, Navigation, Clock, DollarSign } from 'lucide-react';
import { Badge, DemoDataBadge } from './Badge';

// Helper component to smoothly re-center map when station or list changes
function MapRecenter({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.flyTo(center, zoom || 12, { duration: 1.2 });
    }
  }, [center, zoom, map]);
  return null;
}

// Generate futuristic SVG DivIcon
const createChargerIcon = (station, isSelected) => {
  const isAvailable = station.status === 'Available';
  const color = isSelected ? '#00F0FF' : isAvailable ? '#10B981' : '#F59E0B';
  const glow = isSelected 
    ? 'drop-shadow(0 0 10px rgba(0, 240, 255, 0.9))' 
    : isAvailable 
      ? 'drop-shadow(0 0 6px rgba(16, 185, 129, 0.6))' 
      : 'drop-shadow(0 0 6px rgba(245, 158, 11, 0.6))';

  const html = `
    <div style="position: relative; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
      <div style="
        position: absolute;
        width: 32px;
        height: 32px;
        background: #0B0F17;
        border: 2px solid ${color};
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        filter: ${glow};
        box-shadow: 0 4px 12px rgba(0,0,0,0.5);
      ">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="${color}" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
        </svg>
      </div>
      <div style="
        position: absolute;
        bottom: -4px;
        padding: 1px 4px;
        background: #07090E;
        border: 1px solid ${color};
        border-radius: 4px;
        font-family: monospace;
        font-size: 8px;
        font-weight: bold;
        color: #FFFFFF;
      ">
        ${station.peakPowerKw}kW
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

export function LeafletMap({ stations, selectedStation, onSelectStation }) {
  const defaultCenter = [17.4400, 78.3800]; // Hyderabad (HITEC City / Madhapur)
  const center = selectedStation ? [selectedStation.lat, selectedStation.lng] : defaultCenter;

  return (
    <div className="w-full h-full relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
      <MapContainer
        center={defaultCenter}
        zoom={12}
        scrollWheelZoom={true}
        className="w-full h-full z-10"
        style={{ minHeight: '400px', background: '#07090E' }}
      >
        <MapRecenter center={center} zoom={selectedStation ? 14 : 12} />
        
        {/* CartoDB Dark Matter Tiles */}
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          subdomains="abcd"
          maxZoom={19}
        />

        {/* Station Markers */}
        {stations.map((station) => {
          const isSelected = selectedStation?.id === station.id;
          return (
            <Marker
              key={station.id}
              position={[station.lat, station.lng]}
              icon={createChargerIcon(station, isSelected)}
              eventHandlers={{
                click: () => onSelectStation && onSelectStation(station),
              }}
            >
              <Popup className="dark-leaflet-popup">
                <div className="p-1 text-slate-100 min-w-[200px]">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-semibold text-xs text-white leading-tight">
                      {station.name}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 mb-2">{station.address}</div>
                  <div className="grid grid-cols-2 gap-1 text-[11px] font-mono mb-2">
                    <div className="bg-dark-900 p-1.5 rounded border border-white/5">
                      <span className="text-slate-500 block text-[9px]">PEAK POWER</span>
                      <span className="text-brand-cyan font-bold">{station.peakPowerKw} kW DC</span>
                    </div>
                    <div className="bg-dark-900 p-1.5 rounded border border-white/5">
                      <span className="text-slate-500 block text-[9px]">PRICE</span>
                      <span className="text-emerald-400 font-bold">{station.currency}{station.pricePerKwh}/kWh</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-white/10 text-[10px]">
                    <span className={station.status === 'Available' ? 'text-emerald-400 font-semibold' : 'text-amber-400 font-semibold'}>
                      ● {station.availablePorts}/{station.totalPorts} Ports Free
                    </span>
                    <button
                      onClick={() => onSelectStation && onSelectStation(station)}
                      className="px-2 py-1 rounded bg-brand-cyan text-dark-950 font-bold hover:bg-brand-cyan/90 transition-colors"
                    >
                      Details
                    </button>
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
    </div>
  );
}

