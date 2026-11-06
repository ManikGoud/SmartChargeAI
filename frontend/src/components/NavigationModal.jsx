import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { 
  Navigation, 
  X, 
  Compass, 
  AlertTriangle, 
  Play, 
  Square, 
  RefreshCw, 
  ExternalLink, 
  CornerUpLeft, 
  CornerUpRight, 
  MoveUp, 
  CheckCircle2
} from 'lucide-react';
import { DemoDataBadge } from './Badge';

// Helper component to auto-fit map bounds around genuine route coordinates or origin & destination
function NavMapRecenter({ currentGpsCoords, stationTargetCoords, activeRouteCoords, isLiveNavActive }) {
  const map = useMap();
  useEffect(() => {
    if (!map) return;
    if (isLiveNavActive && currentGpsCoords) {
      // In active live navigation, center tightly on the user's real GPS position
      map.flyTo(currentGpsCoords, 16, { duration: 1.0 });
    } else if (activeRouteCoords && activeRouteCoords.length > 1) {
      // Fit bounds to actual OSRM road coordinates
      try {
        const bounds = L.latLngBounds(activeRouteCoords);
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
      } catch (e) {
        // Fallback
      }
    } else if (currentGpsCoords && stationTargetCoords) {
      try {
        const bounds = L.latLngBounds([currentGpsCoords, stationTargetCoords]);
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
      } catch (e) {
        // Fallback
      }
    } else if (stationTargetCoords) {
      map.setView(stationTargetCoords, 14);
    }
  }, [currentGpsCoords, stationTargetCoords, activeRouteCoords, isLiveNavActive, map]);
  return null;
}

