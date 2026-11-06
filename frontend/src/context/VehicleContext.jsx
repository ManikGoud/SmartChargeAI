import React, { createContext, useContext, useState, useEffect } from 'react';
import { SAMPLE_VEHICLES } from '../data/sampleData';
import { fetchVehicles, createCustomVehicle } from '../services/api';

const VehicleContext = createContext(null);

const LOCAL_STORAGE_KEY_VEHICLE = 'smartcharge_active_vehicle';
const LOCAL_STORAGE_KEY_GARAGE = 'smartcharge_user_garage';

export function VehicleProvider({ children }) {
  const [vehicles, setVehicles] = useState(SAMPLE_VEHICLES);
  const [loading, setLoading] = useState(true);

  // Load active vehicle
  const [activeVehicle, setActiveVehicle] = useState(() => {
    try {
      const savedId = localStorage.getItem(LOCAL_STORAGE_KEY_VEHICLE);
      if (savedId) {
        const found = SAMPLE_VEHICLES.find(v => v.id === savedId);
        if (found) return found;
      }
    } catch (e) {
      console.warn('Failed to parse active vehicle', e);
    }
    return SAMPLE_VEHICLES[0];
  });

  // Battery State of Charge (SoC) %
  const [currentSoC, setCurrentSoC] = useState(() => activeVehicle.defaultSoC || activeVehicle.currentSoC || 42);

  // Sync vehicles from backend
  const syncVehicles = async () => {
    setLoading(true);
    const res = await fetchVehicles();
    if (res.success && Array.isArray(res.data) && res.data.length > 0) {
      setVehicles(res.data);
      // If current active vehicle matches one from backend, keep it synced
      const currentActiveId = localStorage.getItem(LOCAL_STORAGE_KEY_VEHICLE) || activeVehicle.id;
      const matched = res.data.find(v => v.id === currentActiveId);
      if (matched) {
        setActiveVehicle(matched);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    syncVehicles();
  }, []);

  // Sync active vehicle to localStorage
  useEffect(() => {
    if (activeVehicle) {
      localStorage.setItem(LOCAL_STORAGE_KEY_VEHICLE, activeVehicle.id);
    }
  }, [activeVehicle]);

  const selectVehicle = (vehicleId) => {
    const found = vehicles.find(v => v.id === vehicleId);
    if (found) {
      setActiveVehicle(found);
      setCurrentSoC(found.defaultSoC || found.currentSoC || 50);
    }
  };

  const updateSoC = (newSoC) => {
    const clamped = Math.max(5, Math.min(100, Number(newSoC)));
    setCurrentSoC(clamped);
  };

  const addCustomVehicle = async (customData) => {
    const payload = {
      make: customData.make || 'Custom',
      model: customData.model || 'Electric Vehicle',
      year: Number(customData.year) || 2024,
      batteryCapacity: Number(customData.batteryCapacity) || 60,
      defaultSoC: Number(customData.currentSoC) || 50,
      connectors: customData.connectors || ['CCS2'],
      maxChargingSpeed: Number(customData.maxChargingSpeed) || 120,
      acChargingSpeed: Number(customData.acChargingSpeed) || 11,
      rangeKm: Number(customData.rangeKm) || 400,
      efficiencyWhKm: Number(customData.efficiencyWhKm) || 150,
      image: customData.image || '/assets/batman_be6.png',
      color: customData.color || 'Stealth Obsidian',
      isCustom: true
    };

    // Attempt backend save first
    const res = await createCustomVehicle(payload);
    let newVehicle;
    if (res.success && res.data) {
      newVehicle = res.data;
    } else {
      newVehicle = { ...payload, id: `custom-${Date.now()}` };
    }

    setVehicles(prev => [newVehicle, ...prev]);
    setActiveVehicle(newVehicle);
    setCurrentSoC(newVehicle.defaultSoC || newVehicle.currentSoC || 50);
    return newVehicle;
  };

  const editVehicle = (vehicleId, updatedData) => {
    setVehicles(prev => prev.map(v => {
      if (v.id === vehicleId) {
        const merged = { ...v, ...updatedData };
        if (activeVehicle?.id === vehicleId) {
          setActiveVehicle(merged);
        }
        return merged;
      }
      return v;
    }));
  };

  const deleteVehicle = (vehicleId) => {
    setVehicles(prev => {
      const filtered = prev.filter(v => v.id !== vehicleId);
      if (activeVehicle?.id === vehicleId && filtered.length > 0) {
        setActiveVehicle(filtered[0]);
        setCurrentSoC(filtered[0].defaultSoC || filtered[0].currentSoC || 50);
        localStorage.setItem(LOCAL_STORAGE_KEY_VEHICLE, filtered[0].id);
      }
      return filtered;
    });
  };

  // Computations
  const cap = activeVehicle.batteryCapacity || activeVehicle.battery_capacity || 70;
  const range = activeVehicle.rangeKm || activeVehicle.range_km || 400;

  const remainingKwh = ((cap * currentSoC) / 100).toFixed(1);
  const usableRangeKm = Math.round((range * currentSoC) / 100);
  const energyNeededTo80 = Math.max(0, ((cap * Math.max(0, 80 - currentSoC)) / 100)).toFixed(1);

  return (
    <VehicleContext.Provider
      value={{
        vehicles,
        activeVehicle,
        currentSoC,
        selectVehicle,
        updateSoC,
        addCustomVehicle,
        editVehicle,
        deleteVehicle,
        remainingKwh,
        usableRangeKm,
        energyNeededTo80,
        syncVehicles,
        loading
      }}
    >
      {children}
    </VehicleContext.Provider>
  );
}

export function useVehicle() {
  const context = useContext(VehicleContext);
  if (!context) {
    throw new Error('useVehicle must be used within a VehicleProvider');
  }
  return context;
}
