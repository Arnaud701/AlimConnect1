import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SUPABASE_URL = 'https://ftognkzdxmwwhdqhacop.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_3Xb63abLDt6jKl-5L-_5_A_n3TB0JDO';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
