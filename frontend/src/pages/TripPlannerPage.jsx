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
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { useVehicle } from '../context/VehicleContext';
import { planTrip, saveTrip, fetchSavedTrips, deleteSavedTrip } from '../services/api';
import { Badge, DemoDataBadge } from '../components/Badge';

// Known coordinates for Hyderabad corridors
const CORRIDOR_COORDS = {
  'hitec city, hyderabad': [17.4450, 78.3820],
  'gachibowli, hyderabad': [17.4400, 78.3489],
  'secunderabad': [17.4399, 78.4983],
  'shamshabad rgia': [17.2403, 78.4294],
  'warangal': [17.9689, 79.5941],
  'vijayawada': [16.5062, 80.6480],
  'nagarjuna sagar': [16.5775, 79.3125],
  'srisailam': [16.0740, 78.8680],
  'bengaluru': [12.9716, 77.5946],
};

const createPinIcon = (color, label) => {
  return L.divIcon({
    className: 'custom-trip-pin',
    html: `
      <div style="position: relative; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">
        <div style="
          width: 26px; 
          height: 26px; 
          background: #0B0F17; 
          border: 2px solid ${color}; 
          border-radius: 50%; 
          display: flex; 
          align-items: center; 
          justify-content: center;
          box-shadow: 0 0 14px ${color}80;
        ">
          <div style="width: 8px; height: 8px; background: ${color}; border-radius: 50%;"></div>
        </div>
        <div style="position: absolute; bottom: -18px; white-space: nowrap; font-size: 10px; font-weight: bold; font-family: monospace; color: #fff; background: #07090E; border: 1px solid ${color}; padding: 1px 4px; border-radius: 4px;">
          ${label}
        </div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

export function TripPlannerPage({ setCurrentPage }) {
  const { activeVehicle, currentSoC, updateSoC, vehicles, selectVehicle } = useVehicle();

  // Inputs
  const [origin, setOrigin] = useState('HITEC City, Hyderabad');
  const [destination, setDestination] = useState('Warangal');
  const [tripSoC, setTripSoC] = useState(currentSoC || 50);
  const [arrivalBufferSoC, setArrivalBufferSoC] = useState(20);

  // Results State
  const [planResult, setPlanResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Saved Trips
  const [savedTripsList, setSavedTripsList] = useState([]);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(null);

  // Quick Corridor Presets
  const popularCorridors = [
    { from: 'HITEC City, Hyderabad', to: 'Warangal', dist: '152 km' },
    { from: 'Gachibowli, Hyderabad', to: 'Vijayawada', dist: '275 km' },
    { from: 'Secunderabad', to: 'Nagarjuna Sagar', dist: '165 km' },
    { from: 'Shamshabad RGIA', to: 'Bengaluru', dist: '570 km' },
  ];

  // Fetch initial plan on mount or when user clicks compute
  const handleCalculateTrip = async (customDest = null) => {
    setLoading(true);
    setError(null);
    setSaveSuccessMsg(null);

    const targetDest = customDest || destination;

    const payload = {
      origin: origin,
      destination: targetDest,
      vehicle_id: activeVehicle?.id,
      battery_capacity_kwh: activeVehicle?.batteryCapacity || 72.0,
      current_soc_pct: Number(tripSoC),
      desired_arrival_soc_pct: Number(arrivalBufferSoC),
      vehicle_range_km: activeVehicle?.rangeKm || 450.0
    };

    const res = await planTrip(payload);
    if (res.success && res.data) {
      setPlanResult(res.data);
    } else {
      setError(res.error || 'Failed to calculate optimal route');
    }
    setLoading(false);
  };

  useEffect(() => {
    handleCalculateTrip();
    loadSavedTrips();
  }, [activeVehicle]);

  const loadSavedTrips = async () => {
    const res = await fetchSavedTrips();
    if (res.success && Array.isArray(res.data)) {
      setSavedTripsList(res.data);
    }
  };

  const handleSaveCurrentTrip = async () => {
    if (!planResult) return;
    const payload = {
      title: `${planResult.origin.split(',')[0]} to ${planResult.destination} Drive`,
      origin: planResult.origin,
      destination: planResult.destination,
      distance_km: planResult.total_distance_km,
      est_duration: planResult.total_trip_duration,
      recommended_stops: planResult.required_stops_count,
      suggested_station: planResult.recommended_stops?.[0]?.station_name || 'Highway ChargeHub',
      dwell_time_mins: planResult.recommended_stops?.[0]?.recommended_dwell_mins || 25,
      est_cost: `₹${planResult.total_charging_cost.toFixed(0)}`,
      battery_arrival_soc: planResult.projected_final_soc_pct
    };

    const res = await saveTrip(payload);
    if (res.success) {
      setSaveSuccessMsg('Trip saved to database successfully!');
      loadSavedTrips();
      setTimeout(() => setSaveSuccessMsg(null), 3500);
    }
  };

  const handleDeleteTrip = async (tripId) => {
    const res = await deleteSavedTrip(tripId);
    if (res.success) {
      setSavedTripsList(prev => prev.filter(t => t.id !== tripId));
    }
  };

  // Resolve Map Polyline Coordinates
  const getCoordinates = (locName) => {
    const clean = locName.toLowerCase().trim();
    for (const [key, coords] of Object.entries(CORRIDOR_COORDS)) {
      if (clean.includes(key) || key.includes(clean)) {
        return coords;
      }
    }
    return [17.4450, 78.3820]; // Default Hyderabad
  };

  const originCoords = getCoordinates(origin);
  const destCoords = getCoordinates(destination);

  // Generate intermediate points for polyline
  const polylineCoords = [originCoords];
  if (planResult?.recommended_stops?.length > 0) {
    planResult.recommended_stops.forEach((stop, idx) => {
      const ratio = (idx + 1) / (planResult.recommended_stops.length + 1);
      const intermediateLat = originCoords[0] + (destCoords[0] - originCoords[0]) * ratio + 0.05;
      const intermediateLng = originCoords[1] + (destCoords[1] - originCoords[1]) * ratio - 0.03;
      polylineCoords.push([intermediateLat, intermediateLng]);
    });
  }
  polylineCoords.push(destCoords);

  const mapCenter = [
    (originCoords[0] + destCoords[0]) / 2,
    (originCoords[1] + destCoords[1]) / 2
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/5">
        <div>
          <div className="flex items-center space-x-2 text-xs font-mono text-brand-cyan mb-1.5">
            <Compass className="w-4 h-4" />
            <span>DYNAMIC HIGHWAY BATTERY ROUTING</span>
            <DemoDataBadge />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Intelligent EV Trip Planner
          </h1>
          <p className="text-slate-400 text-sm mt-1 max-w-2xl">
            Calculates high-voltage charging corridors, battery depletion buffers, and minimum dwell times for seamless intercity EV travel.
          </p>
        </div>

        {/* Quick Corridor Buttons */}
        <div className="flex flex-wrap gap-2">
          {popularCorridors.map((c, i) => (
            <button
              key={i}
              onClick={() => {
                setOrigin(c.from);
                setDestination(c.to);
                handleCalculateTrip(c.to);
              }}
              className="px-3 py-1.5 rounded-xl bg-dark-900 border border-white/5 hover:border-brand-cyan/40 text-xs font-mono text-slate-300 hover:text-brand-cyan transition-colors"
            >
              {c.to} ({c.dist})
            </button>
          ))}
        </div>
      </div>

      {/* Main Form and Parameters Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Col: Trip Input Parameters (4 cols) */}
        <div className="lg:col-span-4 glass-panel rounded-3xl p-6 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-white/5">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-200 font-bold flex items-center space-x-2">
              <Navigation className="w-4 h-4 text-brand-cyan" />
              <span>Route Parameters</span>
            </span>
            <span className="text-xs font-mono text-brand-cyan font-bold">{activeVehicle?.make}</span>
          </div>

          {/* Form */}
          <div className="space-y-4">
            {/* Origin */}
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">Departure Origin</label>
              <input
                type="text"
                value={origin}
                onChange={e => setOrigin(e.target.value)}
                placeholder="e.g. HITEC City, Hyderabad"
                className="w-full bg-dark-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-brand-cyan font-sans"
              />
            </div>

            {/* Destination */}
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">Destination</label>
              <input
                type="text"
                value={destination}
                onChange={e => setDestination(e.target.value)}
                placeholder="e.g. Warangal, Vijayawada, Bengaluru"
                className="w-full bg-dark-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-brand-cyan font-sans"
              />
            </div>

            {/* Vehicle Selector */}
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">Selected Vehicle Profile</label>
              <select
                value={activeVehicle?.id}
                onChange={e => selectVehicle(e.target.value)}
                className="w-full bg-dark-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-brand-cyan font-sans"
              >
                {vehicles.map(v => (
                  <option key={v.id} value={v.id}>
                    {v.make} {v.model} ({v.batteryCapacity} kWh • {v.rangeKm} km)
                  </option>
                ))}
              </select>
            </div>

            {/* Departure Battery SoC % Slider */}
            <div className="p-3.5 rounded-xl bg-dark-950/70 border border-white/5 space-y-2">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-slate-400 flex items-center space-x-1.5">
                  <BatteryCharging className="w-3.5 h-3.5 text-brand-cyan" />
                  <span>Departure Battery Level</span>
                </span>
                <span className="font-bold text-brand-cyan text-sm">{tripSoC}%</span>
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
                className="w-full h-2 bg-dark-800 rounded-lg appearance-none cursor-pointer accent-brand-cyan"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>10%</span>
                <span>Usable: ~{Math.round((activeVehicle?.rangeKm * tripSoC) / 100)} km</span>
                <span>100%</span>
              </div>
            </div>

            {/* Desired Arrival Buffer SoC */}
            <div className="p-3.5 rounded-xl bg-dark-950/70 border border-white/5 space-y-2">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-slate-400">Arrival Battery Buffer Reserve</span>
                <span className="font-bold text-emerald-400">{arrivalBufferSoC}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="35"
                value={arrivalBufferSoC}
                onChange={e => setArrivalBufferSoC(Number(e.target.value))}
                className="w-full h-2 bg-dark-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
              />
              <span className="text-[10px] text-slate-500 font-mono block">
                Safety buffer to prevent low-voltage strandings upon arrival.
              </span>
            </div>

            {/* Action Button */}
            <button
              onClick={() => handleCalculateTrip()}
              disabled={loading}
              className="w-full py-3 rounded-2xl bg-brand-cyan text-dark-950 font-extrabold hover:bg-brand-cyan/90 transition-all shadow-cyan-glow text-xs uppercase font-mono tracking-wider flex items-center justify-center space-x-2"
            >
              {loading ? (
                <span>Calculating Corridor...</span>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Compute Optimal Route</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Col: Route Plan Results & Interactive Map (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {error && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono flex items-center justify-between">
              <span>{error}</span>
              <button onClick={() => handleCalculateTrip()} className="underline ml-2">Retry</button>
            </div>
          )}

          {saveSuccessMsg && (
            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{saveSuccessMsg}</span>
            </div>
          )}

          {/* High-Level Journey Metrics Banner */}
          {planResult && (
            <div className="glass-panel-glow rounded-3xl p-6 sm:p-8 relative">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 mb-6 border-b border-white/5 gap-2">
                <div>
                  <span className="text-xs font-mono text-brand-cyan font-bold uppercase tracking-wider">
                    CALCULATED CORRIDOR PROFILE
                  </span>
                  <h3 className="text-2xl font-extrabold text-white mt-0.5">
                    {planResult.origin} <span className="text-brand-cyan">→</span> {planResult.destination}
                  </h3>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleSaveCurrentTrip}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-mono text-slate-300 hover:text-brand-cyan hover:border-brand-cyan/30 transition-all"
                  >
                    <Bookmark className="w-3.5 h-3.5" />
                    <span>Save Trip</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                <div className="p-3 rounded-2xl bg-dark-950/70 border border-white/5">
                  <span className="text-[10px] font-mono text-slate-500 block uppercase">Total Distance</span>
                  <span className="text-2xl font-extrabold font-mono text-white">{planResult.total_distance_km} km</span>
                  <span className="text-[10px] text-slate-400 font-mono block mt-0.5">{planResult.estimated_driving_time_hours}h Driving</span>
                </div>

                <div className="p-3 rounded-2xl bg-dark-950/70 border border-white/5">
                  <span className="text-[10px] font-mono text-slate-500 block uppercase">Charging Stops</span>
                  <span className="text-2xl font-extrabold font-mono text-brand-cyan">
                    {planResult.required_stops_count} {planResult.required_stops_count === 1 ? 'Stop' : 'Stops'}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono block mt-0.5">{planResult.total_charging_time_mins} mins Dwell</span>
                </div>

                <div className="p-3 rounded-2xl bg-dark-950/70 border border-white/5">
                  <span className="text-[10px] font-mono text-slate-500 block uppercase">Total Trip Time</span>
                  <span className="text-2xl font-extrabold font-mono text-emerald-400">{planResult.total_trip_duration}</span>
                  <span className="text-[10px] text-slate-400 font-mono block mt-0.5">Drive + Charging</span>
                </div>

                <div className="p-3 rounded-2xl bg-dark-950/70 border border-white/5">
                  <span className="text-[10px] font-mono text-slate-500 block uppercase">Est. Session Cost</span>
                  <span className="text-2xl font-extrabold font-mono text-purple-400">{planResult.currency}{planResult.total_charging_cost.toFixed(0)}</span>
                  <span className="text-[10px] text-slate-400 font-mono block mt-0.5">Arrival SoC ~{planResult.projected_final_soc_pct}%</span>
                </div>
              </div>
            </div>
          )}

          {/* Interactive Route Polyline Map */}
          <div className="w-full h-80 rounded-3xl overflow-hidden border border-white/10 shadow-2xl relative">
            <MapContainer
              center={mapCenter}
              zoom={8}
              scrollWheelZoom={false}
              className="w-full h-full"
              style={{ background: '#07090E' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                subdomains="abcd"
              />

              {/* Route Polyline */}
              <Polyline
                positions={polylineCoords}
                color="#00F0FF"
                weight={4}
                opacity={0.8}
                dashArray="8, 6"
              />

              {/* Origin Marker */}
              <Marker position={originCoords} icon={createPinIcon('#3B82F6', 'START')}>
                <Popup className="dark-leaflet-popup">
                  <div className="p-1 font-mono text-xs">
                    <strong className="text-brand-blue">Origin:</strong> {origin}
                  </div>
                </Popup>
              </Marker>

              {/* Destination Marker */}
              <Marker position={destCoords} icon={createPinIcon('#10B981', 'DESTINATION')}>
                <Popup className="dark-leaflet-popup">
                  <div className="p-1 font-mono text-xs">
                    <strong className="text-emerald-400">Destination:</strong> {destination}
                  </div>
                </Popup>
              </Marker>

              {/* Intermediate Charging Stops */}
              {planResult?.recommended_stops?.map((stop, idx) => {
                const ratio = (idx + 1) / (planResult.recommended_stops.length + 1);
                const pos = [
                  originCoords[0] + (destCoords[0] - originCoords[0]) * ratio + 0.05,
                  originCoords[1] + (destCoords[1] - originCoords[1]) * ratio - 0.03
                ];
                return (
                  <Marker key={idx} position={pos} icon={createPinIcon('#00F0FF', `STOP #${idx+1}`)}>
                    <Popup className="dark-leaflet-popup">
                      <div className="p-1 font-mono text-xs text-white">
                        <strong className="text-brand-cyan block mb-1">{stop.station_name}</strong>
                        <div>Dwell: {stop.recommended_dwell_mins} mins</div>
                        <div>Throughput: {stop.charger_speed_kw} kW DC</div>
                        <div>Cost: ₹{stop.est_stop_cost}</div>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>
          </div>

          {/* Stop-by-Stop Itinerary Timeline */}
          {planResult && (
            <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-6">
              <h4 className="text-base font-bold text-white tracking-tight flex items-center space-x-2">
                <Clock className="w-4 h-4 text-brand-cyan" />
                <span>Stop-by-Stop Charging Itinerary</span>
              </h4>

              <div className="space-y-6 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-white/10">
                {/* Step 1: Departure */}
                <div className="relative flex items-start space-x-4 pl-1">
                  <div className="w-6 h-6 rounded-full bg-brand-blue flex items-center justify-center text-[10px] font-bold text-dark-950 shrink-0 z-10">
                    A
                  </div>
                  <div className="flex-1 bg-dark-950/70 p-4 rounded-2xl border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="text-xs font-mono text-slate-400">DEPARTURE</div>
                      <h5 className="text-sm font-bold text-white">{planResult.origin}</h5>
                    </div>
                    <div className="text-xs font-mono text-brand-cyan font-bold">
                      Initial SoC: {tripSoC}% (~{Math.round((activeVehicle?.rangeKm * tripSoC) / 100)} km)
                    </div>
                  </div>
                </div>

                {/* Charging Stops */}
                {planResult.recommended_stops?.map((stop, i) => (
                  <div key={i} className="relative flex items-start space-x-4 pl-1">
                    <div className="w-6 h-6 rounded-full bg-brand-cyan flex items-center justify-center text-[10px] font-bold text-dark-950 shrink-0 z-10 shadow-cyan-glow">
                      <Zap className="w-3.5 h-3.5 fill-dark-950" />
                    </div>
                    <div className="flex-1 bg-dark-900/90 p-4 rounded-2xl border border-brand-cyan/30 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <div>
                          <span className="text-[10px] font-mono uppercase bg-brand-cyan/20 text-brand-cyan px-2 py-0.5 rounded">
                            Recommended Charging Hub #{i + 1}
                          </span>
                          <h5 className="text-base font-bold text-white mt-1">{stop.station_name}</h5>
                          <span className="text-xs text-slate-400">{stop.location}</span>
                        </div>
                        <div className="text-right font-mono text-xs">
                          <span className="text-emerald-400 font-bold block">Dwell ~{stop.recommended_dwell_mins} mins</span>
                          <span className="text-slate-400 text-[11px]">Est. Cost: ₹{stop.est_stop_cost}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/5 text-xs font-mono text-center">
                        <div className="bg-dark-950/60 p-2 rounded-xl">
                          <span className="text-[10px] text-slate-500 block">ARRIVAL SOC</span>
                          <span className="text-amber-400 font-bold">{stop.arrival_soc_pct}%</span>
                        </div>
                        <div className="bg-dark-950/60 p-2 rounded-xl">
                          <span className="text-[10px] text-slate-500 block">CHARGE SPEED</span>
                          <span className="text-brand-cyan font-bold">{stop.charger_speed_kw} kW DC</span>
                        </div>
                        <div className="bg-dark-950/60 p-2 rounded-xl">
                          <span className="text-[10px] text-slate-500 block">DEPARTURE SOC</span>
                          <span className="text-emerald-400 font-bold">{stop.departure_soc_pct}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Final Destination */}
                <div className="relative flex items-start space-x-4 pl-1">
                  <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-[10px] font-bold text-dark-950 shrink-0 z-10 shadow-lg">
                    B
                  </div>
                  <div className="flex-1 bg-dark-950/70 p-4 rounded-2xl border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="text-xs font-mono text-slate-400">ARRIVAL DESTINATION</div>
                      <h5 className="text-sm font-bold text-white">{planResult.destination}</h5>
                    </div>
                    <div className="text-xs font-mono text-emerald-400 font-bold">
                      Safe Final SoC: ~{planResult.projected_final_soc_pct}% Reserve
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
        <section className="space-y-4 pt-6 border-t border-white/5">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-white flex items-center space-x-2">
              <Bookmark className="w-4 h-4 text-brand-cyan" />
              <span>Saved Road Trip Plans ({savedTripsList.length})</span>
            </h3>
            <span className="text-xs font-mono text-slate-500">Persisted in SQLite database</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {savedTripsList.map(t => (
              <div key={t.id} className="glass-panel p-5 rounded-2xl border border-white/5 space-y-3 relative group">
                <div className="flex items-start justify-between">
                  <div>
                    <h5 className="text-sm font-bold text-white">{t.title}</h5>
                    <div className="text-xs text-slate-400 mt-0.5">{t.origin} → {t.destination}</div>
                  </div>
                  <button
                    onClick={() => handleDeleteTrip(t.id)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-white/5 transition-colors"
                    title="Delete saved trip"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2 p-2 rounded-xl bg-dark-950/60 border border-white/5 text-xs font-mono text-center">
                  <div>
                    <span className="text-[9px] text-slate-500 block">DISTANCE</span>
                    <span className="text-white font-bold">{t.distanceKm} km</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-500 block">DURATION</span>
                    <span className="text-white font-bold">{t.estDuration}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-500 block">COST</span>
                    <span className="text-emerald-400 font-bold">{t.estCost}</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setOrigin(t.origin);
                    setDestination(t.destination);
                    handleCalculateTrip(t.destination);
                  }}
                  className="w-full py-1.5 rounded-xl text-xs font-mono text-center bg-white/5 text-brand-cyan hover:bg-brand-cyan/10 border border-brand-cyan/20 transition-colors"
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

