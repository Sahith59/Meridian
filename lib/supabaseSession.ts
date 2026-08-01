import { cookies } from "next/headers";

export const SUPABASE_SESSION_COOKIE = "meridian_supabase_access_token";

export async function getSupabaseAccessToken() {
  return (await cookies()).get(SUPABASE_SESSION_COOKIE)?.value ?? null;
}
