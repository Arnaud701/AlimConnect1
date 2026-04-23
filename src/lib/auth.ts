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

let _currentUser: AuthUser | null = null;

export const setCurrentUserCache = (user: AuthUser | null) => {
  _currentUser = user;
};

export const getCurrentUser = (): AuthUser | null => _currentUser;

export const clearSession = (): void => {
  _currentUser = null;
  supabase.auth.signOut().catch(() => {});
};

function mapProfile(data: Record<string, unknown>): AuthUser {
  return {
    id: data.id as string,
    role: data.role as UserRole,
    firstName: (data.first_name as string) ?? undefined,
    lastName: (data.last_name as string) ?? undefined,
    email: (data.email as string) ?? undefined,
    phone: (data.phone as string) ?? undefined,
    createdAt: data.created_at as string,
  };
}

export const getProfileFromUserId = async (userId: string): Promise<AuthUser | null> => {
  const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
  if (!data) return null;
  return mapProfile(data);
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
  return mapProfile(data);
};

export const loginUser = async (
  role: UserRole,
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

  const profile = await ensureProfile(data.user.id, role, {
    email: trimmedEmail || undefined,
    phone: trimmedPhone || undefined,
  });
  setCurrentUserCache(profile);
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

  // Compte déjà existant → connexion directe
  if (
    error?.message.toLowerCase().includes('already registered') ||
    error?.message.toLowerCase().includes('already exists')
  ) {
    return loginUser(role, trimmedEmail, trimmedPhone, password);
  }
  if (error) throw new Error(error.message);
  if (!data.user) throw new Error('Erreur lors de la création du compte.');

  // Attendre que le lock auth soit libéré avant de créer le profil
  await new Promise((r) => setTimeout(r, 200));

  const profile = await ensureProfile(data.user.id, role, {
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    email: trimmedEmail || undefined,
    phone: trimmedPhone || undefined,
  });
  setCurrentUserCache(profile);
  return profile;
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

  await new Promise((r) => setTimeout(r, 200));
  const profile = await ensureProfile(data.user.id, role, { phone: phone.trim() });
  setCurrentUserCache(profile);
  return profile;
};
