import { NextResponse } from "next/server";
import { createBoldSupabaseClient } from "@/lib/supabaseBold";
import { SUPABASE_SESSION_COOKIE } from "@/lib/supabaseSession";

export async function POST(request: Request) {
  const { email, password } = await request.json().catch(() => ({}));
  if (!email || !password) {
    return NextResponse.json({ error: "email and password required" }, { status: 400 });
  }

  const supabase = createBoldSupabaseClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.session) {
    return NextResponse.json({ error: error?.message ?? "Login failed" }, { status: 401 });
  }

  const response = NextResponse.json({
    user: {
      id: data.user.id,
      email: data.user.email,
    },
  });

  response.cookies.set(SUPABASE_SESSION_COOKIE, data.session.access_token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: data.session.expires_in,
  });

  return response;
}
