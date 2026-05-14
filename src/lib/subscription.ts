import { supabase } from './supabase';

export type SubStatus = 'none' | 'trial' | 'active' | 'expired';

export interface SubscriptionInfo {
  status: SubStatus;
  trialStartAt: string | null;
  trialDaysLeft: number;
  subscriptionExpiresAt: string | null;
  subDaysLeft: number;
}

function calcTrialDaysLeft(trialStartAt: string): number {
  const trialEnd = new Date(trialStartAt).getTime() + 7 * 24 * 60 * 60 * 1000;
  return Math.max(0, Math.ceil((trialEnd - Date.now()) / (1000 * 60 * 60 * 24)));
}

function calcSubDaysLeft(expiresAt: string): number {
  return Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
}

/**
 * Lit l'abonnement depuis les métadonnées de l'utilisateur Supabase.
 * Aucune colonne DB supplémentaire nécessaire.
 */
export async function getSubscription(_sellerId: string): Promise<SubscriptionInfo> {
  const { data } = await supabase.auth.getUser();
  if (!data.user) {
    return { status: 'none', trialStartAt: null, trialDaysLeft: 0, subscriptionExpiresAt: null, subDaysLeft: 0 };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const meta = (data.user.user_metadata ?? {}) as Record<string, any>;

  const daysLeftTrial = meta.trial_start_at ? calcTrialDaysLeft(meta.trial_start_at) : 0;
  const daysLeftSub   = meta.subscription_expires_at ? calcSubDaysLeft(meta.subscription_expires_at) : 0;

  let status = (meta.subscription_status ?? 'none') as SubStatus;
  if (status === 'trial'  && daysLeftTrial === 0) status = 'expired';
  if (status === 'active' && daysLeftSub   === 0) status = 'expired';

  return {
    status,
    trialStartAt:           meta.trial_start_at          ?? null,
    trialDaysLeft:          daysLeftTrial,
    subscriptionExpiresAt:  meta.subscription_expires_at ?? null,
    subDaysLeft:            daysLeftSub,
  };
}

/**
 * Démarre l'essai gratuit — écrit dans user_metadata.
 */
export async function startTrial(_sellerId: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({
    data: {
      trial_start_at:      new Date().toISOString(),
      subscription_status: 'trial',
    },
  });
  if (error) throw new Error(error.message);
}

/**
 * Active l'abonnement payant.
 * Si l'essai est encore en cours, l'abonnement démarre à la fin de l'essai.
 */
export async function activateSubscription(_sellerId: string, trialStartAt: string): Promise<void> {
  const now      = Date.now();
  const trialEnd = new Date(trialStartAt).getTime() + 7 * 24 * 60 * 60 * 1000;
  const startMs  = trialEnd > now ? trialEnd : now;
  const expiresAt = new Date(startMs + 30 * 24 * 60 * 60 * 1000).toISOString();

  const { error } = await supabase.auth.updateUser({
    data: {
      subscription_status:     'active',
      subscription_expires_at: expiresAt,
    },
  });
  if (error) throw new Error(error.message);
}
