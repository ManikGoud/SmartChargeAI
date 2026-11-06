import { useState, useEffect } from 'react';
import { LeafletMap } from './LeafletMap';
import { GoogleStationMap } from './GoogleStationMap';
import { Layers, AlertCircle, Check } from 'lucide-react';

export function StationMapView({
  stations = [],
  selectedStation = null,
  onSelectStation,
  onNavigate
}) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY?.trim() || '';
  
  // Default to Google Maps if API key is present, otherwise OpenStreetMap Leaflet
  const [activeEngine, setActiveEngine] = useState(apiKey ? 'google' : 'leaflet');
  const [googleError, setGoogleError] = useState(null);

  useEffect(() => {
    if (!apiKey) {
      setActiveEngine('leaflet');
    }
  }, [apiKey]);

  const handleGoogleMapsError = (errMsg) => {
    console.warn('Google Maps error detected:', errMsg);
    setGoogleError(errMsg);
    setActiveEngine('leaflet'); // Automatic instantaneous fallback
  };

  return (
    <div className="relative w-full h-full">
      {/* 1. Map Engine Switcher Overlay Controls */}
      <div className="absolute top-3 left-3 z-30 flex items-center space-x-2">
        <div className="bg-[#0B0B0E]/95 backdrop-blur-md p-1 rounded-xl border border-white/[0.12] text-xs font-mono shadow-2xl flex items-center space-x-1">
          <div className="px-2 py-1 text-[#A1A1AA] flex items-center space-x-1.5 text-[11px]">
            <Layers className="w-3.5 h-3.5 text-white" />
            <span className="hidden sm:inline">Engine:</span>
          </div>

          {/* Google Maps Button */}
          <button
            onClick={() => {
              if (!apiKey) {
                alert('No Google Maps Demo Key detected in VITE_GOOGLE_MAPS_API_KEY. Using OpenStreetMap.');
                return;
              }
              setGoogleError(null);
              setActiveEngine('google');
            }}
            className={`px-2.5 py-1 rounded-lg transition-all text-xs flex items-center space-x-1 ${
              activeEngine === 'google'
                ? 'bg-white text-[#050507] font-bold shadow-md'
                : 'text-[#A1A1AA] hover:text-white hover:bg-white/10'
            }`}
            title={apiKey ? "View with Google Maps Demo Engine" : "Add VITE_GOOGLE_MAPS_API_KEY in .env.local to activate"}
          >
            <span>Google Maps</span>
            {activeEngine === 'google' && <Check className="w-3 h-3 ml-0.5" />}
          </button>

          {/* OpenStreetMap Button */}
          <button
            onClick={() => setActiveEngine('leaflet')}
            className={`px-2.5 py-1 rounded-lg transition-all text-xs flex items-center space-x-1 ${
              activeEngine === 'leaflet'
                ? 'bg-white text-[#050507] font-bold shadow-md'
                : 'text-[#A1A1AA] hover:text-white hover:bg-white/10'
            }`}
            title="Free OpenStreetMap + Leaflet engine"
          >
            <span>OpenStreetMap</span>
            {activeEngine === 'leaflet' && <Check className="w-3 h-3 ml-0.5" />}
          </button>
        </div>

        {/* Fallback Notice if Google Maps failed */}
        {googleError && (
          <div className="bg-amber-500/15 border border-amber-500/30 text-amber-300 px-3 py-1 rounded-xl text-[10px] font-mono flex items-center space-x-1.5 shadow-lg backdrop-blur-md">
            <AlertCircle className="w-3 h-3 text-amber-400 shrink-0" />
            <span className="hidden md:inline">Key Quota / Auth issue → Active: <strong>Leaflet Fallback</strong></span>
            <span className="md:hidden">OSM Fallback Active</span>
          </div>
        )}
      </div>

      {/* 2. Render Active Engine */}
      {activeEngine === 'google' && apiKey && !googleError ? (
        <GoogleStationMap
          stations={stations}
          selectedStation={selectedStation}
          onSelectStation={onSelectStation}
          onNavigate={onNavigate}
          onError={handleGoogleMapsError}
        />
      ) : (
        <LeafletMap
          stations={stations}
          selectedStation={selectedStation}
          onSelectStation={onSelectStation}
          onNavigate={onNavigate}
        />
      )}
    </div>
  );
}

export default StationMapView;

