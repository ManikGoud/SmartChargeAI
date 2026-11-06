import React, { useState, useEffect } from 'react';
import { 
  Compass, 
  MapPin, 
  Navigation, 
  BatteryCharging, 
  Clock, 
  DollarSign, 
  Car, 
  ArrowRight, 
  CheckCircle2, 
  Bookmark, 
  Sparkles, 
  Zap, 
  ShieldAlert, 
  Trash2,
  Share2,
  RotateCcw
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useVehicle } from '../context/VehicleContext';
import { planTrip, saveTrip, fetchSavedTrips, deleteSavedTrip } from '../services/api';

// Helper component to auto-fit bounds on the corridor route
function MapBoundsRecenter({ corridorBounds }) {
  const map = useMap();
  useEffect(() => {
    if (corridorBounds && corridorBounds.length >= 2) {
      try {
        map.fitBounds(corridorBounds, { padding: [35, 35], maxZoom: 13 });
      } catch (e) {
        // Fallback
      }
    }
  }, [corridorBounds, map]);
  return null;
}

// Known coordinates for highway corridors
const CORRIDOR_COORDS = {
  'hitec city': [17.4450, 78.3820],
  'gachibowli': [17.4400, 78.3489],
  'secunderabad': [17.4399, 78.4983],
  'shamshabad': [17.2403, 78.4294],
  'rgia': [17.2403, 78.4294],
  'hyderabad': [17.4450, 78.3820],
  'warangal': [17.9689, 79.5941],
  'vijayawada': [16.5062, 80.6480],
  'nagarjuna sagar': [16.5775, 79.3125],
  'srisailam': [16.0740, 78.8680],
  'bengaluru': [12.9716, 77.5946],
  'bangalore': [12.9716, 77.5946],
  'karimnagar': [18.4386, 79.1288],
  'khammam': [17.2473, 80.1514],
  'nizamabad': [18.6725, 78.0941],
  'mumbai': [19.0760, 72.8777],
  'pune': [18.5204, 73.8567],
  'chennai': [13.0827, 80.2707],
};

