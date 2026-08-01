import { NextResponse } from "next/server";
import { getSupabaseAccessToken } from "@/lib/supabaseSession";
import { createBoldSupabaseClient } from "@/lib/supabaseBold";

export async function GET() {
  const accessToken = await getSupabaseAccessToken();
  if (!accessToken) {
    return NextResponse.json({ error: "not authenticated with Supabase test account" }, { status: 401 });
  }

  const supabase = createBoldSupabaseClient(accessToken);
  const { data: userData, error: userError } = await supabase.auth.getUser(accessToken);

  if (userError || !userData.user) {
    return NextResponse.json({ error: userError?.message ?? "not authenticated" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("notes")
    .select("id, owner_id, body")
    .eq("owner_id", userData.user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ notes: data });
}
