import React, { useState, useEffect, useRef } from 'react';
import { 
  Car, 
  BatteryCharging, 
  PlusCircle, 
  Zap, 
  Gauge, 
  ShieldCheck, 
  Cpu, 
  SlidersHorizontal,
  CheckCircle2,
  Info,
  Video,
  Image as ImageIcon
} from 'lucide-react';
import { useVehicle } from '../context/VehicleContext';
import { VehicleCard } from '../components/VehicleCard';
import { AddVehicleModal } from '../components/AddVehicleModal';
import { EditVehicleModal } from '../components/EditVehicleModal';

export function GaragePage({ setCurrentPage }) {
  const [garageMediaMode, setGarageMediaMode] = useState('image'); // 'image' | 'video'
  const garageVideoRef = useRef(/** @type {HTMLVideoElement | null} */ (null));
  const { 
    vehicles, 
    activeVehicle, 
    selectVehicle, 
    currentSoC, 
    updateSoC, 
    remainingKwh, 
    usableRangeKm, 
    energyNeededTo80,
    editVehicle,
    deleteVehicle
  } = useVehicle();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);

  useEffect(() => {
    if (garageMediaMode === 'video' && garageVideoRef.current) {
      const v = /** @type {HTMLVideoElement} */ (garageVideoRef.current);
      v.defaultMuted = true;
      v.muted = true;
      v.playsInline = true;
      const p = v.play();
      if (p !== undefined) {
        p.catch(() => {
          v.muted = true;
          v.play().catch(() => {});
        });
      }
    }
  }, [garageMediaMode]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12 font-sans text-white">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-white/[0.12]">
        <div>
          <div className="flex items-center space-x-2.5 text-xs font-mono text-[#A1A1AA] uppercase tracking-widest mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_6px_rgba(255,255,255,0.8)]"></span>
            <span>Vehicle Telemetry & BMS Management</span>
            <span className="text-[#71717A]">•</span>
            <span>{vehicles.length} Vehicles Calibrated</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            MY EV GARAGE
          </h1>
          <p className="text-[#A1A1AA] text-sm mt-1 max-w-2xl leading-relaxed">
            Select or register your electric vehicle profile. SmartChargeAI uses these parameters to calibrate charge duration curves, calculate session costs, and eliminate incompatible chargers.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="self-start md:self-auto flex items-center space-x-2 px-5 py-3 rounded-lg bg-white text-[#050507] font-bold hover:bg-zinc-200 transition-all shadow-md text-xs uppercase font-mono tracking-wider cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Add Custom EV</span>
        </button>
      </div>

      {/* Active Vehicle Spotlight Telemetry HUD */}
      <section className="bg-[#0B0B0E] border border-white/[0.12] rounded-xl p-6 sm:p-8 relative overflow-hidden shadow-2xl">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
          {/* Left: Active EV Info */}
          <div className="space-y-6 flex-1 w-full">
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 rounded text-xs font-mono bg-[#121216] text-white border border-white/[0.12] flex items-center space-x-2 font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_6px_rgba(255,255,255,0.8)]"></span>
                <span>Active EV Calibrated</span>
              </span>
              <span className="text-xs font-mono text-[#71717A]">
                Architecture: {activeVehicle.maxChargingSpeed >= 200 ? '800V High-Throughput' : '400V Standard'}
              </span>
            </div>

            <div>
              <span className="text-xs font-mono text-[#71717A] uppercase">{activeVehicle.year} Model Year</span>
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight mt-0.5">
                {activeVehicle.make} {activeVehicle.model}
              </h2>
              <div className="flex flex-wrap items-center gap-2 mt-2 text-xs font-mono text-[#A1A1AA]">
                <span>Pack: <strong className="text-white">{activeVehicle.batteryCapacity} kWh</strong></span>
                <span className="text-[#71717A]">•</span>
                <span>Max DC Rate: <strong className="text-white">{activeVehicle.maxChargingSpeed} kW</strong></span>
                <span className="text-[#71717A]">•</span>
                <span>Rated WLTP: <strong className="text-white">{activeVehicle.rangeKm} km</strong></span>
              </div>
            </div>

            {/* Live SoC Slider */}
            <div className="p-4 rounded-lg bg-[#050507] border border-white/[0.12] space-y-2">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-[#A1A1AA] flex items-center space-x-1.5">
                  <BatteryCharging className="w-4 h-4 text-white" />
                  <span>Interactive Route Calibration SoC:</span>
                </span>
                <span className="text-white text-sm font-black">{currentSoC}%</span>
              </div>
              <input
                type="range"
                min="5"
                max="100"
                value={currentSoC}
                onChange={(e) => updateSoC(Number(e.target.value))}
                className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-white"
              />
              <div className="flex justify-between text-[11px] font-mono text-[#71717A]">
                <span>Stored Energy: <strong className="text-white">{remainingKwh} kWh</strong></span>
                <span>Usable Range: <strong className="text-white">~{usableRangeKm} km</strong></span>
                <span>Deficit to 80%: <strong className="text-white">{energyNeededTo80} kWh</strong></span>
              </div>
            </div>

            {/* Compatible Plugs */}
            <div>
              <span className="text-xs font-mono text-[#71717A] uppercase block mb-2">Authorized Charging Sockets:</span>
              <div className="flex flex-wrap gap-2">
                {activeVehicle.connectors.map((c, i) => (
                  <span key={i} className="px-3 py-1 rounded text-xs font-mono font-bold bg-[#121216] text-white border border-white/[0.12]">
                    {c} Compatible
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Media Showcase (Chassis View) */}
          <div className="w-full lg:w-[420px] shrink-0 bg-[#050507] border border-white/[0.12] rounded-xl p-6 relative overflow-hidden flex flex-col items-center justify-center">
            {/* View Mode Toggle */}
            <div className="absolute top-3 right-3 z-10 flex items-center bg-[#121216] p-1 rounded-lg border border-white/[0.12]">
              <button
                onClick={() => setGarageMediaMode('image')}
                className={`px-2.5 py-1 rounded text-[10px] font-mono transition-all flex items-center space-x-1 ${
                  garageMediaMode === 'image' ? 'bg-white text-[#050507] font-bold' : 'text-[#71717A] hover:text-white'
                }`}
              >
                <ImageIcon className="w-3 h-3" />
                <span>Photo</span>
              </button>
              <button
                onClick={() => setGarageMediaMode('video')}
                className={`px-2.5 py-1 rounded text-[10px] font-mono transition-all flex items-center space-x-1 ${
                  garageMediaMode === 'video' ? 'bg-white text-[#050507] font-bold' : 'text-[#71717A] hover:text-white'
                }`}
              >
                <Video className="w-3 h-3" />
                <span>Cinematic</span>
              </button>
            </div>

            {garageMediaMode === 'video' ? (
              <video 
                ref={garageVideoRef}
                src="/assets/take3.mp4" 
                muted
                loop
                playsInline
                autoPlay
                className="w-full h-56 object-cover rounded-lg"
              />
            ) : (
              <img 
                src={activeVehicle.image || '/assets/batman_be6.png'} 
                alt={activeVehicle.model}
                className="w-full h-56 object-contain drop-shadow-[0_20px_40px_rgba(0,0,0,0.95)]"
                onError={(e) => {
                  (/** @type {HTMLImageElement} */ (e.currentTarget)).src = '/assets/batman_be6.png';
                }}
              />
            )}

            <div className="w-full pt-3 mt-3 border-t border-white/[0.08] flex items-center justify-between text-xs font-mono text-[#A1A1AA]">
              <span>Chassis: <strong className="text-white">{activeVehicle.color || 'Obsidian'}</strong></span>
              <button 
                onClick={() => setCurrentPage('discovery')}
                className="text-white hover:underline font-bold"
              >
                Find Compatible Plazas →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* All Calibrated Vehicles Grid */}
      <section className="space-y-6">
        <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
          <div>
            <h3 className="text-xl font-bold text-white tracking-tight">
              Calibrated Vehicle Fleet ({vehicles.length})
            </h3>
            <p className="text-xs text-[#A1A1AA] font-mono mt-0.5">
              Click 'Set Active EV' on any vehicle to immediately calibrate routing & discovery.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vehicles.map((v) => (
            <VehicleCard 
              key={v.id} 
              vehicle={v} 
              onEdit={(veh) => setEditingVehicle(veh)}
              onDelete={vehicles.length > 1 ? (id) => deleteVehicle(id) : undefined}
            />
          ))}
        </div>
      </section>

      {/* Add Custom Vehicle Modal */}
      <AddVehicleModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
      />

      {/* Edit Vehicle Modal */}
      {editingVehicle && (
        <EditVehicleModal 
          vehicle={editingVehicle}
          isOpen={!!editingVehicle}
          onClose={() => setEditingVehicle(null)}
          onSave={(updated) => {
            editVehicle(updated);
            setEditingVehicle(null);
          }}
        />
      )}
    </div>
  );
}
