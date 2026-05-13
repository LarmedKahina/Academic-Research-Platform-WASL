import axios from 'axios';

const LEGACY_TOKEN_KEY = 'wasldz_access_token';

export const TOKEN_KEY = 'wasldz_token';
export const USER_KEY = 'wasldz_user';

function readStoredToken(): string | null {
  const t = localStorage.getItem(TOKEN_KEY) || localStorage.getItem(LEGACY_TOKEN_KEY);
  if (t && !localStorage.getItem(TOKEN_KEY) && localStorage.getItem(LEGACY_TOKEN_KEY)) {
    localStorage.setItem(TOKEN_KEY, t);
    localStorage.removeItem(LEGACY_TOKEN_KEY);
  }
  return t;
}

/**
 * Base URL for API requests.
 * In dev, local URLs default to same-origin + Vite proxy (`/api` → 127.0.0.1:8000 in vite.config.ts).
 * Set VITE_API_URL only when the API is on another host.
 */
function resolveApiBase(): string {
  if (typeof import.meta === 'undefined') return '';
  const v = import.meta.env.VITE_API_URL as string | undefined;
  if (v === '') return '';
  const trimmed = v != null ? String(v).trim() : '';
  const normalized = trimmed ? trimmed.replace(/\/$/, '') : '';

  if (import.meta.env.DEV) {
    const useLocalProxy =
      !normalized ||
      normalized === 'http://localhost:8000' ||
      normalized === 'http://127.0.0.1:8000';
    if (useLocalProxy) return '';
  }

  if (normalized) return normalized;
  return '';
}

export const API_BASE_URL = resolveApiBase();

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = readStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // Let the browser set multipart boundaries; default JSON Content-Type breaks FormData.
  if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (axios.isAxiosError(err) && err.response?.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem(LEGACY_TOKEN_KEY);
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
        window.location.assign('/login');
      }
    }
    return Promise.reject(err);
  }
);
