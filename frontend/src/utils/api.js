import axios from 'axios';

// Production URLs - Update these with your actual Render URLs
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
const FASTAPI_BASE_URL = import.meta.env.VITE_FASTAPI_URL || 'http://localhost:8001/api';

console.log('[API Config] Django API URL:', API_BASE_URL);
console.log('[API Config] FastAPI URL:', FASTAPI_BASE_URL);
console.log('[API Config] Environment:', import.meta.env.MODE);

// Create axios instances
const djangoAPI = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 second timeout
});

const fastapiAPI = axios.create({
  baseURL: FASTAPI_BASE_URL,
  timeout: 120000, // 2 minute timeout for AI processing
});

// Intercept requests to add JWT token
djangoAPI.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    // List of public endpoints that don't need tokens
    const publicEndpoints = ['/signup/', '/login/', '/health/'];
    const isPublicEndpoint = publicEndpoints.some(endpoint => config.url?.includes(endpoint));
    
    if (token && !isPublicEndpoint) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('[API] 🔐 Token added to request:', config.url);
    } else if (!isPublicEndpoint) {
      console.warn('[API] ⚠️ No token found in localStorage for:', config.url);
    }
    return config;
  },
  (error) => {
    console.error('[API] Request error:', error);
    return Promise.reject(error);
  }
);

fastapiAPI.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('[API] 🔐 Token added to FastAPI request:', config.url);
    } else {
      console.warn('[API] ⚠️ No token found in localStorage for FastAPI:', config.url);
    }
    return config;
  },
  (error) => {
    console.error('[API] FastAPI request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptors for error handling
djangoAPI.interceptors.response.use(
  (response) => {
    console.log('[API] ✅ Response received:', response.config.url, response.status);
    return response;
  },
  (error) => {
    console.error('[API] ❌ Response error:', error.response?.status, error.config?.url);
    if (error.response?.status === 401) {
      console.error('[API] 🔴 401 Unauthorized - Clearing tokens');
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      // Only redirect if not already on login page
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

fastapiAPI.interceptors.response.use(
  (response) => {
    console.log('[API] ✅ FastAPI response received:', response.config.url, response.status);
    return response;
  },
  (error) => {
    console.error('[API] ❌ FastAPI error:', error.response?.status, error.config?.url);
    if (error.response?.status === 401) {
      console.error('[API] 🔴 401 Unauthorized (FastAPI)');
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
    }
    return Promise.reject(error);
  }
);

// Auth endpoints
export const authAPI = {
  signup: (name, email, password, language = 'English') => {
    console.log('[API] Signup request:', { name, email, language });
    return djangoAPI.post('/signup/', { 
      username: email.split('@')[0], 
      first_name: name, 
      email, 
      password,
      language,
    });
  },
  login: (email, password) => {
    console.log('[API] Login request:', email);
    return djangoAPI.post('/login/', { email, password });
  },
  logout: () => {
    console.log('[API] Logout - clearing tokens');
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
  },
};

// Levels endpoints
export const levelsAPI = {
  getAll: () => {
    console.log('[API] Fetching all levels');
    return djangoAPI.get('/levels/');
  },
  getById: (id) => {
    console.log('[API] Fetching level:', id);
    return djangoAPI.get(`/levels/${id}/`);
  },
  getUserProgress: () => {
    console.log('[API] Fetching user progress');
    return djangoAPI.get('/user_progress/');
  },
};

// Feedback endpoints
export const feedbackAPI = {
  save: (data) => {
    console.log('[API] Saving feedback:', data.level_id);
    return djangoAPI.post('/save_feedback/', data);
  },
  getByLevel: (levelId) => {
    console.log('[API] Fetching feedback for level:', levelId);
    return djangoAPI.get(`/feedback/${levelId}/`);
  },
  getAllUserFeedback: () => {
    console.log('[API] Fetching all user feedback');
    // This would need a new endpoint in backend
    return djangoAPI.get('/user_feedback/');
  },
};

// AI Analysis endpoints (FastAPI)
export const aiAPI = {
  analyzeSpeech: (formData) => {
    console.log('[API] Analyzing speech (FastAPI)');
    return fastapiAPI.post('/analyze_speech/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  analyzeReading: (formData) => {
    console.log('[API] Analyzing reading (FastAPI)');
    return fastapiAPI.post('/analyze_reading/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export { djangoAPI, fastapiAPI };