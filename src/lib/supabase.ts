import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let browserClient: SupabaseClient | null = null;
let missingConfigWarned = false;

export function getSupabaseBrowserClient() {
  if (typeof window === "undefined") return null;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !anonKey) {
    if (process.env.NODE_ENV !== "production" && !missingConfigWarned) {
      console.warn("[Supabase] Realtime is disabled: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in the frontend .env.local, then restart Next.js.");
      missingConfigWarned = true;
    }
    return null;
  }

  browserClient ??= createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  return browserClient;
}
