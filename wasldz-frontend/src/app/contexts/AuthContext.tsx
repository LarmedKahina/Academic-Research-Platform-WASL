import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import axios from 'axios';
import { api, TOKEN_KEY, USER_KEY } from '../services/api';
import type { ApiEnvelope, AuthUserPayload, LoginResponseBody, ProfilePayload } from '../types/api';

export type UserRole = 'student' | 'professor' | 'company' | 'admin' | null;

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  verified: boolean;
  avatar?: string;
  profile?: ProfilePayload;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  signup: (params: {
    email: string;
    password: string;
    name: string;
    role: Exclude<UserRole, null | 'admin'>;
    verificationFile?: File | null;
    university?: string;
    companyName?: string;
    industry?: string;
  }) => Promise<void>;
  refreshUser: () => Promise<void>;
  setUserFromPayload: (p: AuthUserPayload) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function formatApiError(err: unknown): string {
  if (axios.isAxiosError(err) && err.message === 'Network Error') {
    return (
      'Cannot reach the API. Start the backend: cd wasldz-backend && uvicorn app.main:app --reload --port 8000. ' +
      'Then restart the frontend (npm run dev). In development the app uses the Vite proxy (/api → port 8000).'
    );
  }
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { detail?: unknown };
    const d = data?.detail as Record<string, unknown> | string | undefined;
    if (d && typeof d === 'object' && 'error' in d) {
      const inner = (d as { error?: { message?: string } }).error;
      if (inner?.message) return inner.message;
    }
    if (typeof d === 'string') return d;
    if (Array.isArray(d)) {
      return d.map((x: { msg?: string }) => x.msg || '').filter(Boolean).join(', ');
    }
  }
  if (err instanceof Error) return err.message;
  return 'Something went wrong';
}

function mapPayloadToUser(p: AuthUserPayload): User {
  return {
    id: p.id,
    name: p.name,
    email: p.email,
    role: p.role as UserRole,
    verified: p.verified,
    avatar: p.avatar_url || undefined,
    profile: p.profile ?? undefined,
  };
}

function persistUser(u: User | null) {
  if (!u) {
    localStorage.removeItem(USER_KEY);
    return;
  }
  localStorage.setItem(USER_KEY, JSON.stringify(u));
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const raw = localStorage.getItem(USER_KEY);
      if (raw) return JSON.parse(raw) as User;
    } catch {
      /* ignore */
    }
    return null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [loading, setLoading] = useState(true);

  const setUserFromPayload = useCallback((p: AuthUserPayload) => {
    const u = mapPayloadToUser(p);
    setUser(u);
    persistUser(u);
  }, []);

  const refreshUser = useCallback(async () => {
    const t = localStorage.getItem(TOKEN_KEY);
    if (!t) {
      setUser(null);
      setToken(null);
      persistUser(null);
      return;
    }
    setToken(t);
    const res = await api.get<ApiEnvelope<AuthUserPayload>>('/api/auth/me');
    if (res.data.success && res.data.data) {
      setUserFromPayload(res.data.data);
    }
  }, [setUserFromPayload]);

  useEffect(() => {
    const init = async () => {
      const t = localStorage.getItem(TOKEN_KEY);
      if (!t) {
        setLoading(false);
        return;
      }
      try {
        await refreshUser();
      } catch {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        setUser(null);
        setToken(null);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [refreshUser]);

  const login = async (email: string, password: string) => {
    try {
      const res = await api.post<ApiEnvelope<LoginResponseBody>>('/api/auth/login', { email, password });
      if (!res.data.success || !res.data.data) {
        throw new Error(res.data.error?.message || 'Login failed');
      }
      const { access_token, user: u } = res.data.data;
      localStorage.setItem(TOKEN_KEY, access_token);
      setToken(access_token);
      setUserFromPayload(u);
    } catch (e) {
      throw new Error(formatApiError(e));
    }
  };

  const signup = async (params: {
    email: string;
    password: string;
    name: string;
    role: Exclude<UserRole, null | 'admin'>;
    verificationFile?: File | null;
    university?: string;
    companyName?: string;
    industry?: string;
  }) => {
    const form = new FormData();
    form.append('email', params.email);
    form.append('password', params.password);
    form.append('name', params.name);
    form.append('role', params.role);
    if (params.role === 'student' && params.university) form.append('university', params.university);
    if (params.role === 'professor' && params.university) form.append('university', params.university);
    if (params.role === 'company') {
      if (params.companyName) form.append('company_name', params.companyName);
      if (params.industry) form.append('industry', params.industry);
    }
    if (params.verificationFile) {
      form.append('verification', params.verificationFile);
    }

    try {
      const res = await api.post<ApiEnvelope<LoginResponseBody>>('/api/auth/register', form);

      if (!res.data.success || !res.data.data) {
        throw new Error(res.data.error?.message || 'Registration failed');
      }
      const { access_token, user: u } = res.data.data;
      localStorage.setItem(TOKEN_KEY, access_token);
      setToken(access_token);
      setUserFromPayload(u);
    } catch (e) {
      throw new Error(formatApiError(e));
    }
  };

  const logout = async () => {
    try {
      await api.post('/api/auth/logout');
    } catch {
      /* ignore */
    }
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, token, loading, login, logout, signup, refreshUser, setUserFromPayload }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
