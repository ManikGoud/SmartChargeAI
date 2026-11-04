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
  X
} from 'lucide-react';
import { useStations } from '../context/StationContext';
import { useVehicle } from '../context/VehicleContext';
import { StationCard } from '../components/StationCard';
import { StationDetailModal } from '../components/StationDetailModal';
import { LeafletMap } from '../components/LeafletMap';
import { Badge, DemoDataBadge } from '../components/Badge';

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
    refreshStations
  } = useStations();

  const { activeVehicle } = useVehicle();

  // Layout mode: 'split' (cards + map), 'grid' (cards only), 'map' (map only)
  const [layoutMode, setLayoutMode] = useState('split');
  const [showFiltersModal, setShowFiltersModal] = useState(false);

  const connectorOptions = ['All', 'CCS2', 'Type 2', 'CHAdeMO'];
  const speedOptions = [
    { id: 'All', label: 'All Speeds' },
    { id: 'ultra', label: '150-350 kW (Ultra-Fast)' },
    { id: 'fast', label: '50-120 kW (Fast DC)' },
    { id: 'standard', label: '7-22 kW (AC)' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Search & Filter Bar */}
      <div className="glass-panel rounded-3xl p-4 sm:p-6 space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search station name, address, or network (e.g. Jio-bp, Statiq, MG Road)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-dark-950 border border-white/10 rounded-2xl pl-11 pr-10 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-cyan transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Active EV pill & Layout Toggles */}
          <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
            {/* View layout mode switch */}
            <div className="flex items-center bg-dark-950 p-1 rounded-xl border border-white/10">
              <button
                onClick={() => setLayoutMode('split')}
                className={`p-2 rounded-lg text-xs font-mono transition-colors flex items-center space-x-1 ${
                  layoutMode === 'split' ? 'bg-brand-cyan/20 text-brand-cyan font-bold' : 'text-slate-400 hover:text-white'
                }`}
                title="Split Map & List"
              >
                <Columns className="w-4 h-4" />
                <span className="hidden sm:inline">Split</span>
              </button>
              <button
                onClick={() => setLayoutMode('grid')}
                className={`p-2 rounded-lg text-xs font-mono transition-colors flex items-center space-x-1 ${
                  layoutMode === 'grid' ? 'bg-brand-cyan/20 text-brand-cyan font-bold' : 'text-slate-400 hover:text-white'
                }`}
                title="Grid List Only"
              >
                <List className="w-4 h-4" />
                <span className="hidden sm:inline">List</span>
              </button>
              <button
                onClick={() => setLayoutMode('map')}
                className={`p-2 rounded-lg text-xs font-mono transition-colors flex items-center space-x-1 ${
                  layoutMode === 'map' ? 'bg-brand-cyan/20 text-brand-cyan font-bold' : 'text-slate-400 hover:text-white'
                }`}
                title="Fullscreen Map Only"
              >
                <MapIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Map</span>
              </button>
            </div>

            <DemoDataBadge />
          </div>
        </div>

        {/* Filter Pills Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/5 text-xs font-mono">
          <div className="flex flex-wrap items-center gap-2">
            {/* Speed Pills */}
            <span className="text-slate-500 mr-1 text-[11px]">POWER:</span>
            {speedOptions.map(opt => (
              <button
                key={opt.id}
                onClick={() => setSpeedFilter(opt.id)}
                className={`px-3 py-1 rounded-xl text-xs transition-all ${
                  speedFilter === opt.id 
                    ? 'bg-brand-cyan/20 text-brand-cyan border border-brand-cyan/40 font-bold' 
                    : 'bg-dark-950 text-slate-400 border border-white/5 hover:text-white'
                }`}
              >
                {opt.label}
              </button>
            ))}

            {/* Connector Dropdown / Pills */}
            <span className="text-slate-500 ml-2 mr-1 text-[11px]">PLUG:</span>
            {connectorOptions.map(c => (
              <button
                key={c}
                onClick={() => setConnectorFilter(c)}
                className={`px-2.5 py-1 rounded-xl text-xs transition-all ${
                  connectorFilter === c 
                    ? 'bg-brand-blue/20 text-brand-blue border border-brand-blue/40 font-bold' 
                    : 'bg-dark-950 text-slate-400 border border-white/5 hover:text-white'
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            {/* Vehicle Compatible Toggle */}
            <label className="flex items-center space-x-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={filterVehicleCompatibleOnly}
                onChange={e => setFilterVehicleCompatibleOnly(e.target.checked)}
                className="w-4 h-4 rounded bg-dark-950 border-white/20 accent-brand-cyan"
              />
              <span className={`text-xs ${filterVehicleCompatibleOnly ? 'text-brand-cyan font-bold' : 'text-slate-400'}`}>
                {activeVehicle.make} Compatible Only
              </span>
            </label>

            {/* Available Only Toggle */}
            <label className="flex items-center space-x-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={availabilityOnly}
                onChange={e => setAvailabilityOnly(e.target.checked)}
                className="w-4 h-4 rounded bg-dark-950 border-white/20 accent-emerald-400"
              />
              <span className={`text-xs ${availabilityOnly ? 'text-emerald-400 font-bold' : 'text-slate-400'}`}>
                Idle Ports Only
              </span>
            </label>

            {/* Sort Select */}
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="bg-dark-950 text-slate-300 border border-white/10 rounded-xl px-2.5 py-1 text-xs focus:outline-none focus:border-brand-cyan"
            >
              <option value="distance">Sort: Nearest Distance</option>
              <option value="price">Sort: Lowest Price</option>
              <option value="speed">Sort: Highest Power (kW)</option>
              <option value="rating">Sort: Highest Rated</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main View Area */}
      <div>
        {/* Error Notification Banner if any */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs font-mono text-amber-300 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              <span>Backend sync notice: Showing local verified station data ({error})</span>
            </div>
            <button
              onClick={() => refreshStations && refreshStations()}
              className="text-brand-cyan hover:underline ml-2"
            >
              Retry Sync
            </button>
          </div>
        )}

        {/* Results Count bar */}
        <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-4 px-1">
          <span>Found <strong className="text-white">{filteredStations.length}</strong> charging stations matching criteria</span>
          <span className="text-slate-500">Target EV: {activeVehicle.make} {activeVehicle.model} ({activeVehicle.connectors.join(', ')})</span>
        </div>

        {/* Loading Skeleton */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="glass-panel p-6 rounded-2xl animate-pulse space-y-4">
                <div className="h-4 bg-white/10 rounded w-1/3"></div>
                <div className="h-6 bg-white/10 rounded w-3/4"></div>
                <div className="h-16 bg-white/5 rounded"></div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {layoutMode === 'split' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left Column: Station Cards List */}
                <div className="lg:col-span-6 space-y-4 max-h-[780px] overflow-y-auto pr-1">
                  {filteredStations.length === 0 ? (
                    <div className="glass-panel rounded-2xl p-8 text-center space-y-3">
                      <Zap className="w-8 h-8 text-slate-600 mx-auto" />
                      <h4 className="text-base font-bold text-white">No stations match current filters</h4>
                      <p className="text-xs text-slate-400">Try broadening your speed, price, or connector criteria.</p>
                      <button
                        onClick={() => {
                          setConnectorFilter('All');
                          setSpeedFilter('All');
                          setAvailabilityOnly(false);
                          setFilterVehicleCompatibleOnly(false);
                          setSearchQuery('');
                        }}
                        className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-brand-cyan hover:bg-brand-cyan/10"
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
                      />
                    ))
                  )}
                </div>

                {/* Right Column: Interactive Leaflet Map */}
                <div className="lg:col-span-6 sticky top-24 h-[780px]">
                  <LeafletMap
                    stations={filteredStations}
                    selectedStation={selectedStation}
                    onSelectStation={(s) => setSelectedStation(s)}
                  />
                </div>
              </div>
            )}

            {layoutMode === 'grid' && (
              filteredStations.length === 0 ? (
                <div className="glass-panel rounded-2xl p-8 text-center space-y-3">
                  <Zap className="w-8 h-8 text-slate-600 mx-auto" />
                  <h4 className="text-base font-bold text-white">No stations match current filters</h4>
                  <p className="text-xs text-slate-400">Try broadening your speed, price, or connector criteria.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredStations.map(station => (
                    <StationCard
                      key={station.id}
                      station={station}
                      isSelected={selectedStation?.id === station.id}
                      onSelect={(s) => setSelectedStation(s)}
                    />
                  ))}
                </div>
              )
            )}

            {layoutMode === 'map' && (
              <div className="w-full h-[750px]">
                <LeafletMap
                  stations={filteredStations}
                  selectedStation={selectedStation}
                  onSelectStation={(s) => setSelectedStation(s)}
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* Station Details Drawer/Modal */}
      {selectedStation && (
        <StationDetailModal
          station={selectedStation}
          onClose={() => setSelectedStation(null)}
        />
      )}
    </div>
  );
}

