import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Automatic JWT Bearer Token Injection
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('smartcharge_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

export const checkBackendHealth = async () => {
  try {
    const res = await apiClient.get('/api/health');
    return { success: true, data: res.data };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Unable to connect to SmartChargeAI Backend',
    };
  }
};

export const fetchStations = async (filters = {}) => {
  try {
    const params = {};
    if (filters.search) params.search = filters.search;
    if (filters.city) params.city = filters.city;
    if (filters.speed_tier && filters.speed_tier !== 'All') params.speed_tier = filters.speed_tier;
    if (filters.connector && filters.connector !== 'All') params.connector = filters.connector;
    if (filters.available_only) params.available_only = true;
    if (filters.max_price) params.max_price = filters.max_price;

    const res = await apiClient.get('/api/stations', { params });
    return { success: true, data: res.data };
  } catch (error) {
    console.warn('Backend /api/stations error, using fallback:', error.message);
    return { success: false, error: error.message };
  }
};

export const fetchStationById = async (id) => {
  try {
    const res = await apiClient.get(`/api/stations/${id}`);
    return { success: true, data: res.data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const fetchStationLiveStatus = async (id) => {
  try {
    const res = await apiClient.get(`/api/stations/${id}/live-status`);
    return { success: true, data: res.data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const fetchVehicles = async () => {
  try {
    const res = await apiClient.get('/api/vehicles');
    return { success: true, data: res.data };
  } catch (error) {
    console.warn('Backend /api/vehicles error, using fallback:', error.message);
    return { success: false, error: error.message };
  }
};

export const createCustomVehicle = async (vehicleData) => {
  try {
    const res = await apiClient.post('/api/vehicles', vehicleData);
    return { success: true, data: res.data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const calculateChargingCost = async (calcData) => {
  try {
    const res = await apiClient.post('/api/calculate-cost', calcData);
    return { success: true, data: res.data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getStationRecommendations = async (recData) => {
  try {
    const res = await apiClient.post('/api/recommendations', recData);
    return { success: true, data: res.data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const fetchRecentSessions = async () => {
  try {
    const res = await apiClient.get('/api/sessions');
    return { success: true, data: res.data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};


export const logChargingSession = async (sessionData) => {
  try {
    const res = await apiClient.post('/api/sessions', sessionData);
    return { success: true, data: res.data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const fetchNearbyStations = async (lat, lng, radiusKm = 25, filters = {}) => {
  try {
    const params = { lat, lng, radius_km: radiusKm, ...filters };
    const res = await apiClient.get('/api/stations/nearby', { params });
    return { success: true, data: res.data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const fetchFavoriteIds = async () => {
  try {
    const res = await apiClient.get('/api/favorites');
    return { success: true, data: res.data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const addFavoriteStation = async (stationId) => {
  try {
    const res = await apiClient.post(`/api/favorites/${stationId}`);
    return { success: true, data: res.data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const removeFavoriteStation = async (stationId) => {
  try {
    const res = await apiClient.delete(`/api/favorites/${stationId}`);
    return { success: true, data: res.data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const fetchSavedTrips = async () => {
  try {
    const res = await apiClient.get('/api/trips');
    return { success: true, data: res.data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const planTrip = async (planData) => {
  try {
    const res = await apiClient.post('/api/trips/plan', planData);
    return { success: true, data: res.data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const saveTrip = async (tripData) => {
  try {
    const res = await apiClient.post('/api/trips', tripData);
    return { success: true, data: res.data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const deleteSavedTrip = async (tripId) => {
  try {
    const res = await apiClient.delete(`/api/trips/${tripId}`);
    return { success: true, data: res.data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};


export const sendChatMessage = async (chatPayload) => {
  try {
    const res = await apiClient.post('/api/chat', chatPayload);
    return { success: true, data: res.data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// ==========================================
// 3-Module RBAC Authentication API Services
// ==========================================

export const loginUser = async ({ user_id, password, role }) => {
  try {
    const res = await apiClient.post('/api/auth/login', {
      user_id: user_id.trim().toUpperCase(),
      password,
      role,
    });
    return { success: true, data: res.data };
  } catch (error) {
    const msg = error.response?.data?.detail || error.message || 'Login failed';
    return { success: false, error: msg };
  }
};

export const googleLoginUser = async (googlePayload = {}) => {
  try {
    const res = await apiClient.post('/api/auth/google', {
      demo_mode: true,
      google_name: googlePayload.name || 'Rahul Sharma (Google EV)',
      google_email: googlePayload.email || 'rahul.ev@gmail.com',
      id_token: googlePayload.id_token || null,
    });
    return { success: true, data: res.data };
  } catch (error) {
    const msg = error.response?.data?.detail || error.message || 'Google authentication failed';
    return { success: false, error: msg };
  }
};

export const fetchCurrentUser = async () => {
  try {
    const res = await apiClient.get('/api/auth/me');
    return { success: true, data: res.data };
  } catch (error) {
    return { success: false, error: error.response?.data?.detail || error.message };
  }
};

export const fetchDemoAccounts = async () => {
  try {
    const res = await apiClient.get('/api/auth/demo-accounts');
    return { success: true, data: res.data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// ==========================================
// Station Owner API Services
// ==========================================

export const fetchOwnerStations = async () => {
  try {
    const res = await apiClient.get('/api/owner/stations');
    return { success: true, data: res.data };
  } catch (error) {
    return { success: false, error: error.response?.data?.detail || error.message };
  }
};

export const updateOwnerTariff = async (stationId, pricePerKwh, pricingNote) => {
  try {
    const res = await apiClient.put(`/api/owner/stations/${stationId}/tariff`, {
      station_id: stationId,
      price_per_kwh: parseFloat(pricePerKwh),
      pricing_note: pricingNote,
    });
    return { success: true, data: res.data };
  } catch (error) {
    return { success: false, error: error.response?.data?.detail || error.message };
  }
};

export const updateOwnerPortStatus = async (stationId, plugType, available) => {
  try {
    const res = await apiClient.put(`/api/owner/stations/${stationId}/ports`, {
      station_id: stationId,
      plug_type: plugType,
      available: parseInt(available, 10),
    });
    return { success: true, data: res.data };
  } catch (error) {
    return { success: false, error: error.response?.data?.detail || error.message };
  }
};

export const fetchOwnerAnalytics = async () => {
  try {
    const res = await apiClient.get('/api/owner/analytics');
    return { success: true, data: res.data };
  } catch (error) {
    return { success: false, error: error.response?.data?.detail || error.message };
  }
};

// ==========================================
// Platform Administrator API Services
// ==========================================

export const fetchAdminMetrics = async () => {
  try {
    const res = await apiClient.get('/api/admin/metrics');
    return { success: true, data: res.data };
  } catch (error) {
    return { success: false, error: error.response?.data?.detail || error.message };
  }
};

export const fetchAdminUsers = async () => {
  try {
    const res = await apiClient.get('/api/admin/users');
    return { success: true, data: res.data };
  } catch (error) {
    return { success: false, error: error.response?.data?.detail || error.message };
  }
};

export const fetchAdminAuditLogs = async (limit = 50) => {
  try {
    const res = await apiClient.get('/api/admin/audit-logs', { params: { limit } });
    return { success: true, data: res.data };
  } catch (error) {
    return { success: false, error: error.response?.data?.detail || error.message };
  }
};

export const overrideStationStatus = async (stationId, status) => {
  try {
    const res = await apiClient.post(`/api/admin/stations/${stationId}/override`, {
      station_id: stationId,
      status,
    });
    return { success: true, data: res.data };
  } catch (error) {
    return { success: false, error: error.response?.data?.detail || error.message };
  }
};
