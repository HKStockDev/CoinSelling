'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { hasSupabaseConfig, getSupabase } from './supabase';
import { api } from './api';

export interface AuthUser {
  id: string;
  email: string;
  role: 'customer' | 'admin';
  fullName: string | null;
  accessToken: string;
}

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName?: string) => Promise<void>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const hydrate = useCallback(async () => {
    if (!hasSupabaseConfig()) {
      setUser(null);
      setLoading(false);
      return;
    }
    const supabase = getSupabase();
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const me = await api.me(token);
      setUser({
        id: me.id,
        email: me.email,
        role: me.role as 'customer' | 'admin',
        fullName: me.fullName,
        accessToken: token,
      });
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void hydrate();
    if (!hasSupabaseConfig()) return;
    const supabase = getSupabase();
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setUser(null);
        setLoading(false);
        return;
      }
      void hydrate();
    });
    return () => sub.subscription.unsubscribe();
  }, [hydrate]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const supabase = getSupabase();
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      // Promote bootstrap admin email if configured (server-side).
      try {
        await fetch('/api/auth/me');
      } catch {
        /* non-blocking */
      }
      await hydrate();
    },
    [hydrate],
  );

  const signUp = useCallback(
    async (email: string, password: string, fullName?: string) => {
      await api.register({ email, password, fullName });
      await signIn(email, password);
    },
    [signIn],
  );

  const signOut = useCallback(async () => {
    if (hasSupabaseConfig()) {
      await getSupabase().auth.signOut();
    }
    setUser(null);
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    const supabase = getSupabase();
    const origin =
      typeof window !== 'undefined'
        ? window.location.origin
        : process.env.NEXT_PUBLIC_SITE_URL || '';
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/account?mode=signin`,
    });
    if (error) throw error;
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      signIn,
      signUp,
      signOut,
      refresh: hydrate,
      resetPassword,
    }),
    [user, loading, signIn, signUp, signOut, hydrate, resetPassword],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
