import { useState } from 'react';
import { X, Car, PlusCircle } from 'lucide-react';
import { useVehicle } from '../context/VehicleContext';

/**
 * @param {{
 *   isOpen: boolean;
 *   onClose: () => void;
 * }} props
 */
export function AddVehicleModal({ isOpen, onClose }) {
  const { addCustomVehicle } = useVehicle();

  const [formData, setFormData] = useState({
    make: '',
    model: '',
    year: 2024,
    batteryCapacity: 60,
    currentSoC: 60,
    maxChargingSpeed: 120,
    acChargingSpeed: 11,
    rangeKm: 400,
    connectors: ['CCS2', 'Type 2'],
    color: 'Obsidian Black',
  });

  if (!isOpen) return null;

  const availableConnectors = ['CCS2', 'Type 2', 'CHAdeMO', 'GB/T', 'Tesla Supercharger'];

  const toggleConnector = (/** @type {string} */ connector) => {
    setFormData(prev => ({
      ...prev,
      connectors: prev.connectors.includes(connector)
        ? prev.connectors.filter(c => c !== connector)
        : [...prev.connectors, connector]
    }));
  };

  const handleSubmit = (/** @type {React.FormEvent} */ e) => {
    e.preventDefault();
    if (!formData.make || !formData.model) {
      alert('Please provide vehicle make and model');
      return;
    }
    if (formData.connectors.length === 0) {
      alert('Please select at least one compatible connector');
      return;
    }

    addCustomVehicle({
      ...formData,
      batteryCapacity: Number(formData.batteryCapacity),
      currentSoC: Number(formData.currentSoC),
      maxChargingSpeed: Number(formData.maxChargingSpeed),
      acChargingSpeed: Number(formData.acChargingSpeed),
      rangeKm: Number(formData.rangeKm),
      efficiencyWhKm: Math.round((Number(formData.batteryCapacity) * 1000) / Number(formData.rangeKm))
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div
        className="relative w-full max-w-xl bg-[#0B0B0E] border border-white/[0.12] rounded-xl shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-white/[0.08] flex items-center justify-between bg-[#0B0B0E]">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-[#121216] border border-white/[0.12] flex items-center justify-center text-white">
              <Car className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Add Custom Electric Vehicle</h2>
              <p className="text-xs text-[#A1A1AA] font-mono">Configure vehicle battery specs for tailored AI routing</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-[#121216] border border-white/[0.12] text-[#A1A1AA] hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 font-mono text-xs">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-[#A1A1AA] mb-1">Make / Manufacturer</label>
              <input
                type="text"
                placeholder="e.g. Porsche, Audi, Hyundai"
                value={formData.make}
                onChange={e => setFormData({ ...formData, make: e.target.value })}
                required
                className="w-full bg-[#050507] border border-white/[0.12] rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-white font-sans"
              />
            </div>

            <div>
              <label className="block text-xs text-[#A1A1AA] mb-1">Model Name</label>
              <input
                type="text"
                placeholder="e.g. Taycan, Ioniq 5, e-tron"
                value={formData.model}
                onChange={e => setFormData({ ...formData, model: e.target.value })}
                required
                className="w-full bg-[#050507] border border-white/[0.12] rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-white font-sans"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] text-[#A1A1AA] mb-1">Pack (kWh)</label>
              <input
                type="number"
                min="10"
                max="250"
                value={formData.batteryCapacity}
                onChange={e => setFormData({ ...formData, batteryCapacity: Number(e.target.value) })}
                required
                className="w-full bg-[#050507] border border-white/[0.12] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-white"
              />
            </div>

            <div>
              <label className="block text-[11px] text-[#A1A1AA] mb-1">Max DC (kW)</label>
              <input
                type="number"
                min="20"
                max="350"
                value={formData.maxChargingSpeed}
                onChange={e => setFormData({ ...formData, maxChargingSpeed: Number(e.target.value) })}
                required
                className="w-full bg-[#050507] border border-white/[0.12] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-white"
              />
            </div>

            <div>
              <label className="block text-[11px] text-[#A1A1AA] mb-1">Range (km)</label>
              <input
                type="number"
                min="50"
                max="1000"
                value={formData.rangeKm}
                onChange={e => setFormData({ ...formData, rangeKm: Number(e.target.value) })}
                required
                className="w-full bg-[#050507] border border-white/[0.12] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-[#A1A1AA] mb-2">Compatible Charging Plugs</label>
            <div className="flex flex-wrap gap-2">
              {availableConnectors.map(c => (
                <button
                  type="button"
                  key={c}
                  onClick={() => toggleConnector(c)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all border ${
                    formData.connectors.includes(c)
                      ? 'bg-white text-[#050507] border-white font-bold'
                      : 'bg-[#121216] border-white/[0.12] text-[#A1A1AA] hover:text-white'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2">
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs text-[#A1A1AA]">Current Battery Simulation (%):</label>
              <span className="text-xs font-mono text-white font-bold">{formData.currentSoC}%</span>
            </div>
            <input
              type="range"
              min="5"
              max="100"
              value={formData.currentSoC}
              onChange={e => setFormData({ ...formData, currentSoC: Number(e.target.value) })}
              className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-white"
            />
          </div>

          <div className="pt-4 border-t border-white/[0.08] flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-[#121216] border border-white/[0.12] text-xs font-mono text-[#A1A1AA] hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center space-x-2 px-5 py-2.5 rounded-lg bg-white text-[#050507] font-bold hover:bg-zinc-200 transition-all text-xs font-mono uppercase tracking-wider shadow-md cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Register Vehicle</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
