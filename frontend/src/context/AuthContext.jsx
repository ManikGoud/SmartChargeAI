import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  loginUser, 
  googleLoginUser, 
  fetchCurrentUser 
} from '../services/api';

/**
 * @typedef {{
 *   id: string;
 *   user_id: string;
 *   full_name: string;
 *   role: 'customer' | 'station_owner' | 'admin';
 *   auth_provider: string;
 *   assigned_stations: string[];
 *   email?: string;
 *   phone?: string;
 *   created_at?: string;
 * }} UserProfile
 *
 * @typedef {{
 *   user: UserProfile | null;
 *   token: string | null;
 *   role: 'guest' | 'customer' | 'station_owner' | 'admin';
 *   isAuthenticated: boolean;
 *   loading: boolean;
 *   loginModalOpen: boolean;
 *   setLoginModalOpen: (open: boolean) => void;
 *   loginTab: 'customer' | 'station_owner' | 'admin';
 *   setLoginTab: (tab: 'customer' | 'station_owner' | 'admin') => void;
 *   openLoginModal: (tab?: 'customer' | 'station_owner' | 'admin') => void;
 *   closeLoginModal: () => void;
 *   login: (userId: string, password: string, role: string) => Promise<{ success: boolean; error?: string; user?: UserProfile }>;
 *   loginWithGoogle: (payload?: any) => Promise<{ success: boolean; error?: string; user?: UserProfile }>;
 *   logout: () => void;
 * }} AuthContextType
 */

const AuthContext = createContext(/** @type {AuthContextType | null} */ (null));

export function AuthProvider({ children }) {
  const [user, setUser] = useState(/** @type {UserProfile | null} */ (null));
  const [token, setToken] = useState(/** @type {string | null} */ (null));
  const [loading, setLoading] = useState(true);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [loginTab, setLoginTab] = useState(/** @type {'customer' | 'station_owner' | 'admin'} */ ('customer'));

  // Initialize from localStorage on mount
  useEffect(() => {
    let isMounted = true;

    async function initAuth() {
      const storedToken = localStorage.getItem('smartcharge_token');
      const storedUser = localStorage.getItem('smartcharge_user');

      if (storedToken && storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          if (isMounted) {
            setToken(storedToken);
            setUser(parsedUser);
          }
          // Validate token with backend /api/auth/me
          const meRes = await fetchCurrentUser();
          if (meRes.success && isMounted) {
            setUser(meRes.data);
            localStorage.setItem('smartcharge_user', JSON.stringify(meRes.data));
          } else if (!meRes.success && isMounted) {
            // Token expired or invalid
            localStorage.removeItem('smartcharge_token');
            localStorage.removeItem('smartcharge_user');
            setUser(null);
            setToken(null);
          }
        } catch {
          if (isMounted) {
            localStorage.removeItem('smartcharge_token');
            localStorage.removeItem('smartcharge_user');
            setUser(null);
            setToken(null);
          }
        }
      }

      if (isMounted) {
        setLoading(false);
      }
    }

    initAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  const openLoginModal = (tab = 'customer') => {
    setLoginTab(tab);
    setLoginModalOpen(true);
  };

  const closeLoginModal = () => {
    setLoginModalOpen(false);
  };

  const login = async (userId, password, role) => {
    setLoading(true);
    const res = await loginUser({ user_id: userId, password, role });
    setLoading(false);

    if (res.success && res.data) {
      const accessToken = res.data.access_token;
      const userProfile = res.data.user;
      localStorage.setItem('smartcharge_token', accessToken);
      localStorage.setItem('smartcharge_user', JSON.stringify(userProfile));
      setToken(accessToken);
      setUser(userProfile);
      setLoginModalOpen(false);
      return { success: true, user: userProfile };
    }

    return { success: false, error: res.error || 'Authentication failed' };
  };

  const loginWithGoogle = async (payload = {}) => {
    setLoading(true);
    const res = await googleLoginUser(payload);
    setLoading(false);

    if (res.success && res.data) {
      const accessToken = res.data.access_token;
      const userProfile = res.data.user;
      localStorage.setItem('smartcharge_token', accessToken);
      localStorage.setItem('smartcharge_user', JSON.stringify(userProfile));
      setToken(accessToken);
      setUser(userProfile);
      setLoginModalOpen(false);
      return { success: true, user: userProfile };
    }

    return { success: false, error: res.error || 'Google authentication failed' };
  };

  const logout = () => {
    localStorage.removeItem('smartcharge_token');
    localStorage.removeItem('smartcharge_user');
    setUser(null);
    setToken(null);
  };

  const role = user ? user.role : 'guest';
  const isAuthenticated = !!user && !!token;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        role,
        isAuthenticated,
        loading,
        loginModalOpen,
        setLoginModalOpen,
        loginTab,
        setLoginTab,
        openLoginModal,
        closeLoginModal,
        login,
        loginWithGoogle,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

