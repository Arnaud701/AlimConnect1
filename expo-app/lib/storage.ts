import AsyncStorage from '@react-native-async-storage/async-storage';

export const AUTH_SESSION_KEY = 'alimconnect-auth-session';
export const AUTH_USERS_KEY = 'alimconnect-auth-users';
export const CART_KEY = 'alimconnect-cart';
export const EXTRA_PRODUCTS_KEY = 'alimconnect-added-products';

const KEYS_TO_PRELOAD = [AUTH_SESSION_KEY, AUTH_USERS_KEY, CART_KEY, EXTRA_PRODUCTS_KEY];

// In-memory cache — loaded from AsyncStorage on startup
const _cache: Record<string, string | null> = {};
let _initialized = false;

/** Call once at app start (in root _layout). Blocks until storage is ready. */
export async function initStorage(): Promise<void> {
  if (_initialized) return;
  try {
    const results = await AsyncStorage.multiGet(KEYS_TO_PRELOAD);
    results.forEach(([key, value]) => {
      _cache[key] = value;
    });
  } catch {
    // Ignore errors — cache stays empty, data won't persist this session
  }
  _initialized = true;
}

/** Synchronous read (uses in-memory cache). */
export function storageGet(key: string): string | null {
  return _cache[key] ?? null;
}

/** Write to cache and fire-and-forget to AsyncStorage. */
export function storageSet(key: string, value: string): void {
  _cache[key] = value;
  AsyncStorage.setItem(key, value).catch(() => {});
}

/** Remove from cache and AsyncStorage. */
export function storageRemove(key: string): void {
  _cache[key] = null;
  AsyncStorage.removeItem(key).catch(() => {});
}
