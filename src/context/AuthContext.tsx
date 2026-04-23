import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
  AuthUser,
  UserRole,
  setCurrentUserCache,
  getProfileFromUserId,
  ensureProfile,
} from '@/lib/auth';

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  signOut: () => Promise<void>;
  setUserDirectly: (u: AuthUser) => void;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  signOut: async () => {},
  setUserDirectly: () => {},
});

async function resolveProfile(userId: string): Promise<AuthUser | null> {
  let profile = await getProfileFromUserId(userId);
  if (!profile) {
    const pendingRole = localStorage.getItem('alimconnect-pending-role') as UserRole | null;
    if (pendingRole) {
      profile = await ensureProfile(userId, pendingRole);
      localStorage.removeItem('alimconnect-pending-role');
    }
  }
  return profile;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'INITIAL_SESSION') {
        if (session?.user) {
          setTimeout(async () => {
            try {
              const profile = await resolveProfile(session.user.id);
              if (profile) {
                setUser(profile);
                setCurrentUserCache(profile);
              }
            } catch {
              // profil non trouvé, on laisse user null
            } finally {
              setLoading(false);
            }
          }, 0);
        } else {
          setUser(null);
          setCurrentUserCache(null);
          setLoading(false);
        }
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        if (session?.user) {
          setTimeout(async () => {
            try {
              const profile = await resolveProfile(session.user.id);
              if (profile) {
                setUser(profile);
                setCurrentUserCache(profile);
              }
            } catch {
              // silencieux
            }
          }, 100);
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setCurrentUserCache(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    setUser(null);
    setCurrentUserCache(null);
    supabase.auth.signOut().catch(() => {});
  };

  const setUserDirectly = (u: AuthUser) => {
    setUser(u);
    setCurrentUserCache(u);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut, setUserDirectly }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
