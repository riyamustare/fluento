import axios from 'axios';

// Use HTTP for local development
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
const FASTAPI_BASE_URL = import.meta.env.VITE_FASTAPI_URL || 'http://localhost:8001/api';

console.log('[API Config] Django API URL:', API_BASE_URL);
console.log('[API Config] FastAPI URL:', FASTAPI_BASE_URL);

// Create axios instances
const djangoAPI = axios.create({
  baseURL: API_BASE_URL,
});

const fastapiAPI = axios.create({
  baseURL: FASTAPI_BASE_URL,
});

// Intercept requests to add JWT token
djangoAPI.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    // List of public endpoints that don't need tokens
    const publicEndpoints = ['/signup/', '/login/'];
    const isPublicEndpoint = publicEndpoints.some(endpoint => config.url.includes(endpoint));
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('[API] 🔐 Token added to request:', config.url);
    } else if (!isPublicEndpoint) {
      console.warn('[API] ⚠️ No token found in localStorage for:', config.url);
    }
    return config;
  },
  (error) => Promise.reject(error)
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
  (error) => Promise.reject(error)
);

// Response interceptors for error handling
djangoAPI.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error('[API] 🔴 401 Unauthorized:', error.response?.data);
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      // Optionally redirect to login
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

fastapiAPI.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error('[API] 🔴 401 Unauthorized (FastAPI):', error.response?.data);
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
    }
    return Promise.reject(error);
  }
);

// Auth endpoints
export const authAPI = {
  signup: (name, email, password, language = 'English') =>
    djangoAPI.post('/signup/', { 
      username: email.split('@')[0], 
      first_name: name, 
      email, 
      password,
      language,
    }),
  login: (email, password) =>
    djangoAPI.post('/login/', { email, password }),
  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
  },
};

// Levels endpoints
export const levelsAPI = {
  getAll: () => djangoAPI.get('/levels/'),
  getById: (id) => djangoAPI.get(`/levels/${id}/`),
  getUserProgress: () => djangoAPI.get('/user_progress/'),
};

// Feedback endpoints
export const feedbackAPI = {
  save: (data) => djangoAPI.post('/save_feedback/', data),
  getByLevel: (levelId) => djangoAPI.get(`/feedback/${levelId}/`),
};

// AI Analysis endpoints (FastAPI)
export const aiAPI = {
  analyzeSpeech: (formData) =>
    fastapiAPI.post('/analyze_speech/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  analyzeReading: (formData) =>
    fastapiAPI.post('/analyze_reading/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

export { djangoAPI, fastapiAPI };