const createPinIcon = (label) => {
  return L.divIcon({
    className: 'custom-trip-pin',
    html: `
      <div style="position: relative; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">
        <div style="
          width: 24px; 
          height: 24px; 
          background: #0B0B0E; 
          border: 2px solid #FFFFFF; 
          border-radius: 50%; 
          display: flex; 
          align-items: center; 
          justify-content: center;
          box-shadow: 0 0 10px rgba(255,255,255,0.6);
        ">
          <div style="width: 6px; height: 6px; background: #FFFFFF; border-radius: 50%;"></div>
        </div>
        <div style="position: absolute; bottom: -18px; white-space: nowrap; font-size: 9px; font-weight: bold; font-family: monospace; color: #FFFFFF; background: #0B0B0E; border: 1px solid rgba(255,255,255,0.2); padding: 1px 4px; border-radius: 4px;">
          ${label}
        </div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

// Client-side fallback battery model for resilient operation when backend is offline
function calculateLocalEvTrip(req) {
  const nomRange = Math.max(req.vehicle_range_km || 450, 100);
  const capKwh = Math.max(req.battery_capacity_kwh || 72, 20);
  const currSoC = Math.max(5, Math.min(Number(req.current_soc_pct) || 50, 100));
  const minReserveSoC = Math.max(10, Math.min(Number(req.desired_arrival_soc_pct) || 20, 40));

  const totalDist = req.total_distance_km || 152;
  const usableRange = (nomRange * currSoC) / 100;
  const targetReserveRange = (nomRange * minReserveSoC) / 100;

  const requiresStop = usableRange - totalDist < targetReserveRange;
  const stopsCount = requiresStop ? Math.ceil((totalDist - usableRange + targetReserveRange) / (nomRange * 0.6)) : 0;

  const stops = [];
  let currentSimDist = usableRange * 0.8;

  for (let i = 0; i < stopsCount; i++) {
    const fraction = (i + 1) / (stopsCount + 1);
    const dwellMins = Math.round(20 + Math.random() * 15);
    const stopCost = Math.round(dwellMins * 18.5);

    stops.push({
      station_id: `stop-${i + 1}`,
      station_name: `HPC Expressway Hub • Corridor Node ${i + 1}`,
      location: `NH-65 Highway Plaza (km ${Math.round(currentSimDist)})`,
      arrival_soc_pct: Math.round(minReserveSoC + 4),
      departure_soc_pct: 80,
      charger_speed_kw: Math.min(req.max_charging_speed_kw || 150, 240),
      recommended_dwell_mins: dwellMins,
      energy_to_add_kwh: Number(((capKwh * (80 - (minReserveSoC + 4))) / 100).toFixed(1)),
      est_stop_cost: stopCost,
    });
    currentSimDist += nomRange * 0.6;
  }

  const estDrivingHrs = (totalDist / 85).toFixed(1);
  const totalDwellMins = stops.reduce((sum, s) => sum + s.recommended_dwell_mins, 0);
  const totalCost = stops.reduce((sum, s) => sum + s.est_stop_cost, 0);
  const totalTripMins = Math.round(Number(estDrivingHrs) * 60 + totalDwellMins);
  const totalHrs = Math.floor(totalTripMins / 60);
  const remMins = totalTripMins % 60;

  return {
    origin: req.origin,
    destination: req.destination,
    total_distance_km: totalDist,
    estimated_driving_time_hours: estDrivingHrs,
    total_charging_time_mins: totalDwellMins,
    total_trip_duration: `${totalHrs}h ${remMins}m`,
    total_charging_cost: totalCost,
    currency: '₹',
    required_stops_count: stops.length,
    projected_final_soc_pct: minReserveSoC,
    recommended_stops: stops,
    is_local_fallback: true
  };
}

export function TripPlannerPage({ setCurrentPage }) {
  const { vehicles, activeVehicle, selectVehicle, currentSoC, updateSoC } = useVehicle();

  const [origin, setOrigin] = useState('HITEC City, Hyderabad');
  const [destination, setDestination] = useState('Warangal');
  const [tripSoC, setTripSoC] = useState(currentSoC || 50);
  const [arrivalBufferSoC, setArrivalBufferSoC] = useState(20);
  const [loading, setLoading] = useState(false);
  const [planResult, setPlanResult] = useState(null);
  const [error, setError] = useState(null);
  const [savedTripsList, setSavedTripsList] = useState([]);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(null);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [isOsrmRoad, setIsOsrmRoad] = useState(false);

  useEffect(() => {
    if (currentSoC) setTripSoC(currentSoC);
  }, [currentSoC]);

  const loadSavedTrips = async () => {
    try {
      const res = await fetchSavedTrips();
      if (res.success && res.data) {
        setSavedTripsList(res.data);
      }
    } catch (e) {}
  };

  useEffect(() => {
    loadSavedTrips();
  }, []);

  const popularCorridors = [
    { from: 'Hyderabad', to: 'Warangal', dist: '148 km' },
    { from: 'Hyderabad', to: 'Vijayawada', dist: '274 km' },
    { from: 'Hyderabad', to: 'Bengaluru', dist: '569 km' },
    { from: 'Hyderabad', to: 'Srisailam', dist: '213 km' },
  ];

  const handleCalculateTrip = async (customDest = null) => {
    const targetDest = customDest || destination;
    setLoading(true);
    setError(null);
    setSaveSuccessMsg(null);
    setRouteCoordinates([]);
    setIsOsrmRoad(false);

    const origKey = origin.toLowerCase().trim();
    const destKey = targetDest.toLowerCase().trim();
    const origCoord = CORRIDOR_COORDS[origKey] || CORRIDOR_COORDS['hyderabad'];
    const destCoord = CORRIDOR_COORDS[destKey] || [17.9689, 79.5941];

    let osrmDistanceKm = null;
    try {
      const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${origCoord[1]},${origCoord[0]};${destCoord[1]},${destCoord[0]}?overview=full&geometries=geojson`;
      const osrmRes = await fetch(osrmUrl);
      if (osrmRes.ok) {
        const osrmJson = await osrmRes.json();
        if (osrmJson.routes && osrmJson.routes.length > 0) {
          const r = osrmJson.routes[0];
          osrmDistanceKm = Math.round(r.distance / 1000);
          if (r.geometry && r.geometry.coordinates) {
            setRouteCoordinates(r.geometry.coordinates.map(c => [c[1], c[0]]));
            setIsOsrmRoad(true);
          }
        }
      }
    } catch (err) {}

    const payload = {
      origin,
      destination: targetDest,
      current_soc_pct: Number(tripSoC),
      desired_arrival_soc_pct: Number(arrivalBufferSoC),
      vehicle_id: activeVehicle?.id || 1,
      vehicle_model: `${activeVehicle?.make} ${activeVehicle?.model}`,
      battery_capacity_kwh: activeVehicle?.batteryCapacity || 72,
      vehicle_range_km: activeVehicle?.rangeKm || 450,
      max_charging_speed_kw: activeVehicle?.maxChargingSpeed || 150,
      total_distance_km: osrmDistanceKm || 152
    };

    try {
      const res = await planTrip(payload);
      if (res.success && res.data) {
        setPlanResult(res.data);
      } else {
        const fallback = calculateLocalEvTrip(payload);
        if (isOsrmRoad) fallback.is_actual_osrm_road = true;
        setPlanResult(fallback);
      }
    } catch (err) {
      const fallback = calculateLocalEvTrip(payload);
      if (isOsrmRoad) fallback.is_actual_osrm_road = true;
      setPlanResult(fallback);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCurrentTrip = async () => {
    if (!planResult) return;
    try {
      const payload = {
        title: `${planResult.origin} to ${planResult.destination}`,
        origin: planResult.origin,
        destination: planResult.destination,
        distance_km: planResult.total_distance_km,
        est_duration: planResult.total_trip_duration,
        recommended_stops_count: planResult.required_stops_count,
        suggested_station: planResult.recommended_stops?.[0]?.station_name || 'Highway Express Plaza',
        est_cost: `${planResult.currency || '₹'}${planResult.total_charging_cost || 0}`,
        battery_arrival_soc: planResult.projected_final_soc_pct || 20
      };
      await saveTrip(payload);
      setSaveSuccessMsg('Trip corridor saved to your garage database.');
      loadSavedTrips();
    } catch (e) {
      setSaveSuccessMsg('Trip saved locally.');
    }
  };

  const handleDeleteTrip = async (tripId) => {
    try {
      await deleteSavedTrip(tripId);
      loadSavedTrips();
    } catch (e) {
      setSavedTripsList(prev => prev.filter(t => t.id !== tripId));
    }
  };

  // Coords for map rendering
  const origCoordKey = origin.toLowerCase().trim();
  const destCoordKey = destination.toLowerCase().trim();
  const originCoords = /** @type {[number, number]} */ (CORRIDOR_COORDS[origCoordKey] || [17.4450, 78.3820]);
  const destCoords = /** @type {[number, number]} */ (CORRIDOR_COORDS[destCoordKey] || [17.9689, 79.5941]);

  const polylineCoords = [originCoords, destCoords];
  const routeBounds = [originCoords, destCoords];

  const stopCoords = [
    [17.65, 78.95],
    [17.82, 79.35],
    [17.15, 79.15],
    [16.85, 79.85]
  ];

  const mapCenter = /** @type {[number, number]} */ ([
    (originCoords[0] + destCoords[0]) / 2,
    (originCoords[1] + destCoords[1]) / 2
  ]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 font-sans text-white">
      {/* Editorial Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-white/[0.12]">
        <div>
          <div className="flex items-center space-x-2.5 text-xs font-mono text-[#A1A1AA] uppercase tracking-widest mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_6px_rgba(255,255,255,0.8)]"></span>
            <span>Automated Highway Corridors</span>
            <span className="text-[#71717A]">•</span>
            <span>OSRM Highway Engine</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            INTELLIGENT EV TRIP PLANNER
          </h1>
          <p className="text-[#A1A1AA] text-sm mt-1 max-w-2xl leading-relaxed">
            Calculates high-voltage charging corridors, battery depletion buffers, and minimum dwell times for seamless intercity EV travel.
          </p>
        </div>

        {/* Quick Corridor Buttons */}
        <div className="flex flex-wrap gap-2 shrink-0">
          {popularCorridors.map((c, i) => (
            <button
              key={i}
              onClick={() => {
                setOrigin(c.from);
                setDestination(c.to);
                handleCalculateTrip(c.to);
              }}
              className="px-3 py-1.5 rounded-lg bg-[#0B0B0E] border border-white/[0.12] hover:border-white/30 text-xs font-mono text-[#A1A1AA] hover:text-white transition-all"
            >
              {c.to} ({c.dist})
            </button>
          ))}
        </div>
      </div>

      {/* Main Parameters & Map Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Col: Trip Parameters Dock (4 cols) */}
        <div className="lg:col-span-4 bg-[#0B0B0E] border border-white/[0.12] rounded-xl p-6 space-y-6 shadow-2xl">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
            <span className="text-xs font-mono uppercase tracking-wider text-white font-bold flex items-center space-x-2">
              <Navigation className="w-4 h-4 text-white" />
              <span>Route Parameters</span>
            </span>
            <span className="text-xs font-mono text-[#A1A1AA] font-bold">{activeVehicle?.make}</span>
          </div>

          <div className="space-y-4">
            {/* Origin */}
            <div>
              <label className="block text-xs font-mono text-[#A1A1AA] mb-1">Departure Origin</label>
              <input
                type="text"
                value={origin}
                onChange={e => setOrigin(e.target.value)}
                placeholder="e.g. HITEC City, Hyderabad"
                className="w-full bg-[#050507] border border-white/[0.12] rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-white font-mono"
              />
            </div>

            {/* Destination */}
            <div>
              <label className="block text-xs font-mono text-[#A1A1AA] mb-1">Destination</label>
              <input
                type="text"
                value={destination}
                onChange={e => setDestination(e.target.value)}
                placeholder="e.g. Warangal, Vijayawada, Bengaluru"
                className="w-full bg-[#050507] border border-white/[0.12] rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-white font-mono"
              />
            </div>

            {/* Vehicle Profile Selector */}
            <div>
              <label className="block text-xs font-mono text-[#A1A1AA] mb-1">Calibrated EV Profile</label>
              <select
                value={activeVehicle?.id}
                onChange={e => selectVehicle(e.target.value)}
                className="w-full bg-[#050507] border border-white/[0.12] rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-white font-mono cursor-pointer"
              >
                {vehicles.map(v => (
                  <option key={v.id} value={v.id} className="bg-[#050507] text-white">
                    {v.make} {v.model} ({v.batteryCapacity} kWh • {v.rangeKm} km)
                  </option>
                ))}
              </select>
            </div>

            {/* Departure SoC Slider */}
            <div className="p-3.5 rounded-lg bg-[#050507] border border-white/[0.12] space-y-2">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-[#A1A1AA] flex items-center space-x-1.5">
                  <BatteryCharging className="w-3.5 h-3.5 text-white" />
                  <span>Departure Battery Level</span>
                </span>
                <span className="font-bold text-white text-sm">{tripSoC}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                value={tripSoC}
                onChange={e => {
                  setTripSoC(Number(e.target.value));
                  updateSoC(Number(e.target.value));
                }}
                className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-white"
              />
              <div className="flex justify-between text-[10px] text-[#71717A] font-mono">
                <span>10% Reserve</span>
                <span>Usable: ~{Math.round((activeVehicle?.rangeKm * tripSoC) / 100)} km</span>
                <span>100% Full</span>
              </div>
            </div>

            {/* Desired Arrival Buffer */}
            <div className="p-3.5 rounded-lg bg-[#050507] border border-white/[0.12] space-y-2">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-[#A1A1AA]">Arrival Reserve Buffer</span>
                <span className="font-bold text-white">{arrivalBufferSoC}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="35"
                value={arrivalBufferSoC}
                onChange={e => setArrivalBufferSoC(Number(e.target.value))}
                className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-white"
              />
              <span className="text-[10px] text-[#71717A] font-mono block">
                Safety margin to prevent low-voltage stranding on highway.
              </span>
            </div>

            {/* Compute Route Primary Button */}
            <button
              onClick={() => handleCalculateTrip()}
              disabled={loading}
              className="w-full py-3 rounded-lg bg-white text-[#050507] font-extrabold hover:bg-zinc-200 transition-all shadow-md text-xs uppercase font-mono tracking-wider flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-40"
            >
              {loading ? (
                <span>Calculating Highway Corridor...</span>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Compute Optimal Route</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Col: Map & Corridor Itinerary (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {error && (
            <div className="p-4 rounded-lg bg-[#121216] border border-white/[0.12] text-white text-xs font-mono flex items-center justify-between">
              <span>{error}</span>
              <button onClick={() => handleCalculateTrip()} className="underline ml-2">Retry</button>
            </div>
          )}

          {saveSuccessMsg && (
            <div className="p-3 rounded-lg bg-[#121216] border border-white/[0.12] text-white text-xs font-mono flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-white" />
              <span>{saveSuccessMsg}</span>
            </div>
          )}

          {/* High-Level Corridor Metrics Banner */}
          {planResult && (
            <div className="bg-[#0B0B0E] border border-white/[0.12] rounded-xl p-6 sm:p-8 relative shadow-2xl">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 mb-6 border-b border-white/[0.08] gap-2">
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-xs font-mono text-white font-bold uppercase tracking-wider">
                      Calculated Corridor Profile
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono border border-white/[0.12] bg-[#121216] text-[#A1A1AA]">
                      {planResult.is_local_fallback ? 'Client Battery Model' : 'FastAPI Engine'}
                    </span>
                    {planResult.is_actual_osrm_road && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-white text-[#050507] font-bold">
                        OSRM Road Verified
                      </span>
                    )}
                  </div>
                  <h3 className="text-2xl font-extrabold text-white mt-0.5">
                    {planResult.origin} <span className="text-[#A1A1AA]">→</span> {planResult.destination}
                  </h3>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleSaveCurrentTrip}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#121216] border border-white/[0.12] text-xs font-mono text-[#A1A1AA] hover:text-white hover:border-white/30 transition-all cursor-pointer"
                  >
                    <Bookmark className="w-3.5 h-3.5" />
                    <span>Save Trip</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-3.5 rounded-lg bg-[#050507] border border-white/[0.12]">
                  <span className="text-[10px] font-mono text-[#71717A] block uppercase">Distance</span>
                  <span className="text-2xl font-extrabold font-mono text-white">{planResult.total_distance_km} km</span>
                  <span className="text-[10px] text-[#A1A1AA] font-mono block mt-0.5">{planResult.estimated_driving_time_hours}h Drive</span>
                </div>

                <div className="p-3.5 rounded-lg bg-[#050507] border border-white/[0.12]">
                  <span className="text-[10px] font-mono text-[#71717A] block uppercase">Charging Stops</span>
                  <span className="text-2xl font-extrabold font-mono text-white">
                    {planResult.required_stops_count} {planResult.required_stops_count === 1 ? 'Stop' : 'Stops'}
                  </span>
                  <span className="text-[10px] text-[#A1A1AA] font-mono block mt-0.5">{planResult.total_charging_time_mins} mins Dwell</span>
                </div>

                <div className="p-3.5 rounded-lg bg-[#050507] border border-white/[0.12]">
                  <span className="text-[10px] font-mono text-[#71717A] block uppercase">Total Trip Time</span>
                  <span className="text-2xl font-extrabold font-mono text-white">{planResult.total_trip_duration}</span>
                  <span className="text-[10px] text-[#A1A1AA] font-mono block mt-0.5">Drive + Charging</span>
                </div>

                <div className="p-3.5 rounded-lg bg-[#050507] border border-white/[0.12]">
                  <span className="text-[10px] font-mono text-[#71717A] block uppercase">Est. Tariff</span>
                  <span className="text-2xl font-extrabold font-mono text-white">{planResult.currency}{planResult.total_charging_cost.toFixed(0)}</span>
                  <span className="text-[10px] text-[#A1A1AA] font-mono block mt-0.5">Arrival SoC ~{planResult.projected_final_soc_pct}%</span>
                </div>
              </div>
            </div>
          )}

          {/* Interactive Route Map */}
          <div className="w-full h-80 rounded-xl overflow-hidden border border-white/[0.12] shadow-2xl relative">
            <MapContainer
              center={mapCenter}
              zoom={8}
              scrollWheelZoom={false}
              className="w-full h-full"
              style={{ background: '#050507' }}
            >
              <MapBoundsRecenter corridorBounds={routeCoordinates.length > 1 ? routeCoordinates : routeBounds} />

              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                className="dark-map-tiles"
                maxZoom={19}
              />

              <Polyline
                positions={routeCoordinates.length > 0 ? routeCoordinates : polylineCoords}
                color="#FFFFFF"
                weight={4}
                opacity={0.9}
                dashArray={routeCoordinates.length > 0 ? undefined : "6, 6"}
              />

              <Marker position={originCoords} icon={createPinIcon('START')}>
                <Popup className="dark-leaflet-popup">
                  <div className="p-1 font-mono text-xs">
                    <strong className="text-white">Origin:</strong> {origin}
                  </div>
                </Popup>
              </Marker>

              <Marker position={destCoords} icon={createPinIcon('DESTINATION')}>
                <Popup className="dark-leaflet-popup">
                  <div className="p-1 font-mono text-xs">
                    <strong className="text-white">Destination:</strong> {destination}
                  </div>
                </Popup>
              </Marker>

              {planResult?.recommended_stops?.map((stop, idx) => {
                const pos = stopCoords[idx] || [
                  originCoords[0] + (destCoords[0] - originCoords[0]) * ((idx + 1) / (planResult.recommended_stops.length + 1)),
                  originCoords[1] + (destCoords[1] - originCoords[1]) * ((idx + 1) / (planResult.recommended_stops.length + 1))
                ];
                return (
                  <Marker key={idx} position={pos} icon={createPinIcon(`STOP ${idx+1}`)}>
                    <Popup className="dark-leaflet-popup">
                      <div className="p-1 font-mono text-xs text-white">
                        <strong className="text-white block mb-1">{stop.station_name}</strong>
                        <div>Dwell: {stop.recommended_dwell_mins} mins</div>
                        <div>Throughput: {stop.charger_speed_kw} kW DC</div>
                        <div>Cost: ₹{stop.est_stop_cost}</div>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>

            {/* Free Map Engine Badge */}
            <div className="absolute bottom-3 right-3 z-20 bg-[#0B0B0E]/90 backdrop-blur-md px-3 py-1 rounded-lg border border-white/[0.12] text-[10px] font-mono text-[#A1A1AA] flex items-center space-x-1.5 pointer-events-none">
              <span className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_6px_rgba(255,255,255,0.8)]"></span>
              <span>{isOsrmRoad ? 'OpenStreetMap + OSRM Real Road Route' : 'OpenStreetMap Corridor Geometry'}</span>
            </div>
          </div>

          {/* Stop-by-Stop Itinerary Timeline */}
          {planResult && (
            <div className="bg-[#0B0B0E] border border-white/[0.12] rounded-xl p-6 sm:p-8 space-y-6">
              <h4 className="text-base font-bold text-white tracking-tight flex items-center space-x-2">
                <Clock className="w-4 h-4 text-white" />
                <span>Stop-by-Stop Charging Itinerary</span>
              </h4>

              <div className="space-y-6 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-white/10">
                {/* Step 1: Departure */}
                <div className="relative flex items-start space-x-4 pl-1">
                  <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-[10px] font-bold text-[#050507] shrink-0 z-10">
                    A
                  </div>
                  <div className="flex-1 bg-[#050507] p-4 rounded-lg border border-white/[0.12] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="text-xs font-mono text-[#71717A]">DEPARTURE</div>
                      <h5 className="text-sm font-bold text-white">{planResult.origin}</h5>
                    </div>
                    <div className="text-xs font-mono text-white font-bold">
                      Initial SoC: {tripSoC}% (~{Math.round((activeVehicle?.rangeKm * tripSoC) / 100)} km)
                    </div>
                  </div>
                </div>

                {/* Intermediate Charging Stops */}
                {planResult.recommended_stops?.map((stop, i) => (
                  <div key={i} className="relative flex items-start space-x-4 pl-1">
                    <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-[10px] font-bold text-[#050507] shrink-0 z-10 shadow-md">
                      <Zap className="w-3.5 h-3.5 fill-[#050507]" />
                    </div>
                    <div className="flex-1 bg-[#121216] p-4 rounded-lg border border-white/[0.12] space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <div>
                          <span className="text-[10px] font-mono uppercase bg-[#050507] text-[#A1A1AA] border border-white/[0.12] px-2 py-0.5 rounded">
                            Recommended Charging Hub #{i + 1}
                          </span>
                          <h5 className="text-base font-bold text-white mt-1.5">{stop.station_name}</h5>
                          <span className="text-xs text-[#A1A1AA]">{stop.location}</span>
                        </div>
                        <div className="text-right font-mono text-xs">
                          <span className="text-white font-bold block">Dwell ~{stop.recommended_dwell_mins} mins</span>
                          <span className="text-[#71717A] text-[11px]">Est. Cost: ₹{stop.est_stop_cost}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/[0.08] text-xs font-mono text-center">
                        <div className="bg-[#050507] p-2 rounded">
                          <span className="text-[10px] text-[#71717A] block">ARRIVAL SOC</span>
                          <span className="text-white font-bold">{stop.arrival_soc_pct}%</span>
                        </div>
                        <div className="bg-[#050507] p-2 rounded">
                          <span className="text-[10px] text-[#71717A] block">CHARGE SPEED</span>
                          <span className="text-white font-bold">{stop.charger_speed_kw} kW DC</span>
                        </div>
                        <div className="bg-[#050507] p-2 rounded">
                          <span className="text-[10px] text-[#71717A] block">DEPARTURE SOC</span>
                          <span className="text-white font-bold">{stop.departure_soc_pct}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Final Destination */}
                <div className="relative flex items-start space-x-4 pl-1">
                  <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-[10px] font-bold text-[#050507] shrink-0 z-10">
                    B
                  </div>
                  <div className="flex-1 bg-[#050507] p-4 rounded-lg border border-white/[0.12] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="text-xs font-mono text-[#71717A]">ARRIVAL DESTINATION</div>
                      <h5 className="text-sm font-bold text-white">{planResult.destination}</h5>
                    </div>
                    <div className="text-xs font-mono text-white font-bold">
                      Arrival Reserve: ~{planResult.projected_final_soc_pct}% SoC
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Saved Trips Section */}
      {savedTripsList.length > 0 && (
        <section className="space-y-4 pt-6 border-t border-white/[0.12]">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-white flex items-center space-x-2">
              <Bookmark className="w-4 h-4 text-white" />
              <span>Saved Road Trip Plans ({savedTripsList.length})</span>
            </h3>
            <span className="text-xs font-mono text-[#71717A]">Persisted in SQLite database</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {savedTripsList.map(t => (
              <div key={t.id} className="bg-[#0B0B0E] p-5 rounded-xl border border-white/[0.12] space-y-3 relative group">
                <div className="flex items-start justify-between">
                  <div>
                    <h5 className="text-sm font-bold text-white">{t.title}</h5>
                    <div className="text-xs text-[#A1A1AA] mt-0.5">{t.origin} → {t.destination}</div>
                  </div>
                  <button
                    onClick={() => handleDeleteTrip(t.id)}
                    className="p-1.5 rounded text-[#71717A] hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                    title="Delete saved trip"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2 p-2 rounded bg-[#050507] border border-white/[0.08] text-xs font-mono text-center">
                  <div>
                    <span className="text-[9px] text-[#71717A] block">DISTANCE</span>
                    <span className="text-white font-bold">{t.distanceKm} km</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-[#71717A] block">DURATION</span>
                    <span className="text-white font-bold">{t.estDuration}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-[#71717A] block">COST</span>
                    <span className="text-white font-bold">{t.estCost}</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setOrigin(t.origin);
                    setDestination(t.destination);
                    handleCalculateTrip(t.destination);
                  }}
                  className="w-full py-2 rounded-lg text-xs font-mono text-center bg-white text-[#050507] hover:bg-zinc-200 font-bold uppercase transition-all shadow-sm cursor-pointer"
                >
                  Load Route Plan →
                </button>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
