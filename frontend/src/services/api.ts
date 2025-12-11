import axios from 'axios';

// La URL base viene de las variables de entorno (Vite)
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para inyectar el Token automáticamente
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para manejar errores (ej: Token expirado)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Si el token no sirve, cerrar sesión
      localStorage.removeItem('auth_token');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

// --- Servicios de Autenticación ---
export const authService = {
  loginOfficial: async (credentials: any) => {
    const params = new URLSearchParams();
    params.append('username', credentials.email);
    params.append('password', credentials.password);
    params.append('grant_type', 'password');
    
    const response = await api.post('/auth/token', params, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
    return response.data;
  },
  
  registerCitizen: async (data: any) => {
    const response = await api.post('/auth/citizen/register', data);
    return response.data;
  }
};

// --- Servicios de Solicitudes ---
export const requestService = {
  create: async (data: any) => {
    const response = await api.post('/requests', data);
    return response.data;
  },
  
  getAll: async () => {
    const response = await api.get('/requests');
    return response.data;
  },
  
  getByFolioPublic: async (folio: string) => {
    const response = await api.get(`/public/requests/${folio}`);
    return response.data;
  }
};

// --- Servicios de Analítica ---
export const statsService = {
  getDashboard: async () => {
    const response = await api.get('/stats/dashboard');
    return response.data;
  },
  
  getTrends: async () => {
    const response = await api.get('/stats/trends');
    return response.data;
  }
};