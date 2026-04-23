import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ftognkzdxmwwhdqhacop.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_3Xb63abLDt6jKl-5L-_5_A_n3TB0JDO';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    storageKey: 'alimconnect-auth',
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
