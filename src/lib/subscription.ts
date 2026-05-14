import { supabase } from './supabase';

export type SubStatus = 'none' | 'trial' | 'active' | 'expired';

export interface SubscriptionInfo {
  status: SubStatus;
  trialStartAt: string | null;
  trialDaysLeft: number;
  subscriptionExpiresAt: string | null;
  subDaysLeft: number;
}

function trialDaysLeft(trialStartAt: string): number {
  const trialEnd = new Date(trialStartAt).getTime() + 7 * 24 * 60 * 60 * 1000;
  return Math.max(0, Math.ceil((trialEnd - Date.now()) / (1000 * 60 * 60 * 24)));
}

function subDaysLeft(expiresAt: string): number {
  return Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
}

export async function getSubscription(sellerId: string): Promise<SubscriptionInfo> {
  const { data } = await supabase
    .from('sellers')
    .select('trial_start_at, subscription_status, subscription_expires_at')
    .eq('id', sellerId)
    .single();

  if (!data) {
    return { status: 'none', trialStartAt: null, trialDaysLeft: 0, subscriptionExpiresAt: null, subDaysLeft: 0 };
  }

  const daysLeftTrial = data.trial_start_at ? trialDaysLeft(data.trial_start_at) : 0;
  const daysLeftSub = data.subscription_expires_at ? subDaysLeft(data.subscription_expires_at) : 0;

  let status = (data.subscription_status ?? 'none') as SubStatus;
  if (status === 'trial' && daysLeftTrial === 0) status = 'expired';
  if (status === 'active' && daysLeftSub === 0) status = 'expired';

  return {
    status,
    trialStartAt: data.trial_start_at ?? null,
    trialDaysLeft: daysLeftTrial,
    subscriptionExpiresAt: data.subscription_expires_at ?? null,
    subDaysLeft: daysLeftSub,
  };
}

export async function startTrial(sellerId: string): Promise<void> {
  const { error } = await supabase
    .from('sellers')
    .update({ trial_start_at: new Date().toISOString(), subscription_status: 'trial' })
    .eq('id', sellerId);
  if (error) throw new Error(error.message);
}

export async function activateSubscription(sellerId: string, trialStartAt: string): Promise<void> {
  const now = Date.now();
  const trialEnd = new Date(trialStartAt).getTime() + 7 * 24 * 60 * 60 * 1000;
  const startMs = trialEnd > now ? trialEnd : now;
  const expiresAt = new Date(startMs + 30 * 24 * 60 * 60 * 1000).toISOString();

  const { error } = await supabase
    .from('sellers')
    .update({ subscription_status: 'active', subscription_expires_at: expiresAt })
    .eq('id', sellerId);
  if (error) throw new Error(error.message);
}
