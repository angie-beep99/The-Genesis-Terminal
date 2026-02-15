'use client';

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowser } from './supabase-browser';
import type { User, Company } from '@/types/database';

interface AuthContextType {
  user: User | null;
  company: Company | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  company: null,
  loading: true,
  signOut: async () => {},
  refreshUser: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createSupabaseBrowser();

  const loadUser = useCallback(async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        setUser(null);
        setCompany(null);
        setLoading(false);
        return;
      }

      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (userData) {
        setUser(userData);

        if (userData.company_id) {
          const { data: companyData } = await supabase
            .from('companies')
            .select('*')
            .eq('id', userData.company_id)
            .single();

          setCompany(companyData);
        }
      }
    } catch (err) {
      console.error('Failed to load user:', err);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    loadUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: string, session: unknown) => {
      if (!session) {
        setUser(null);
        setCompany(null);
      } else {
        loadUser();
      }
    });

    return () => subscription.unsubscribe();
  }, [loadUser, supabase.auth]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setCompany(null);
    router.push('/login');
  };

  const refreshUser = async () => {
    await loadUser();
  };

  return (
    <AuthContext.Provider value={{ user, company, loading, signOut, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
