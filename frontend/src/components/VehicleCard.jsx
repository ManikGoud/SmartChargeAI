import React from 'react';
import { 
  Car, 
  BatteryCharging, 
  Zap, 
  Gauge, 
  Check, 
  Edit3, 
  Trash2, 
  Cpu, 
  SlidersHorizontal 
} from 'lucide-react';
import { useVehicle } from '../context/VehicleContext';

export function VehicleCard({ vehicle, onEdit, onDelete }) {
  const { activeVehicle, selectVehicle, currentSoC, updateSoC } = useVehicle();
  const isActive = activeVehicle?.id === vehicle.id;

  // Use currentSoC if this card is active, else default to vehicle stored value
  const soc = isActive ? currentSoC : (vehicle.currentSoC || 80);
  const usableRange = Math.round((vehicle.rangeKm * soc) / 100);
  const remainingKwh = Math.round((vehicle.batteryCapacity * soc) / 100);

  return (
    <div 
      className={`rounded-xl p-6 transition-all duration-200 relative group flex flex-col justify-between border ${
        isActive 
          ? 'bg-[#121216] border-white shadow-2xl' 
          : 'bg-[#0B0B0E] border-white/[0.12] hover:border-white/30 hover:bg-[#101014]'
      }`}
    >
      {/* Active Vehicle Badge Top-Right */}
      {isActive && (
        <div className="absolute top-0 right-0 bg-white text-[#050507] px-3.5 py-1 rounded-bl-xl text-[10px] font-mono font-extrabold uppercase tracking-widest flex items-center space-x-1 shadow-md">
          <Check className="w-3 h-3 stroke-[3]" />
          <span>Active EV</span>
        </div>
      )}

      <div>
        {/* Header: Year & Brand */}
        <div className="flex items-center space-x-2 text-xs font-mono text-[#A1A1AA] mb-1">
          <span>{vehicle.year} Model Year</span>
          <span className="text-[#71717A]">•</span>
          <span>{vehicle.color || 'Monochrome'}</span>
        </div>

        {/* Vehicle Name */}
        <h3 className="text-xl font-bold text-white tracking-tight mb-4">
          {vehicle.make} {vehicle.model}
        </h3>

        {/* Vehicle Image */}
        <div className="w-full h-40 bg-[#050507] border border-white/[0.12] rounded-lg p-3 flex items-center justify-center overflow-hidden mb-6 relative">
          <img 
            src={vehicle.image || '/assets/batman_be6.png'} 
            alt={vehicle.model}
            className="w-full h-full object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.9)] transition-transform duration-500 group-hover:scale-105"
            onError={(e) => {
              (/** @type {HTMLImageElement} */ (e.currentTarget)).src = '/assets/batman_be6.png';
            }}
          />
          <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/80 text-[10px] font-mono text-[#A1A1AA] border border-white/[0.12]">
            {vehicle.batteryCapacity} kWh
          </div>
        </div>

        {/* Core Specs Grid */}
        <div className="grid grid-cols-2 gap-2 text-xs font-mono mb-6">
          <div className="p-3 rounded-lg bg-[#050507] border border-white/[0.12]">
            <span className="text-[10px] text-[#71717A] block uppercase">Battery Capacity</span>
            <span className="text-white font-bold">{vehicle.batteryCapacity} kWh</span>
          </div>

          <div className="p-3 rounded-lg bg-[#050507] border border-white/[0.12]">
            <span className="text-[10px] text-[#71717A] block uppercase">Max Fast Charge</span>
            <span className="text-white font-bold">{vehicle.maxChargingSpeed} <span className="text-[10px] font-normal text-[#A1A1AA]">kW</span></span>
          </div>

          <div className="p-3 rounded-lg bg-[#050507] border border-white/[0.12]">
            <span className="text-[10px] text-[#71717A] block uppercase">WLTP Range</span>
            <span className="text-white font-bold">{vehicle.rangeKm} <span className="text-[10px] font-normal text-[#A1A1AA]">km</span></span>
          </div>

          <div className="p-3 rounded-lg bg-[#050507] border border-white/[0.12]">
            <span className="text-[10px] text-[#71717A] block uppercase">Architecture</span>
            <span className="text-white font-bold">{vehicle.maxChargingSpeed >= 200 ? '800V' : '400V'}</span>
          </div>
        </div>

        {/* Connectors Supported */}
        <div className="mb-6">
          <span className="text-[10px] font-mono text-[#71717A] uppercase block mb-1.5">Compatible Connectors:</span>
          <div className="flex flex-wrap gap-1.5">
            {vehicle.connectors?.map((conn, idx) => (
              <span key={idx} className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#050507] text-[#A1A1AA] border border-white/[0.12]">
                {conn}
              </span>
            ))}
          </div>
        </div>

        {/* Active SoC Slider (Interactive only for active vehicle) */}
        <div className="p-3.5 rounded-lg bg-[#050507] border border-white/[0.12] space-y-2 mb-6">
          <div className="flex justify-between items-center text-xs font-mono">
            <span className="text-[#A1A1AA] flex items-center space-x-1.5">
              <BatteryCharging className="w-3.5 h-3.5 text-white" />
              <span>Simulated Charge:</span>
            </span>
            <span className="font-bold text-white">{soc}% ({remainingKwh} kWh)</span>
          </div>
          
          <input
            type="range"
            min="5"
            max="100"
            value={soc}
            disabled={!isActive}
            onChange={(e) => updateSoC(Number(e.target.value))}
            className={`w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-white ${
              isActive ? 'bg-zinc-800' : 'bg-zinc-900 opacity-50 cursor-not-allowed'
            }`}
          />
          <div className="flex justify-between text-[10px] font-mono text-[#71717A]">
            <span>Usable Range:</span>
            <span className="text-white font-bold">~{usableRange} km</span>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex items-center space-x-2 pt-4 border-t border-white/[0.08]">
        {/* Set Active Button */}
        <button
          onClick={() => selectVehicle(vehicle.id)}
          disabled={isActive}
          className={`flex-1 py-2.5 rounded-lg font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center space-x-1.5 transition-all ${
            isActive 
              ? 'bg-[#050507] text-[#71717A] border border-white/[0.08] cursor-default' 
              : 'bg-white text-[#050507] hover:bg-zinc-200 cursor-pointer shadow-sm'
          }`}
        >
          {isActive ? (
            <>
              <Check className="w-3.5 h-3.5" />
              <span>Current Profile</span>
            </>
          ) : (
            <span>Set Active EV</span>
          )}
        </button>

        {/* Edit Button */}
        <button
          onClick={() => onEdit && onEdit(vehicle)}
          className="p-2.5 rounded-lg bg-[#050507] border border-white/[0.12] text-[#A1A1AA] hover:text-white hover:border-white/30 transition-all cursor-pointer"
          title="Edit Vehicle Specs"
        >
          <Edit3 className="w-3.5 h-3.5" />
        </button>

        {/* Delete Button (if not the only vehicle) */}
        {onDelete && (
          <button
            onClick={() => onDelete(vehicle.id)}
            className="p-2.5 rounded-lg bg-[#050507] border border-white/[0.12] text-[#71717A] hover:text-white hover:border-white/30 transition-all cursor-pointer"
            title="Delete Vehicle"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
