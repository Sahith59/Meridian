import { createClient } from "@supabase/supabase-js";
import { wrapSupabaseFetch } from "@boldsec/supabase";
import { requiredEnv } from "@/lib/env";

export function createBoldSupabaseClient(accessToken?: string) {
  const headers: Record<string, string> = {};
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  return createClient(requiredEnv("NEXT_PUBLIC_SUPABASE_URL"), requiredEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"), {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      headers,
      fetch: wrapSupabaseFetch(),
    },
  });
}
