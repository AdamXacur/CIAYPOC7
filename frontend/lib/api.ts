import axios from 'axios';
import { toast } from "sonner";

// --- TÉCNICA DE HARDCODING ---
// 1. Intenta leer la variable de entorno (definida en .env.local para tu PC)
// 2. Si no existe (en el servidor a veces pasa), usa la URL de producción "a fuego".
const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.xac.lat/api";

console.log(`[CRAC-API] Conectando a: ${API_URL}`);

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('auth_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
            console.warn("Sesión expirada. Redirigiendo al login...");
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user_role');
            document.cookie = "auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
            window.location.href = '/login?reason=expired';
      }
    }
    return Promise.reject(error);
  }
);

// --- Servicios ---
export const authService = {
  login: async (credentials: any) => {
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

export const requestService = {
  create: async (data: any) => {
    const response = await api.post('/requests', data);
    return response.data;
  },
  getAll: async (params: any) => {
    const response = await api.get('/requests', { params });
    return response.data;
  },
  getByFolioPublic: async (folio: string) => {
    const response = await api.get(`/public/requests/${folio}`);
    return response.data;
  },
  updateStatus: async (id: string, data: any) => {
    const response = await api.put(`/requests/${id}/status`, data);
    return response.data;
  },
  importCsv: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/requests/import-csv', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },
  getTopicCounts: async () => {
    const response = await api.get('/requests/stats/topics');
    return response.data;
  }
};

export const aiService = {
    getProgress: async () => {
        const response = await api.get('/ai/progress');
        return response.data;
    },
    triggerBatch: async (force: boolean = false) => {
        const response = await api.post('/ai/trigger-batch', null, {
            params: { force_reanalysis: force }
        });
        return response.data;
    },
    analyzeBatch: async (limit: number = 50, force: boolean = false) => {
        return aiService.triggerBatch(force);
    }
};

export const statsService = {
  getDashboard: async (params?: any) => {
    const response = await api.get('/stats/dashboard', { params });
    return response.data;
  },
  getTrends: async () => {
    const response = await api.get('/stats/trends');
    return response.data;
  }
};

export const dependencyService = {
    getAll: async () => {
        const response = await api.get('/dependencies');
        return response.data;
    },
    create: async (data: any) => {
        const response = await api.post('/dependencies', data);
        return response.data;
    },
    delete: async (id: string) => {
        await api.delete(`/dependencies/${id}`);
    }
};

export const govActionService = {
    getAll: async () => {
        try {
            const response = await api.get('/gov-actions');
            return response.data;
        } catch (e) { return []; }
    },
    create: async (data: any) => {
        const response = await api.post('/gov-actions', data);
        return response.data;
    }
};

export const reportService = {
    downloadCsv: async () => {
        const response = await api.get('/reports/export/csv', { responseType: 'blob' });
        return response.data;
    }
};

export const chatService = {
  createSession: async () => {
    const response = await api.post('/chat/sessions');
    return response.data;
  },
  listSessions: async () => {
    const response = await api.get('/chat/sessions');
    return response.data;
  },
  getSessionMessages: async (sessionId: string) => {
    const response = await api.get(`/chat/sessions/${sessionId}/messages`);
    return response.data;
  },
  deleteSession: async (sessionId: string) => {
    const response = await api.delete(`/chat/sessions/${sessionId}`);
    return response.data;
  }
};

export const ingestionService = {
  uploadManual: async (file: File, tenantId: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('tenant_id', tenantId);
    const response = await api.post(`/ingestion/upload-manual`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },
  listDocuments: async () => {
    const response = await api.get('/ingestion/documents');
    return response.data;
  },
  deleteDocument: async (filename: string) => {
    const response = await api.delete(`/ingestion/documents/${filename}`);
    return response.data;
  }
};

export const userService = {
    getAll: async (params?: any) => {
        const response = await api.get('/users', { params });
        return response.data;
    },
    create: async (data: any) => {
        const response = await api.post('/users', data);
        return response.data;
    },
    update: async (id: string, data: any) => {
        const response = await api.put(`/users/${id}`, data);
        return response.data;
    },
    delete: async (id: string) => {
        await api.delete(`/users/${id}`);
    }
};