import React, { useState } from 'react';
import {
  Search,
  MapPin,
  Filter,
  SlidersHorizontal,
  Car,
  Zap,
  List,
  Map as MapIcon,
  Columns,
  Check,
  RefreshCw,
  X,
  Compass,
  ArrowRight
} from 'lucide-react';
import { useStations } from '../context/StationContext';
import { useVehicle } from '../context/VehicleContext';
import { StationCard } from '../components/StationCard';
import { StationDetailModal } from '../components/StationDetailModal';
import { StationMapView } from '../components/StationMapView';
import { NavigationModal } from '../components/NavigationModal';

export function DiscoveryPage({ setCurrentPage }) {
  const {
    filteredStations,
    selectedStation,
    setSelectedStation,
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
    setFilterVehicleCompatibleOnly,
    loading,
    error,
    syncStatus,
    backendStationCount,
    refreshStations
  } = useStations();

  const { activeVehicle } = useVehicle();

  // Layout mode: 'split' (cards + map), 'grid' (cards only), 'map' (map only)
  const [layoutMode, setLayoutMode] = useState('split');
  const [navigatingStation, setNavigatingStation] = useState(null);

  const connectorOptions = ['All', 'CCS2', 'Type 2', 'CHAdeMO'];
  const speedOptions = [
    { id: 'All', label: 'All Speeds' },
    { id: 'ultra', label: '150-350 kW (HPC)' },
    { id: 'fast', label: '50-120 kW (Fast DC)' },
    { id: 'standard', label: '7-22 kW (AC)' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 font-sans text-white">
      {/* A. EDITORIAL HEADING */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-white/[0.12]">
        <div>
          <div className="flex items-center space-x-2 text-xs font-mono text-[#A1A1AA] uppercase tracking-widest mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_6px_rgba(255,255,255,0.8)]"></span>
            <span>Infrastructure Directory</span>
            <span className="text-[#71717A]">•</span>
            <span>Telangana & Highway Corridors</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            FIND YOUR NEXT CHARGING DESTINATION
          </h1>
          <p className="text-[#A1A1AA] text-sm mt-1 max-w-2xl leading-relaxed">
            Discover compatible charging infrastructure around your route. Calibrated against your {activeVehicle.make} {activeVehicle.model} ({activeVehicle.maxChargingSpeed} kW intake).
          </p>
        </div>

        {/* View Layout Mode Switch (Split / List / Map) */}
        <div className="flex items-center bg-[#0B0B0E] p-1 rounded-xl border border-white/[0.12] shrink-0">
          <button
            onClick={() => setLayoutMode('split')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all flex items-center space-x-1.5 ${
              layoutMode === 'split' 
                ? 'bg-white text-[#050507] font-bold shadow-sm' 
                : 'text-[#A1A1AA] hover:text-white'
            }`}
            title="Split Map & List"
          >
            <Columns className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Split</span>
          </button>
          <button
            onClick={() => setLayoutMode('grid')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all flex items-center space-x-1.5 ${
              layoutMode === 'grid' 
                ? 'bg-white text-[#050507] font-bold shadow-sm' 
                : 'text-[#A1A1AA] hover:text-white'
            }`}
            title="Grid List Only"
          >
            <List className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">List</span>
          </button>
          <button
            onClick={() => setLayoutMode('map')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all flex items-center space-x-1.5 ${
              layoutMode === 'map' 
                ? 'bg-white text-[#050507] font-bold shadow-sm' 
                : 'text-[#A1A1AA] hover:text-white'
            }`}
            title="Fullscreen Map Only"
          >
            <MapIcon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Map</span>
          </button>
        </div>
      </div>

      {/* B. SEARCH & FILTER DOCK */}
      <div className="bg-[#0B0B0E] rounded-xl p-5 sm:p-6 border border-white/[0.12] shadow-2xl space-y-4">
        {/* Search Bar Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-[#71717A]" />
          <input
            type="text"
            placeholder="Search by plaza name, corridor, district, or operator (e.g. Gachibowli, ORR, Statiq, Jio-bp, 150kW)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#050507] border border-white/[0.12] rounded-lg pl-11 pr-10 py-3 text-sm text-white placeholder-[#71717A] focus:outline-none focus:border-white transition-colors font-mono"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#71717A] hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Pills & Checkboxes Row */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-white/[0.08] text-xs font-mono">
          {/* Speed & Plug Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[#71717A] text-[11px] uppercase mr-1">Speed:</span>
            {speedOptions.map(opt => (
              <button
                key={opt.id}
                onClick={() => setSpeedFilter(opt.id)}
                className={`px-3 py-1 rounded-lg text-xs transition-all ${
                  speedFilter === opt.id
                    ? 'bg-white text-[#050507] font-bold'
                    : 'bg-[#121216] text-[#A1A1AA] border border-white/[0.12] hover:text-white hover:border-white/30'
                }`}
              >
                {opt.label}
              </button>
            ))}

            <span className="text-[#71717A] text-[11px] uppercase ml-2 mr-1">Connector:</span>
            {connectorOptions.map(c => (
              <button
                key={c}
                onClick={() => setConnectorFilter(c)}
                className={`px-2.5 py-1 rounded-lg text-xs transition-all ${
                  connectorFilter === c
                    ? 'bg-white text-[#050507] font-bold'
                    : 'bg-[#121216] text-[#A1A1AA] border border-white/[0.12] hover:text-white hover:border-white/30'
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          {/* Toggles & Sort Menu */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Vehicle Compatible Toggle */}
            <label className="flex items-center space-x-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={filterVehicleCompatibleOnly}
                onChange={e => setFilterVehicleCompatibleOnly(e.target.checked)}
                className="w-4 h-4 rounded bg-[#050507] border-white/20 accent-white"
              />
              <span className={`text-xs ${filterVehicleCompatibleOnly ? 'text-white font-bold' : 'text-[#A1A1AA]'}`}>
                {activeVehicle.make} Compatible
              </span>
            </label>

            {/* Available Only Toggle */}
            <label className="flex items-center space-x-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={availabilityOnly}
                onChange={e => setAvailabilityOnly(e.target.checked)}
                className="w-4 h-4 rounded bg-[#050507] border-white/20 accent-white"
              />
              <span className={`text-xs ${availabilityOnly ? 'text-white font-bold' : 'text-[#A1A1AA]'}`}>
                Available Ports Only
              </span>
            </label>

            {/* Sort Select */}
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="bg-[#121216] text-white border border-white/[0.12] rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-white cursor-pointer font-mono"
            >
              <option value="distance">Sort: Nearest Distance</option>
              <option value="price">Sort: Lowest Tariff</option>
              <option value="speed">Sort: Highest Power (kW)</option>
              <option value="rating">Sort: Highest Rated</option>
            </select>
          </div>
        </div>
      </div>

      {/* C. BACKEND SYNC STATUS NOTICE (Monochrome Precision Banner) */}
      {syncStatus === 'syncing' && (
        <div className="p-3 rounded-lg bg-[#0B0B0E] border border-white/[0.12] text-xs font-mono text-[#A1A1AA] flex items-center space-x-2">
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
          <span>Connecting to SmartChargeAI FastAPI Backend (127.0.0.1:8000)...</span>
        </div>
      )}

      {syncStatus === 'synced' && (
        <div className="p-3 rounded-lg bg-[#0B0B0E] border border-white/[0.12] text-xs font-mono text-[#A1A1AA] flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_6px_rgba(255,255,255,0.8)]"></span>
            <span>Live SQLite Database Synced: <strong className="text-white">{backendStationCount} stations</strong> loaded from FastAPI backend.</span>
          </div>
          <button
            onClick={() => refreshStations && refreshStations()}
            className="text-xs text-[#A1A1AA] hover:text-white underline ml-2 cursor-pointer font-mono"
          >
            Re-sync
          </button>
        </div>
      )}

      {syncStatus === 'offline' && (
        <div className="p-3 rounded-lg bg-[#0B0B0E] border border-white/[0.12] text-xs font-mono text-[#A1A1AA] flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-500"></span>
            <span>Backend Notice: Local verified station data active ({error || '127.0.0.1:8000 offline'})</span>
          </div>
          <button
            onClick={() => refreshStations && refreshStations()}
            className="text-white hover:underline ml-2 cursor-pointer font-mono font-bold"
          >
            Retry Sync
          </button>
        </div>
      )}

      {/* Results Header Count */}
      <div className="flex items-center justify-between text-xs font-mono text-[#A1A1AA] px-1">
        <span>Found <strong className="text-white font-bold">{filteredStations.length}</strong> charging plazas matching criteria</span>
        <span className="text-[#71717A] hidden sm:inline">Active EV: {activeVehicle.make} {activeVehicle.model} ({activeVehicle.connectors.join(', ')})</span>
      </div>

      {/* D. STATION DISCOVERY VIEW (Split, Grid, or Fullscreen Map) */}
      <div>
        {loading ? (
          /* Loading Skeletons */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-[#0B0B0E] border border-white/[0.12] p-6 rounded-xl animate-pulse space-y-4">
                <div className="h-4 bg-white/10 rounded w-1/3"></div>
                <div className="h-6 bg-white/10 rounded w-3/4"></div>
                <div className="h-16 bg-white/5 rounded"></div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Split Mode: Cards on Left, Map on Right */}
            {layoutMode === 'split' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Station Cards List */}
                <div className="lg:col-span-6 space-y-4 max-h-[780px] overflow-y-auto pr-1">
                  {filteredStations.length === 0 ? (
                    <div className="bg-[#0B0B0E] border border-white/[0.12] rounded-xl p-8 text-center space-y-3">
                      <Zap className="w-8 h-8 text-[#71717A] mx-auto" />
                      <h4 className="text-base font-bold text-white">No stations match current filters</h4>
                      <p className="text-xs text-[#A1A1AA]">Broaden your speed, connector, or availability criteria.</p>
                      <button
                        onClick={() => {
                          setConnectorFilter('All');
                          setSpeedFilter('All');
                          setAvailabilityOnly(false);
                          setFilterVehicleCompatibleOnly(false);
                          setSearchQuery('');
                        }}
                        className="px-4 py-2 rounded-lg bg-white text-[#050507] hover:bg-zinc-200 text-xs font-mono font-bold uppercase transition-all"
                      >
                        Reset All Filters
                      </button>
                    </div>
                  ) : (
                    filteredStations.map(station => (
                      <StationCard
                        key={station.id}
                        station={station}
                        isSelected={selectedStation?.id === station.id}
                        onSelect={(s) => setSelectedStation(s)}
                        onNavigate={(s) => setNavigatingStation(s)}
                      />
                    ))
                  )}
                </div>

                {/* Interactive Map (Leaflet Dark / Google Maps Demo) */}
                <div className="lg:col-span-6 sticky top-24 h-[780px] rounded-xl overflow-hidden border border-white/[0.12]">
                  <StationMapView
                    stations={filteredStations}
                    selectedStation={selectedStation}
                    onSelectStation={(s) => setSelectedStation(s)}
                    onNavigate={(s) => setNavigatingStation(s)}
                  />
                </div>
              </div>
            )}

            {/* Grid Mode: Cards Only */}
            {layoutMode === 'grid' && (
              filteredStations.length === 0 ? (
                <div className="bg-[#0B0B0E] border border-white/[0.12] rounded-xl p-8 text-center space-y-3">
                  <Zap className="w-8 h-8 text-[#71717A] mx-auto" />
                  <h4 className="text-base font-bold text-white">No stations match current filters</h4>
                  <p className="text-xs text-[#A1A1AA]">Broaden your speed, connector, or availability criteria.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredStations.map(station => (
                    <StationCard
                      key={station.id}
                      station={station}
                      isSelected={selectedStation?.id === station.id}
                      onSelect={(s) => setSelectedStation(s)}
                      onNavigate={(s) => setNavigatingStation(s)}
                    />
                  ))}
                </div>
              )
            )}

            {/* Map Mode: Fullscreen Map */}
            {layoutMode === 'map' && (
              <div className="w-full h-[750px] rounded-xl overflow-hidden border border-white/[0.12]">
                <StationMapView
                  stations={filteredStations}
                  selectedStation={selectedStation}
                  onSelectStation={(s) => setSelectedStation(s)}
                  onNavigate={(s) => setNavigatingStation(s)}
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* Station Details Drawer/Modal (Preserved) */}
      {selectedStation && (
        <StationDetailModal
          station={selectedStation}
          onClose={() => setSelectedStation(null)}
          onOpenCalculator={() => {}}
          onNavigate={(s) => setNavigatingStation(s)}
        />
      )}

      {/* In-App Live Navigation Modal (Preserved) */}
      {navigatingStation && (
        <NavigationModal
          station={navigatingStation}
          onClose={() => setNavigatingStation(null)}
        />
      )}
    </div>
  );
}
