import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { supabase } from '../../services/supabase';

export type UserRole = 'student' | 'professor' | 'company' | 'admin' | null;

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  verified: boolean;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  signup: (email: string, password: string, name: string, role: UserRole) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const storeAccessToken = (token?: string | null) => {
  if (!token) {
    localStorage.removeItem('access_token');
    localStorage.removeItem('supabase_access_token');
    return;
  }
  localStorage.setItem('access_token', token);
  localStorage.setItem('supabase_access_token', token);
};

const mapSupabaseUser = (supabaseUser: any): User => {
  const metadata = supabaseUser.user_metadata ?? {};
  const appMetadata = supabaseUser.app_metadata ?? {};
  const role = (appMetadata.role ?? metadata.role ?? 'student') as UserRole;

  return {
    id: supabaseUser.id,
    name: metadata.full_name ?? metadata.name ?? supabaseUser.email?.split('@')[0] ?? 'User',
    email: supabaseUser.email ?? '',
    role,
    verified: Boolean(metadata.verified ?? appMetadata.verified ?? role === 'admin'),
    avatar: metadata.avatar_url,
  };
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      storeAccessToken(data.session?.access_token);
      setUser(data.session?.user ? mapSupabaseUser(data.session.user) : null);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      storeAccessToken(session?.access_token);
      setUser(session?.user ? mapSupabaseUser(session.user) : null);
      setLoading(false);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    storeAccessToken(data.session?.access_token);
    setUser(data.user ? mapSupabaseUser(data.user) : null);
  };

  const signup = async (email: string, password: string, name: string, role: UserRole) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
          role: role ?? 'student',
        },
      },
    });
    if (error) throw error;
    storeAccessToken(data.session?.access_token);
    setUser(data.user ? mapSupabaseUser(data.user) : null);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    storeAccessToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, signup }}>
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
