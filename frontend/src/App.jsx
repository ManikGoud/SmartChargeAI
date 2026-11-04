import React, { useState, useEffect } from 'react';
import { VehicleProvider } from './context/VehicleContext';
import { StationProvider, useStations } from './context/StationContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { HomePage } from './pages/HomePage';
import { DiscoveryPage } from './pages/DiscoveryPage';
import { GaragePage } from './pages/GaragePage';
import { DashboardPage } from './pages/DashboardPage';
import { TripPlannerPage } from './pages/TripPlannerPage';
import { CostComparisonPage } from './pages/CostComparisonPage';
import { AssistantPage } from './pages/AssistantPage';
import { checkBackendHealth } from './services/api';

function AppContent() {
  const [currentPage, setCurrentPage] = useState('home');
  const [backendOnline, setBackendOnline] = useState(false);
  const { setSearchQuery } = useStations();

  // Test backend connectivity on mount and keep polling softly
  useEffect(() => {
    let isMounted = true;
    async function verify() {
      const res = await checkBackendHealth();
      if (isMounted) {
        setBackendOnline(res.success);
      }
    }
    verify();
    const interval = setInterval(verify, 15000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleHomeSearch = (query) => {
    setSearchQuery(query);
    setCurrentPage('discovery');
  };

  return (
    <div className="min-h-screen bg-dark-950 text-slate-100 flex flex-col justify-between selection:bg-brand-cyan/20 selection:text-brand-cyan">
      {/* Ambient background light orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-brand-cyan/10 rounded-full blur-[128px]"></div>
        <div className="absolute top-1/3 -right-40 w-96 h-96 bg-brand-blue/10 rounded-full blur-[140px]"></div>
      </div>

      {/* Persistent Responsive Navbar */}
      <Navbar 
        currentPage={currentPage} 
        setCurrentPage={setCurrentPage} 
        backendOnline={backendOnline} 
      />

      {/* Active Page View */}
      <main className="flex-1 w-full">
        {currentPage === 'home' && (
          <HomePage 
            setCurrentPage={setCurrentPage} 
            onSearch={handleHomeSearch} 
          />
        )}
        {currentPage === 'discovery' && (
          <DiscoveryPage 
            setCurrentPage={setCurrentPage} 
          />
        )}
        {currentPage === 'garage' && (
          <GaragePage 
            setCurrentPage={setCurrentPage} 
          />
        )}
        {currentPage === 'dashboard' && (
          <DashboardPage 
            setCurrentPage={setCurrentPage} 
          />
        )}
        {currentPage === 'trips' && (
          <TripPlannerPage 
            setCurrentPage={setCurrentPage} 
          />
        )}
        {currentPage === 'comparison' && (
          <CostComparisonPage 
            setCurrentPage={setCurrentPage} 
          />
        )}
        {currentPage === 'assistant' && (
          <AssistantPage 
            setCurrentPage={setCurrentPage} 
          />
        )}
      </main>

      {/* Persistent Global Footer */}
      <Footer setCurrentPage={setCurrentPage} />
    </div>
  );
}

export default function App() {
  return (
    <VehicleProvider>
      <StationProvider>
        <AppContent />
      </StationProvider>
    </VehicleProvider>
  );
}
