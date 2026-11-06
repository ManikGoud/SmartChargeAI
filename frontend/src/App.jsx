import React, { useState, useEffect, useCallback } from 'react';
import { VehicleProvider } from './context/VehicleContext';
import { StationProvider } from './context/StationContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { CustomerLayout } from './layouts/CustomerLayout';
import { OwnerLayout } from './layouts/OwnerLayout';
import { AdminLayout } from './layouts/AdminLayout';
import { checkBackendHealth } from './services/api';

function AppRouter() {
  const { user, role, isAuthenticated, loading } = useAuth();
  
  // Initialize route from browser URL bar pathname
  const [currentPath, setCurrentPath] = useState(() => {
    if (typeof window !== 'undefined' && window.location.pathname && window.location.pathname !== '/') {
      return window.location.pathname;
    }
    return '/login';
  });

  const [backendOnline, setBackendOnline] = useState(false);

  // Soft backend health polling
  useEffect(() => {
    let isMounted = true;
    async function verify() {
      const res = await checkBackendHealth();
      if (isMounted) setBackendOnline(res.success);
    }
    verify();
    const interval = setInterval(verify, 15000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Listen to browser Back/Forward navigation
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname || '/login');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Navigation function that updates state and browser URL bar
  const navigate = useCallback((path) => {
    if (typeof window !== 'undefined' && window.location.pathname !== path) {
      window.history.pushState({}, '', path);
    }
    setCurrentPath(path);
  }, []);

  // Route Protection & Role Guard Enforcement
  useEffect(() => {
    if (loading) return; // Wait until initial localStorage token read completes

    if (!isAuthenticated) {
      // Unauthenticated visitor must strictly see the login page
      if (currentPath !== '/login') {
        navigate('/login');
      }
      return;
    }

    // Authenticated user checks
    if (role === 'customer') {
      // Customer cannot access owner or admin routes
      if (!currentPath.startsWith('/customer/')) {
        navigate('/customer/home');
      }
    } else if (role === 'station_owner') {
      // Station Owner cannot access customer or admin routes
      if (!currentPath.startsWith('/owner/')) {
        navigate('/owner/dashboard');
      }
    } else if (role === 'admin') {
      // Admin cannot access non-admin routes unless explicitly allowed
      if (!currentPath.startsWith('/admin/')) {
        navigate('/admin/dashboard');
      }
    }
  }, [isAuthenticated, role, currentPath, loading, navigate]);

  // Loading spinner during initial auth check
  if (loading) {
    return (
      <div className="min-h-screen bg-[#070A10] flex items-center justify-center text-slate-400 font-mono text-xs">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
          <span>Initializing SmartChargeAI Platform...</span>
        </div>
      </div>
    );
  }

  // REQUIREMENT 1: If unauthenticated, the first page MUST be the SmartChargeAI Login Page
  if (!isAuthenticated || currentPath === '/login') {
    return <LoginPage onNavigate={navigate} />;
  }

  // REQUIREMENT 2 & 3: Role-Specific Isolated Module Layouts
  if (role === 'customer') {
    return <CustomerLayout currentPath={currentPath} onNavigate={navigate} />;
  }

  if (role === 'station_owner') {
    return <OwnerLayout currentPath={currentPath} onNavigate={navigate} />;
  }

  if (role === 'admin') {
    return <AdminLayout currentPath={currentPath} onNavigate={navigate} />;
  }

  // Fallback to login
  return <LoginPage onNavigate={navigate} />;
}

export default function App() {
  return (
    <AuthProvider>
      <VehicleProvider>
        <StationProvider>
          <AppRouter />
        </StationProvider>
      </VehicleProvider>
    </AuthProvider>
  );
}
