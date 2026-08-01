import { NextResponse } from "next/server";
import { SUPABASE_SESSION_COOKIE } from "@/lib/supabaseSession";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(SUPABASE_SESSION_COOKIE);
  return response;
}
