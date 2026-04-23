import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

export type UserRole = 'client' | 'seller';

export interface AuthUser {
  id: string;
  role: UserRole;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  createdAt: string;
}

// Cache module-level, peuplé par AuthContext
let _currentUser: AuthUser | null = null;

export const setCurrentUserCache = (user: AuthUser | null) => {
  _currentUser = user;
};

export const getCurrentUser = (): AuthUser | null => _currentUser;

export const clearSession = async (): Promise<void> => {
  await supabase.auth.signOut();
  _currentUser = null;
};

export const getProfileFromUserId = async (userId: string): Promise<AuthUser | null> => {
  const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
  if (!data) return null;
  return {
    id: data.id,
    role: data.role as UserRole,
    firstName: data.first_name ?? undefined,
    lastName: data.last_name ?? undefined,
    email: data.email ?? undefined,
    phone: data.phone ?? undefined,
    createdAt: data.created_at,
  };
};

export const ensureProfile = async (
  userId: string,
  role: UserRole,
  extra?: { firstName?: string; lastName?: string; email?: string; phone?: string },
): Promise<AuthUser> => {
  const existing = await getProfileFromUserId(userId);
  if (existing) return existing;

  const { data, error } = await supabase
    .from('profiles')
    .insert({
      id: userId,
      role,
      first_name: extra?.firstName ?? null,
      last_name: extra?.lastName ?? null,
      email: extra?.email ?? null,
      phone: extra?.phone ?? null,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  return {
    id: data.id,
    role: data.role as UserRole,
    firstName: data.first_name ?? undefined,
    lastName: data.last_name ?? undefined,
    email: data.email ?? undefined,
    phone: data.phone ?? undefined,
    createdAt: data.created_at,
  };
};

export const loginUser = async (
  _role: UserRole,
  email: string,
  phone: string,
  password: string,
): Promise<AuthUser> => {
  const trimmedEmail = email.trim().toLowerCase();
  const trimmedPhone = phone.trim();

  if (!trimmedEmail && !trimmedPhone) {
    throw new Error('Veuillez renseigner un email ou un numéro de téléphone.');
  }
  if (!password) {
    throw new Error('Veuillez renseigner un mot de passe.');
  }

  const credentials = trimmedEmail
    ? { email: trimmedEmail, password }
    : { phone: trimmedPhone, password };

  const { data, error } = await supabase.auth.signInWithPassword(credentials);
  if (error) {
    throw new Error(
      error.message === 'Invalid login credentials'
        ? 'Email/numéro ou mot de passe invalide.'
        : error.message,
    );
  }

  const profile = await getProfileFromUserId(data.user.id);
  if (!profile) throw new Error('Profil introuvable. Veuillez créer un compte.');
  return profile;
};

export const registerUser = async (
  role: UserRole,
  firstName: string,
  lastName: string,
  email: string,
  phone: string,
  password: string,
): Promise<AuthUser> => {
  if (!firstName.trim() || !lastName.trim()) {
    throw new Error('Veuillez renseigner votre prénom et nom.');
  }
  const trimmedEmail = email.trim().toLowerCase();
  const trimmedPhone = phone.trim();
  if (!trimmedEmail && !trimmedPhone) {
    throw new Error('Veuillez renseigner un email ou un numéro de téléphone.');
  }
  if (!password) {
    throw new Error('Veuillez renseigner un mot de passe.');
  }

  const signUpPayload = trimmedEmail
    ? { email: trimmedEmail, password }
    : { phone: trimmedPhone, password };

  const { data, error } = await supabase.auth.signUp(signUpPayload);
  if (error) throw new Error(error.message);
  if (!data.user) throw new Error("Erreur lors de la création du compte.");

  return ensureProfile(data.user.id, role, {
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    email: trimmedEmail || undefined,
    phone: trimmedPhone || undefined,
  });
};

export const sendPhoneOTP = async (phone: string): Promise<void> => {
  const { error } = await supabase.auth.signInWithOtp({ phone: phone.trim() });
  if (error) throw new Error(error.message);
};

export const verifyPhoneOTP = async (
  phone: string,
  token: string,
  role: UserRole,
): Promise<AuthUser> => {
  const { data, error } = await supabase.auth.verifyOtp({
    phone: phone.trim(),
    token: token.trim(),
    type: 'sms',
  });
  if (error) throw new Error(error.message);
  if (!data.user) throw new Error('Vérification échouée.');

  await AsyncStorage.removeItem('alimconnect-pending-role');
  return ensureProfile(data.user.id, role, { phone: phone.trim() });
};

export const signInWithGoogle = async (role: UserRole): Promise<string | null> => {
  await AsyncStorage.setItem('alimconnect-pending-role', role);
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: 'alimconnect://',
      skipBrowserRedirect: true,
    },
  });
  if (error) throw new Error(error.message);
  return data.url ?? null;
};
