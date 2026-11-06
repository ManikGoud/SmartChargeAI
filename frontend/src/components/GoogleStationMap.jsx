import { useEffect, useRef, useState } from 'react';
import { DemoDataBadge } from './Badge';

// Dark Cyberpunk / Automotive styling for Google Maps matching the #00FF66 theme
const GOOGLE_MAP_DARK_STYLES = [
  { elementType: "geometry", stylers: [{ color: "#070B0E" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#070B0E" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#8E9AA8" }] },
  {
    featureType: "administrative.locality",
    elementType: "labels.text.fill",
    stylers: [{ color: "#00FF66" }]
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#6A7B8C" }]
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#0D1614" }]
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#161F28" }]
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#0E141B" }]
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ color: "#9CA3AF" }]
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#22313F" }]
  },
  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [{ color: "#141C24" }]
  },
  {
    featureType: "road.highway",
    elementType: "labels.text.fill",
    stylers: [{ color: "#00FF66" }]
  },
  {
    featureType: "transit",
    elementType: "geometry",
    stylers: [{ color: "#16202B" }]
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#050C14" }]
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#3E5266" }]
  }
];

export function GoogleStationMap({ 
  stations = [], 
  selectedStation = null, 
  onSelectStation, 
  onNavigate,
  onError 
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const infoWindowRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

  // 1. Load Google Maps script dynamically
  useEffect(() => {
    if (!apiKey) {
      if (onError) onError('No Google Maps Demo Key provided.');
      return;
    }

    // Set up auth failure hook
    window.gm_authFailure = () => {
      console.warn('Google Maps authentication failure or quota exceeded. Falling back to OpenStreetMap.');
      if (onError) onError('Google Maps authentication failed (Invalid key or quota limit).');
    };

    // If already loaded on window
    if (window.google && window.google.maps) {
      setIsLoaded(true);
      return;
    }

    const existingScript = document.getElementById('google-maps-script');
    if (!existingScript) {
      const script = document.createElement('script');
      script.id = 'google-maps-script';
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=geometry`;
      script.async = true;
      script.defer = true;
      script.onload = () => setIsLoaded(true);
      script.onerror = () => {
        if (onError) onError('Failed to load Google Maps script from CDN.');
      };
      document.head.appendChild(script);
    } else {
      existingScript.addEventListener('load', () => setIsLoaded(true));
    }
  }, [apiKey, onError]);

  // 2. Initialize Google Map instance
  useEffect(() => {
    if (!isLoaded || !mapContainerRef.current || !window.google || !window.google.maps) return;

    if (!mapInstanceRef.current) {
      const defaultCenter = { lat: 17.4400, lng: 78.3800 }; // Hyderabad
      mapInstanceRef.current = new window.google.maps.Map(mapContainerRef.current, {
        center: defaultCenter,
        zoom: 12,
        styles: GOOGLE_MAP_DARK_STYLES,
        disableDefaultUI: false,
        zoomControl: true,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        backgroundColor: '#070B0E'
      });

      infoWindowRef.current = new window.google.maps.InfoWindow();
    }
  }, [isLoaded]);

  // 3. Render and update Station Markers
  useEffect(() => {
    if (!isLoaded || !mapInstanceRef.current || !window.google || !window.google.maps) return;

    // Clear previous markers
    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = [];

    const map = mapInstanceRef.current;

    stations.forEach(station => {
      const isSelected = selectedStation?.id === station.id;
      const isAvailable = station.status === 'Available';
      const color = isSelected ? '#00FF66' : isAvailable ? '#10B981' : '#F59E0B';

      // SVG Pin with lightning bolt
      const svgIcon = {
        path: "M 0,0 C -2,-20 -10,-22 -10,-30 A 10,10 0 1,1 10,-30 C 10,-22 2,-20 0,0 Z",
        fillColor: color,
        fillOpacity: 1,
        strokeColor: "#05070A",
        strokeWeight: 2,
        scale: 1.3,
        labelOrigin: new window.google.maps.Point(0, -30)
      };

      const marker = new window.google.maps.Marker({
        position: { lat: station.lat, lng: station.lng },
        map: map,
        title: station.name,
        icon: svgIcon,
        zIndex: isSelected ? 999 : 1
      });

      marker.addListener('click', () => {
        if (onSelectStation) onSelectStation(station);

        const contentString = `
          <div style="background: #0B0F17; color: #FFFFFF; padding: 12px; border-radius: 12px; font-family: monospace; min-width: 210px; border: 1px solid ${color}; box-shadow: 0 4px 20px rgba(0,0,0,0.8);">
            <div style="font-weight: bold; font-size: 13px; color: #FFFFFF; margin-bottom: 4px;">${station.name}</div>
            <div style="font-size: 10px; color: #9CA3AF; margin-bottom: 8px;">${station.address}</div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 11px;">
              <span style="color: #00FF66; font-weight: bold;">${station.peakPowerKw} kW DC</span>
              <span style="color: #10B981;">₹${station.pricePerKwh}/kWh</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 8px;">
              <span style="color: ${color}; font-size: 10px; font-weight: bold;">● ${station.availablePorts}/${station.totalPorts} Ports Free</span>
              <button id="nav-btn-${station.id}" style="background: #00FF66; color: #000; border: none; padding: 4px 10px; border-radius: 6px; font-weight: bold; font-size: 10px; cursor: pointer;">
                Navigate
              </button>
            </div>
          </div>
        `;

        infoWindowRef.current.setContent(contentString);
        infoWindowRef.current.open(map, marker);

        // Attach navigate click handler
        setTimeout(() => {
          const navBtn = document.getElementById(`nav-btn-${station.id}`);
          if (navBtn && onNavigate) {
            navBtn.onclick = () => {
              onNavigate(station);
              infoWindowRef.current.close();
            };
          }
        }, 100);
      });

      markersRef.current.push(marker);
    });
  }, [stations, selectedStation, isLoaded, onSelectStation, onNavigate]);

  // 4. Smooth Pan when selectedStation changes
  useEffect(() => {
    if (!mapInstanceRef.current || !selectedStation) return;
    mapInstanceRef.current.panTo({ lat: selectedStation.lat, lng: selectedStation.lng });
    mapInstanceRef.current.setZoom(14);
  }, [selectedStation]);

  return (
    <div className="w-full h-full relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-[#070B0E]">
      <div ref={mapContainerRef} className="w-full h-full min-h-[400px]" />

      {/* Demo Overlay Badge */}
      <div className="absolute top-3 right-3 z-10 pointer-events-none">
        <DemoDataBadge />
      </div>

      {/* Availability Status Indicator */}
      <div className="absolute bottom-3 left-3 z-10 bg-dark-950/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-[11px] font-mono text-slate-300 flex items-center space-x-3 pointer-events-none">
        <span className="flex items-center space-x-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
          <span>Available</span>
        </span>
        <span className="flex items-center space-x-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
          <span>Occupied</span>
        </span>
      </div>

      {/* Engine & Zero-Cost Prototyping Badge */}
      <div className="absolute bottom-3 right-3 z-10 bg-dark-950/90 backdrop-blur-md px-2.5 py-1 rounded-xl border border-[#00FF66]/30 text-[10px] font-mono text-slate-300 flex items-center space-x-1.5 pointer-events-none">
        <span className="w-1.5 h-1.5 rounded-full bg-[#00FF66] animate-pulse"></span>
        <span className="text-white font-bold">Google Maps Engine</span>
        <span className="text-slate-500">•</span>
        <span className="text-[#00FF66]">Official Demo Key</span>
      </div>
    </div>
  );
}

export default GoogleStationMap;

