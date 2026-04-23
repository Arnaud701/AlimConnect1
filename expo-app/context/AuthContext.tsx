import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  signOut: async () => {},
});

async function resolveProfile(userId: string): Promise<AuthUser | null> {
  let profile = await getProfileFromUserId(userId);
  if (!profile) {
    const pendingRole = (await AsyncStorage.getItem('alimconnect-pending-role')) as UserRole | null;
    if (pendingRole) {
      profile = await ensureProfile(userId, pendingRole);
      await AsyncStorage.removeItem('alimconnect-pending-role');
    }
  }
  return profile;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Vérification de session initiale
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const profile = await resolveProfile(session.user.id);
        setUser(profile);
        setCurrentUserCache(profile);
      }
      setLoading(false);
    });

    // Écoute des changements d'état d'auth
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED')) {
        const profile = await resolveProfile(session.user.id);
        setUser(profile);
        setCurrentUserCache(profile);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setCurrentUserCache(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setCurrentUserCache(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
