import React, { useState } from 'react';
import { X, Car, BatteryCharging, Zap, PlusCircle } from 'lucide-react';
import { useVehicle } from '../context/VehicleContext';

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
    color: 'Stealth Cyan',
  });

  if (!isOpen) return null;

  const availableConnectors = ['CCS2', 'Type 2', 'CHAdeMO', 'GB/T', 'Tesla Supercharger'];

  const toggleConnector = (connector) => {
    setFormData(prev => ({
      ...prev,
      connectors: prev.connectors.includes(connector)
        ? prev.connectors.filter(c => c !== connector)
        : [...prev.connectors, connector]
    }));
  };

  const handleSubmit = (e) => {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark-950/80 backdrop-blur-md overflow-y-auto">
      <div
        className="relative w-full max-w-xl bg-dark-900 border border-brand-cyan/30 rounded-3xl shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-1.5 w-full bg-gradient-to-r from-brand-cyan to-brand-blue"></div>

        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-brand-cyan/10 border border-brand-cyan/20 flex items-center justify-center text-brand-cyan">
              <Car className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Add Custom Electric Vehicle</h2>
              <p className="text-xs text-slate-400">Configure vehicle battery specs for tailored AI recommendations</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">Make / Manufacturer</label>
              <input
                type="text"
                placeholder="e.g. Kia, Volvo, Rivian"
                value={formData.make}
                onChange={e => setFormData({ ...formData, make: e.target.value })}
                required
                className="w-full bg-dark-950 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-brand-cyan font-sans"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">Model Name</label>
              <input
                type="text"
                placeholder="e.g. EV6 GT-Line"
                value={formData.model}
                onChange={e => setFormData({ ...formData, model: e.target.value })}
                required
                className="w-full bg-dark-950 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-brand-cyan font-sans"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">Battery (kWh)</label>
              <input
                type="number"
                min="10"
                max="250"
                value={formData.batteryCapacity}
                onChange={e => setFormData({ ...formData, batteryCapacity: e.target.value })}
                required
                className="w-full bg-dark-950 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-cyan font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">Max DC (kW)</label>
              <input
                type="number"
                min="20"
                max="500"
                value={formData.maxChargingSpeed}
                onChange={e => setFormData({ ...formData, maxChargingSpeed: e.target.value })}
                required
                className="w-full bg-dark-950 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-cyan font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">Range (km)</label>
              <input
                type="number"
                min="50"
                max="1000"
                value={formData.rangeKm}
                onChange={e => setFormData({ ...formData, rangeKm: e.target.value })}
                required
                className="w-full bg-dark-950 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-cyan font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-400 mb-2">Compatible Plug Connectors</label>
            <div className="flex flex-wrap gap-2">
              {availableConnectors.map(c => {
                const checked = formData.connectors.includes(c);
                return (
                  <button
                    type="button"
                    key={c}
                    onClick={() => toggleConnector(c)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium border transition-all ${checked
                        ? 'bg-brand-cyan/20 border-brand-cyan text-brand-cyan shadow-[0_0_12px_rgba(0,240,255,0.2)]'
                        : 'bg-dark-950 border-white/10 text-slate-400 hover:text-white'
                      }`}
                  >
                    {checked ? '✓ ' : '+ '} {c}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-mono text-slate-400">Initial Battery Charge Level (SoC %)</label>
              <span className="text-xs font-mono text-brand-cyan font-bold">{formData.currentSoC}%</span>
            </div>
            <input
              type="range"
              min="5"
              max="100"
              value={formData.currentSoC}
              onChange={e => setFormData({ ...formData, currentSoC: Number(e.target.value) })}
              className="w-full h-2 bg-dark-950 rounded-lg appearance-none cursor-pointer accent-brand-cyan"
            />
          </div>

          <div className="pt-4 border-t border-white/10 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-brand-cyan text-dark-950 font-bold hover:bg-brand-cyan/90 transition-all shadow-cyan-glow text-xs"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Save & Set Active Vehicle</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

