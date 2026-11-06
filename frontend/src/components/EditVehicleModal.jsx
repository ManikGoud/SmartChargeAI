import { useState, useEffect } from 'react';
import { X, Car, Save } from 'lucide-react';
import { useVehicle } from '../context/VehicleContext';

/**
 * @param {{
 *   isOpen: boolean;
 *   onClose: () => void;
 *   vehicle: any;
 * }} props
 */
export function EditVehicleModal({ isOpen, onClose, vehicle }) {
  const { editVehicle } = useVehicle();

  const [formData, setFormData] = useState({
    make: '',
    model: '',
    year: 2024,
    batteryCapacity: 60,
    maxChargingSpeed: 120,
    acChargingSpeed: 11,
    rangeKm: 400,
    connectors: ['CCS2'],
    color: 'Stealth Obsidian',
  });

  useEffect(() => {
    if (vehicle) {
      setFormData({
        make: vehicle.make || '',
        model: vehicle.model || '',
        year: vehicle.year || 2024,
        batteryCapacity: vehicle.batteryCapacity || 60,
        maxChargingSpeed: vehicle.maxChargingSpeed || 120,
        acChargingSpeed: vehicle.acChargingSpeed || 11,
        rangeKm: vehicle.rangeKm || 400,
        connectors: vehicle.connectors || ['CCS2'],
        color: vehicle.color || 'Stealth Obsidian',
      });
    }
  }, [vehicle]);

  if (!isOpen || !vehicle) return null;

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

    editVehicle(vehicle.id, {
      ...formData,
      batteryCapacity: Number(formData.batteryCapacity),
      maxChargingSpeed: Number(formData.maxChargingSpeed),
      acChargingSpeed: Number(formData.acChargingSpeed),
      rangeKm: Number(formData.rangeKm),
      efficiencyWhKm: Math.round((Number(formData.batteryCapacity) * 1000) / Number(formData.rangeKm))
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-lg bg-[#0B0B0E] rounded-xl p-6 sm:p-8 my-8 border border-white/[0.12] shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.08] mb-6">
          <div className="flex items-center space-x-2">
            <Car className="w-5 h-5 text-white" />
            <h3 className="text-xl font-bold text-white tracking-tight">Edit Vehicle Specs</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#71717A] hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 font-mono text-xs">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-[#A1A1AA] mb-1">Make / Brand</label>
              <input
                type="text"
                value={formData.make}
                onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                required
                className="w-full px-3 py-2 rounded-lg bg-[#050507] border border-white/[0.12] text-white text-sm focus:border-white focus:outline-none font-sans"
              />
            </div>
            <div>
              <label className="block text-xs text-[#A1A1AA] mb-1">Model Name</label>
              <input
                type="text"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                required
                className="w-full px-3 py-2 rounded-lg bg-[#050507] border border-white/[0.12] text-white text-sm focus:border-white focus:outline-none font-sans"
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
                onChange={(e) => setFormData({ ...formData, batteryCapacity: Number(e.target.value) })}
                required
                className="w-full px-3 py-2 rounded-lg bg-[#050507] border border-white/[0.12] text-white text-sm focus:border-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] text-[#A1A1AA] mb-1">Max DC (kW)</label>
              <input
                type="number"
                min="10"
                max="350"
                value={formData.maxChargingSpeed}
                onChange={(e) => setFormData({ ...formData, maxChargingSpeed: Number(e.target.value) })}
                required
                className="w-full px-3 py-2 rounded-lg bg-[#050507] border border-white/[0.12] text-white text-sm focus:border-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] text-[#A1A1AA] mb-1">Range (km)</label>
              <input
                type="number"
                min="50"
                max="1000"
                value={formData.rangeKm}
                onChange={(e) => setFormData({ ...formData, rangeKm: Number(e.target.value) })}
                required
                className="w-full px-3 py-2 rounded-lg bg-[#050507] border border-white/[0.12] text-white text-sm focus:border-white focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-[#A1A1AA] mb-1">Year</label>
              <input
                type="number"
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-lg bg-[#050507] border border-white/[0.12] text-white text-sm focus:border-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-[#A1A1AA] mb-1">Color / Finish</label>
              <input
                type="text"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-[#050507] border border-white/[0.12] text-white text-sm focus:border-white focus:outline-none font-sans"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-[#A1A1AA] mb-2">Compatible Connectors</label>
            <div className="flex flex-wrap gap-2">
              {availableConnectors.map((c) => {
                const isSelected = formData.connectors.includes(c);
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => toggleConnector(c)}
                    className={`px-3 py-1 rounded-lg text-xs font-mono transition-all border ${
                      isSelected 
                        ? 'bg-white text-[#050507] border-white font-bold' 
                        : 'bg-[#121216] border-white/[0.12] text-[#A1A1AA] hover:text-white'
                    }`}
                  >
                    {c}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-white/[0.08]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-[#121216] border border-white/[0.12] text-xs font-mono text-[#A1A1AA] hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center space-x-2 px-5 py-2.5 rounded-lg bg-white text-[#050507] font-bold font-mono text-xs uppercase tracking-wider hover:bg-zinc-200 transition-all shadow-md cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Save Vehicle</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