// User location pulsating radar pin
const createUserIcon = () => {
  return L.divIcon({
    className: 'custom-user-gps-pin',
    html: `
      <div style="position: relative; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;">
        <div style="
          position: absolute; 
          width: 32px; 
          height: 32px; 
          border-radius: 50%; 
          background: rgba(255, 255, 255, 0.25); 
          animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
        "></div>
        <div style="
          width: 18px; 
          height: 18px; 
          background: #FFFFFF; 
          border: 3px solid #050507; 
          border-radius: 50%; 
          box-shadow: 0 0 16px rgba(255, 255, 255, 0.9);
          z-index: 10;
        "></div>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
};

// Destination station pin
const createDestIcon = () => {
  return L.divIcon({
    className: 'custom-dest-pin',
    html: `
      <div style="position: relative; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;">
        <div style="
          width: 32px; 
          height: 32px; 
          background: #0B0B0E; 
          border: 2px solid #FFFFFF; 
          border-radius: 50%; 
          display: flex; 
          align-items: center; 
          justify-content: center;
          box-shadow: 0 0 16px rgba(255, 255, 255, 0.8);
        ">
          <svg width="16" height="16" viewBox="0 24 24" fill="#FFFFFF" stroke="#FFFFFF" stroke-width="2">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
          </svg>
        </div>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
};

// Map maneuver modifier to icon
const renderStepIcon = (modifier, type) => {
  if (type === 'arrive') return <CheckCircle2 className="w-4 h-4 text-white" />;
  if (type === 'depart') return <MoveUp className="w-4 h-4 text-white" />;
  if (modifier && typeof modifier === 'string' && modifier.includes('left')) return <CornerUpLeft className="w-4 h-4 text-white" />;
  if (modifier && typeof modifier === 'string' && modifier.includes('right')) return <CornerUpRight className="w-4 h-4 text-white" />;
  return <MoveUp className="w-4 h-4 text-zinc-300" />;
};

// Haversine straight-line distance fallback
function haversineDistance(latA, lonA, latB, lonB) {
  const earthRadiusKm = 6371;
  const dLatRad = (latB - latA) * (Math.PI / 180);
  const dLonRad = (lonB - lonA) * (Math.PI / 180);
  const havA = 
    Math.sin(dLatRad / 2) * Math.sin(dLatRad / 2) +
    Math.cos(latA * (Math.PI / 180)) * Math.cos(latB * (Math.PI / 180)) *
    Math.sin(dLonRad / 2) * Math.sin(dLonRad / 2);
  const havC = 2 * Math.atan2(Math.sqrt(havA), Math.sqrt(1 - havA));
  return Number((earthRadiusKm * havC).toFixed(1));
}

// Preset departure hubs in city
const DEPARTURE_PRESETS = [
  { name: 'HITEC City Cyber Towers', coords: /** @type {[number, number]} */ ([17.4504, 78.3808]) },
  { name: 'Gachibowli Junction', coords: /** @type {[number, number]} */ ([17.4400, 78.3489]) },
  { name: 'Banjara Hills', coords: /** @type {[number, number]} */ ([17.4156, 78.4502]) },
  { name: 'Secunderabad Station', coords: /** @type {[number, number]} */ ([17.4399, 78.4983]) },
  { name: 'Shamshabad RGIA', coords: /** @type {[number, number]} */ ([17.2403, 78.4294]) },
];

export function NavigationModal({ station, onClose }) {
  // Navigation states
  const [userCoords, setUserCoords] = useState(/** @type {[number, number] | null} */ (null));
  const [originLabel, setOriginLabel] = useState('Detecting GPS...');
  const [isUsingRealGps, setIsUsingRealGps] = useState(false);
  const [geoStatus, setGeoStatus] = useState('prompting'); // 'prompting' | 'granted' | 'denied' | 'unavailable'
  const [geoErrorMsg, setGeoErrorMsg] = useState(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [routeData, setRouteData] = useState(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState(null);

  // Manual origin input
  const [customOriginInput, setCustomOriginInput] = useState('');

  const watchIdRef = useRef(/** @type {number | null} */ (null));
  const destCoords = /** @type {[number, number]} */ ([station.lat, station.lng]);

  // Request browser location on mount
  useEffect(() => {
    requestUserLocation();
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  const requestUserLocation = () => {
    if (!navigator.geolocation) {
      setGeoStatus('unavailable');
      setGeoErrorMsg('Browser geolocation is not supported on this device.');
      setOriginLabel('GPS Unavailable — Select Origin Below');
      return;
    }

    setGeoStatus('prompting');
    setGeoErrorMsg(null);
    setOriginLabel('Requesting device location...');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const liveGpsCoords = /** @type {[number, number]} */ ([pos.coords.latitude, pos.coords.longitude]);
        // PRESERVE ACTUAL USER GPS — Never overwrite real coordinates
        setUserCoords(liveGpsCoords);
        setIsUsingRealGps(true);
        setGeoStatus('granted');
        setOriginLabel(`Live GPS (${liveGpsCoords[0].toFixed(4)}, ${liveGpsCoords[1].toFixed(4)})`);
        fetchOSRMRoute(liveGpsCoords);
      },
      (err) => {
        setGeoStatus('denied');
        setIsUsingRealGps(false);
        if (err.code === 1) {
          setGeoErrorMsg('Browser location permission was denied. Please select or enter your departure origin below.');
        } else if (err.code === 2) {
          setGeoErrorMsg('Device location is unavailable. Please select or enter your departure origin below.');
        } else {
          setGeoErrorMsg('Location request timed out. Please select or enter your departure origin below.');
        }
        setOriginLabel('No GPS — Choose Departure Origin');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
    );
  };

  // Explicit user-chosen origin selection (when GPS is denied or user tests a specific origin)
  const handleSelectExplicitOrigin = (/** @type {[number, number]} */ explicitCoords, explicitLabel) => {
    setUserCoords(explicitCoords);
    setIsUsingRealGps(false);
    setGeoStatus('granted');
    setOriginLabel(explicitLabel);
    setGeoErrorMsg(null);
    fetchOSRMRoute(explicitCoords);
  };

  // Handle custom coordinates or search text
  const handleApplyCustomOrigin = (evt) => {
    evt.preventDefault();
    if (!customOriginInput.trim()) return;

    // Check if input is "lat, lng" coordinates
    const parts = customOriginInput.split(',').map(s => parseFloat(s.trim()));
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1]) && Math.abs(parts[0]) <= 90 && Math.abs(parts[1]) <= 180) {
      const parsedCustomCoords = /** @type {[number, number]} */ ([parts[0], parts[1]]);
      handleSelectExplicitOrigin(parsedCustomCoords, `Coordinates (${parts[0].toFixed(4)}, ${parts[1].toFixed(4)})`);
      return;
    }

    // Check if input matches preset name
    const matchedPreset = DEPARTURE_PRESETS.find(p => p.name.toLowerCase().includes(customOriginInput.toLowerCase()));
    if (matchedPreset) {
      handleSelectExplicitOrigin(matchedPreset.coords, matchedPreset.name);
      return;
    }

    // Notice when custom text without valid coordinates
    setGeoErrorMsg(`Could not parse "${customOriginInput}" as "latitude, longitude". Please enter coordinates like "17.4450, 78.3820" or select a preset.`);
  };

  // Fetch genuine road route from OpenStreetMap OSRM
  const fetchOSRMRoute = async (departureCoords) => {
    setRouteLoading(true);
    setRouteError(null);

    // OSRM expects coordinates in lng,lat format
    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${departureCoords[1]},${departureCoords[0]};${destCoords[1]},${destCoords[0]}?overview=full&geometries=geojson&steps=true`;

    try {
      const osrmFetchResponse = await fetch(osrmUrl, { signal: AbortSignal.timeout(8000) });
      if (!osrmFetchResponse.ok) throw new Error(`OSRM HTTP status ${osrmFetchResponse.status}`);
      const rawRouteJson = await osrmFetchResponse.json();

      if (rawRouteJson.routes && rawRouteJson.routes.length > 0) {
        const primaryRoute = rawRouteJson.routes[0];
        const routePointCoords = primaryRoute.geometry.coordinates.map(([lngVal, latVal]) => [latVal, lngVal]);
        const routeDistKm = Number((primaryRoute.distance / 1000).toFixed(1));
        const routeDurationMins = Math.max(1, Math.round(primaryRoute.duration / 60));

        // Format turn-by-turn steps
        const maneuverSteps = (primaryRoute.legs?.[0]?.steps || []).map((stepItem, stepIndex) => ({
          id: stepIndex,
          instruction: stepItem.maneuver?.type === 'arrive' 
            ? `Arrive at ${station.name}` 
            : (stepItem.name ? `${stepItem.maneuver?.type || 'Drive'} onto ${stepItem.name}` : (stepItem.maneuver?.modifier ? `${stepItem.maneuver.modifier} turn` : 'Continue along road')),
          distanceKm: Number((stepItem.distance / 1000).toFixed(2)),
          type: stepItem.maneuver?.type,
          modifier: stepItem.maneuver?.modifier,
        }));

        setRouteData({
          coordinates: routePointCoords,
          distanceKm: routeDistKm,
          durationMins: routeDurationMins,
          steps: maneuverSteps,
        });
      } else {
        throw new Error('No driving route found between selected origin and station');
      }
    } catch (err) {
      // Do NOT fabricate road routes or travel times
      setRouteData(null);
      setRouteError(`Routing service notice: Could not calculate road route (${err.message || 'OSRM offline'}).`);
    } finally {
      setRouteLoading(false);
    }
  };

  // Start Live Navigation
  const handleStartNavigation = () => {
    if (!userCoords) {
      alert('Please select or detect your departure location first.');
      return;
    }

    setIsNavigating(true);

    // If using real GPS, track live movements
    if (isUsingRealGps && navigator.geolocation) {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }

      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          const liveTrackCoords = /** @type {[number, number]} */ ([pos.coords.latitude, pos.coords.longitude]);
          setUserCoords(liveTrackCoords);
          setOriginLabel(`Live GPS (${liveTrackCoords[0].toFixed(4)}, ${liveTrackCoords[1].toFixed(4)})`);
        },
        (err) => {
          console.warn('Live navigation GPS watch error:', err);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 2000 }
      );
    }
  };

  // End Live Navigation
  const handleEndNavigation = () => {
    setIsNavigating(false);
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  };

  // External OSM fallback link
  const osmDirectionsUrl = userCoords 
    ? `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${userCoords[0]}%2C${userCoords[1]}%3B${station.lat}%2C${station.lng}`
    : `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=%3B${station.lat}%2C${station.lng}`;

  const straightLineDist = userCoords ? haversineDistance(userCoords[0], userCoords[1], station.lat, station.lng) : null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl h-[92vh] max-h-[850px] bg-[#050507] border border-white/[0.12] rounded-xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.9)] flex flex-col">
        
        {/* Top Header Bar */}
        <div className="px-5 py-3.5 bg-[#0B0B0E] border-b border-white/[0.12] flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-[#121216] border border-white/[0.12] flex items-center justify-center text-white">
              <Navigation className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-white">
                  {isNavigating ? 'Live In-App Road Tracking' : 'In-App Route Guidance'}
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                  isNavigating 
                    ? 'bg-white text-[#050507]' 
                    : 'bg-white/10 text-[#A1A1AA]'
                }`}>
                  {isNavigating ? '● LIVE TRACKING' : 'PREVIEW READY'}
                </span>
                <DemoDataBadge />
              </div>
              <p className="text-[11px] text-[#A1A1AA] font-mono truncate max-w-md">
                Origin: <strong className="text-white">{originLabel}</strong> • Destination: <strong className="text-white">{station.name}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-[#121216] border border-white/[0.12] text-[#A1A1AA] hover:text-white transition-colors cursor-pointer"
              title="Close Navigation"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Main Content: Map (Left/Center) + Telemetry & Turn-by-Turn Panel (Right) */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden relative">
          
          {/* Map Viewport (8 Cols) */}
          <div className="lg:col-span-8 relative h-full min-h-[300px] bg-black">
            <MapContainer
              center={userCoords || destCoords}
              zoom={13}
              scrollWheelZoom={true}
              className="w-full h-full z-10"
              style={{ background: '#05070A' }}
            >
              <NavMapRecenter 
                currentGpsCoords={userCoords} 
                stationTargetCoords={destCoords} 
                activeRouteCoords={routeData?.coordinates}
                isLiveNavActive={isNavigating} 
              />

              {/* 100% Free & Open-Source OpenStreetMap Standard Tiles (No API Key, No Watermark) */}
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                className="dark-map-tiles"
                maxZoom={19}
              />

              {/* User / Departure Position Pin */}
              {userCoords && (
                <Marker position={userCoords} icon={createUserIcon()}>
                  <Popup className="dark-leaflet-popup">
                    <div className="p-1 text-xs font-mono">
                      <strong className="text-white">{isUsingRealGps ? 'Your Real GPS Position' : 'Departure Origin'}</strong>
                      <div className="text-[10px] text-[#A1A1AA] mt-0.5">
                        {userCoords[0].toFixed(4)}, {userCoords[1].toFixed(4)}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              )}

              {/* Destination Station Pin */}
              <Marker position={destCoords} icon={createDestIcon()}>
                <Popup className="dark-leaflet-popup">
                  <div className="p-1 text-xs font-mono">
                    <strong className="text-white font-bold">{station.name}</strong>
                    <div className="text-[10px] text-[#A1A1AA] mt-1">{station.address}</div>
                    <div className="text-[10px] text-white font-mono mt-1 font-bold">
                      {station.peakPowerKw} kW DC • {station.availablePorts}/{station.totalPorts} Ports Free
                    </div>
                  </div>
                </Popup>
              </Marker>

              {/* Genuine Road Route Polyline */}
              {routeData?.coordinates && (
                <Polyline
                  positions={routeData.coordinates}
                  pathOptions={{
                    color: '#FFFFFF',
                    weight: 5,
                    opacity: 0.9,
                    lineCap: 'round',
                    lineJoin: 'round',
                  }}
                />
              )}
            </MapContainer>

            {/* In-Map Navigation Controls & Floating Action Bar */}
            <div className="absolute bottom-4 left-4 right-4 z-20 pointer-events-none flex items-center justify-between gap-3">
              <div className="pointer-events-auto bg-[#0B0B0E]/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/[0.12] text-xs font-mono text-[#A1A1AA] shadow-lg flex items-center space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_6px_rgba(255,255,255,0.8)]"></span>
                <span>Map Engine: <strong className="text-white">OpenStreetMap (Free Standard Tiles)</strong></span>
              </div>

              {/* Start / End Navigation Button on map */}
              <div className="pointer-events-auto">
                {!isNavigating ? (
                  <button
                    onClick={handleStartNavigation}
                    disabled={!routeData}
                    className="flex items-center space-x-2 px-5 py-2.5 rounded-lg bg-white text-[#050507] font-mono font-bold text-xs uppercase tracking-wider hover:bg-zinc-200 disabled:opacity-40 transition-all shadow-md cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-black" />
                    <span>Start Live Navigation</span>
                  </button>
                ) : (
                  <button
                    onClick={handleEndNavigation}
                    className="flex items-center space-x-2 px-5 py-2.5 rounded-lg bg-[#121216] border border-white/[0.12] text-white font-mono font-bold text-xs uppercase tracking-wider hover:bg-white/10 transition-all shadow-md cursor-pointer"
                  >
                    <Square className="w-3.5 h-3.5 fill-white" />
                    <span>End Navigation</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Telemetry, Instructions & Origin Selector Panel (4 Cols) */}
          <div className="lg:col-span-4 bg-[#0B0B0E] border-t lg:border-t-0 lg:border-l border-white/[0.12] flex flex-col justify-between overflow-hidden">
            
            {/* Top Telemetry Metrics */}
            <div className="p-4 sm:p-5 border-b border-white/[0.08] space-y-4 shrink-0 bg-[#0B0B0E] overflow-y-auto max-h-[380px]">
              
              {/* Origin Selection Section if GPS denied or user wants to specify */}
              {geoStatus !== 'granted' && (
                <div className="p-3.5 rounded-lg bg-[#121216] border border-white/[0.12] text-xs font-mono text-[#A1A1AA] space-y-3">
                  <div className="flex items-start space-x-2">
                    <AlertTriangle className="w-4 h-4 text-white shrink-0 mt-0.5" />
                    <span className="leading-snug">{geoErrorMsg || 'Requesting device location permission...'}</span>
                  </div>

                  {/* Manual Departure Origin Selection */}
                  <div className="pt-2 border-t border-white/[0.08] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-[#71717A] uppercase tracking-wider font-bold">
                        Select Departure Origin:
                      </span>
                      <button
                        onClick={requestUserLocation}
                        className="text-[10px] text-white hover:underline flex items-center space-x-1"
                      >
                        <RefreshCw className="w-2.5 h-2.5" />
                        <span>Retry GPS</span>
                      </button>
                    </div>

                    {/* Quick Preset Buttons */}
                    <div className="flex flex-wrap gap-1.5">
                      {DEPARTURE_PRESETS.map((presetItem) => (
                        <button
                          key={presetItem.name}
                          onClick={() => handleSelectExplicitOrigin(presetItem.coords, presetItem.name)}
                          className="px-2 py-1 rounded bg-[#050507] border border-white/[0.12] hover:border-white text-[11px] text-[#A1A1AA] hover:text-white transition-colors"
                        >
                          {presetItem.name.split(' ')[0]}
                        </button>
                      ))}
                    </div>

                    {/* Custom Coordinates / Location input */}
                    <form onSubmit={handleApplyCustomOrigin} className="flex items-center gap-1.5 pt-1">
                      <input
                        type="text"
                        placeholder="Or enter lat, lng (e.g. 17.4450, 78.3820)"
                        value={customOriginInput}
                        onChange={(e) => setCustomOriginInput(e.target.value)}
                        className="flex-1 bg-[#050507] border border-white/[0.12] rounded px-2.5 py-1 text-[11px] text-white placeholder-[#71717A] focus:outline-none focus:border-white"
                      />
                      <button
                        type="submit"
                        className="px-2.5 py-1 rounded bg-white text-[#050507] font-bold text-[11px] hover:bg-zinc-200 cursor-pointer"
                      >
                        Set
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {/* Real Road Route Metrics */}
              {routeLoading ? (
                <div className="p-4 rounded-lg bg-[#121216] border border-white/[0.12] text-center space-y-2">
                  <RefreshCw className="w-5 h-5 text-white animate-spin mx-auto" />
                  <p className="text-xs font-mono text-[#A1A1AA]">Calculating road route via OSRM...</p>
                </div>
              ) : routeData ? (
                <div className="grid grid-cols-2 gap-3 font-mono">
                  <div className="p-3.5 rounded-lg bg-[#050507] border border-white/[0.12]">
                    <span className="text-[10px] uppercase text-[#71717A] block mb-0.5">Real Road Distance</span>
                    <span className="text-2xl font-extrabold text-white">
                      {routeData.distanceKm} <span className="text-xs text-[#71717A] font-normal">km</span>
                    </span>
                  </div>

                  <div className="p-3.5 rounded-lg bg-[#050507] border border-white/[0.12]">
                    <span className="text-[10px] uppercase text-[#71717A] block mb-0.5">Estimated Drive Time</span>
                    <span className="text-2xl font-extrabold text-white">
                      {routeData.durationMins} <span className="text-xs text-[#71717A] font-normal">mins</span>
                    </span>
                  </div>
                </div>
              ) : routeError ? (
                <div className="p-3 rounded-lg bg-[#121216] border border-white/[0.12] text-xs font-mono text-white space-y-2">
                  <div className="flex items-start space-x-2">
                    <AlertTriangle className="w-4 h-4 text-white shrink-0 mt-0.5" />
                    <span>{routeError}</span>
                  </div>
                  {straightLineDist && (
                    <div className="text-[11px] text-[#A1A1AA] pt-1">
                      Direct straight-line distance: <strong className="text-white">~{straightLineDist} km</strong> (Not a driving road distance)
                    </div>
                  )}
                  <button
                    onClick={() => userCoords && fetchOSRMRoute(userCoords)}
                    className="mt-1 px-3 py-1 rounded bg-[#050507] border border-white/[0.12] text-white text-xs flex items-center space-x-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Retry OSRM Route</span>
                  </button>
                </div>
              ) : null}

              {/* Station Quick Specs */}
              <div className="p-3 rounded-lg bg-[#050507] border border-white/[0.12] flex items-center justify-between text-xs font-mono">
                <div>
                  <span className="text-[#71717A] text-[10px] block">DISPENSER SPEED</span>
                  <span className="text-white font-bold">{station.peakPowerKw} kW DC</span>
                </div>
                <div>
                  <span className="text-[#71717A] text-[10px] block">TARIFF</span>
                  <span className="text-white font-bold">{station.currency}{station.pricePerKwh}/kWh</span>
                </div>
                <div>
                  <span className="text-[#71717A] text-[10px] block">AVAILABILITY</span>
                  <span className="text-white font-bold">{station.availablePorts}/{station.totalPorts} Ports</span>
                </div>
              </div>
            </div>

            {/* Turn-by-Turn Instruction List (Collapsible / Scrollable) */}
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <div className="px-5 py-2.5 bg-[#0B0B0E] border-b border-white/[0.08] flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-wider text-[#A1A1AA] font-bold flex items-center space-x-1.5">
                  <Compass className="w-3.5 h-3.5 text-white" />
                  <span>Turn-by-Turn Maneuvers</span>
                </span>
                <span className="text-[11px] font-mono text-[#71717A]">
                  {routeData?.steps?.length || 0} Steps
                </span>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-2 text-xs font-mono">
                {routeData?.steps && routeData.steps.length > 0 ? (
                  routeData.steps.map((maneuverStep, stepIdx) => (
                    <div 
                      key={maneuverStep.id} 
                      className={`p-2.5 rounded-lg border flex items-start space-x-3 transition-colors ${
                        stepIdx === 0 && isNavigating
                          ? 'bg-white/10 border-white text-white font-semibold'
                          : 'bg-[#050507] border-white/[0.08] text-[#A1A1AA]'
                      }`}
                    >
                      <div className="w-6 h-6 rounded bg-[#121216] border border-white/[0.12] flex items-center justify-center shrink-0 mt-0.5 text-white">
                        {renderStepIcon(maneuverStep.modifier, maneuverStep.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-white leading-snug">{maneuverStep.instruction}</div>
                        {maneuverStep.distanceKm > 0 && (
                          <div className="text-[10px] text-[#71717A] mt-0.5">{maneuverStep.distanceKm} km</div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-[#71717A] font-mono text-xs">
                    {routeLoading ? 'Loading road maneuvers...' : 'Turn-by-turn guidance will appear once the route is computed.'}
                  </div>
                )}
              </div>
            </div>

            {/* Bottom External Fallback Link */}
            <div className="p-4 border-t border-white/[0.08] bg-[#0B0B0E] flex items-center justify-between text-xs font-mono shrink-0">
              <span className="text-[11px] text-[#71717A]">Need external mapping?</span>
              <a
                href={osmDirectionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-1.5 text-xs text-white hover:underline"
              >
                <span>Open in OSM Directions</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}

export default NavigationModal;
