import { createBrowserSupabase, hasSupabaseConfig } from './supabase/browser';

/** Browser Supabase client (cookie-backed via @supabase/ssr). */
export function getSupabase() {
  return createBrowserSupabase();
}

export { hasSupabaseConfig };
