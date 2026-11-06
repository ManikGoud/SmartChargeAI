import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { SAMPLE_STATIONS } from '../data/sampleData';
import { useVehicle } from './VehicleContext';
import { fetchStations } from '../services/api';

const StationContext = createContext(null);

const LOCAL_STORAGE_KEY_BOOKMARKS = 'smartcharge_bookmarked_stations';

// Helper for Haversine distance
function getHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export function StationProvider({ children }) {
  const { activeVehicle } = useVehicle();
  const [stations, setStations] = useState(SAMPLE_STATIONS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isBackendSynced, setIsBackendSynced] = useState(false);
  const [syncStatus, setSyncStatus] = useState('syncing'); // 'syncing' | 'synced' | 'offline'
  const [backendStationCount, setBackendStationCount] = useState(0);
  const [selectedStation, setSelectedStation] = useState(null);

  // User location (defaults to Hyderabad HITEC City coordinates)
  const [userLocation, setUserLocation] = useState({ lat: 17.4450, lng: 78.3820, city: 'Hyderabad' });

  // Bookmarks
  const [bookmarkedIds, setBookmarkedIds] = useState(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY_BOOKMARKS);
      return saved ? JSON.parse(saved) : ['hyd-stat-101', 'hyd-stat-103'];
    } catch (e) {
      return ['hyd-stat-101', 'hyd-stat-103'];
    }
  });

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY_BOOKMARKS, JSON.stringify(bookmarkedIds));
  }, [bookmarkedIds]);

  const toggleBookmark = (id) => {
    setBookmarkedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [connectorFilter, setConnectorFilter] = useState('All');
  const [speedFilter, setSpeedFilter] = useState('All'); // 'All', 'ultra', 'fast', 'standard'
  const [availabilityOnly, setAvailabilityOnly] = useState(false);
  const [maxPrice, setMaxPrice] = useState(30);
  const [sortBy, setSortBy] = useState('distance'); // 'distance', 'price', 'speed', 'rating'
  const [filterVehicleCompatibleOnly, setFilterVehicleCompatibleOnly] = useState(false);

  // Load from FastAPI backend
  const loadStationsFromBackend = async () => {
    setSyncStatus('syncing');
    setLoading(true);
    setError(null);
    const res = await fetchStations();
    if (res.success && Array.isArray(res.data) && res.data.length > 0) {
      // Annotate with distance from user location
      const withDistance = res.data.map(s => ({
        ...s,
        distanceKm: s.distanceKm || getHaversineDistance(userLocation.lat, userLocation.lng, s.lat, s.lng)
      }));
      setStations(withDistance);
      setIsBackendSynced(true);
      setSyncStatus('synced');
      setBackendStationCount(res.data.length);
      setError(null);
    } else {
      console.info('Preserving local verified demo stations dataset');
      const withDistance = SAMPLE_STATIONS.map(s => ({
        ...s,
        distanceKm: s.distanceKm || getHaversineDistance(userLocation.lat, userLocation.lng, s.lat, s.lng)
      }));
      setStations(withDistance);
      setIsBackendSynced(false);
      setSyncStatus('offline');
      setBackendStationCount(0);
      if (res.error) setError(res.error);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadStationsFromBackend();
  }, []);

  // Filtered stations calculation
  const filteredStations = useMemo(() => {
    return stations.filter(station => {
      // Search term
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = station.name?.toLowerCase().includes(q);
        const matchesAddress = station.address?.toLowerCase().includes(q);
        const matchesNetwork = station.network?.toLowerCase().includes(q);
        if (!matchesName && !matchesAddress && !matchesNetwork) return false;
      }

      // Connector filter
      if (connectorFilter !== 'All') {
        const hasConnector = station.connectors?.some(c => 
          (c.type || c.plug_type)?.toLowerCase() === connectorFilter.toLowerCase()
        );
        if (!hasConnector) return false;
      }

      // Speed filter
      const power = station.peakPowerKw || station.peak_power_kw || 0;
      if (speedFilter === 'ultra' && power < 150) return false;
      if (speedFilter === 'fast' && (power < 50 || power >= 150)) return false;
      if (speedFilter === 'standard' && power > 22) return false;

      // Availability
      if (availabilityOnly && (station.availablePorts || station.available_ports || 0) <= 0) return false;

      // Price limit
      const price = station.pricePerKwh || station.price_per_kwh || 0;
      if (price > maxPrice) return false;

      // Vehicle compatibility filter
      if (filterVehicleCompatibleOnly && activeVehicle) {
        const isCompatible = station.connectors?.some(c => {
          const pType = c.type || c.plug_type;
          return activeVehicle.connectors.includes(pType);
        });
        if (!isCompatible) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'distance') return (a.distanceKm || 0) - (b.distanceKm || 0);
      if (sortBy === 'price') return (a.pricePerKwh || 0) - (b.pricePerKwh || 0);
      if (sortBy === 'speed') return (b.peakPowerKw || 0) - (a.peakPowerKw || 0);
      if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
      return 0;
    });
  }, [stations, searchQuery, connectorFilter, speedFilter, availabilityOnly, maxPrice, sortBy, filterVehicleCompatibleOnly, activeVehicle]);

  return (
    <StationContext.Provider
      value={{
        stations,
        filteredStations,
        loading,
        error,
        isBackendSynced,
        syncStatus,
        backendStationCount,
        refreshStations: loadStationsFromBackend,
        selectedStation,
        setSelectedStation,
        userLocation,
        setUserLocation,
        bookmarkedIds,
        toggleBookmark,
        searchQuery,
        setSearchQuery,
        connectorFilter,
        setConnectorFilter,
        speedFilter,
        setSpeedFilter,
        availabilityOnly,
        setAvailabilityOnly,
        maxPrice,
        setMaxPrice,
        sortBy,
        setSortBy,
        filterVehicleCompatibleOnly,
        setFilterVehicleCompatibleOnly
      }}
    >
      {children}
    </StationContext.Provider>
  );
}

export function useStations() {
  const context = useContext(StationContext);
  if (!context) {
    throw new Error('useStations must be used within a StationProvider');
  }
  return context;
}
