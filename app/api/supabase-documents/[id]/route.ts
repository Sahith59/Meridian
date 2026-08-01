import { NextResponse } from "next/server";
import { getSupabaseAccessToken } from "@/lib/supabaseSession";
import { createBoldSupabaseClient } from "@/lib/supabaseBold";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const accessToken = await getSupabaseAccessToken();
  if (!accessToken) {
    return NextResponse.json({ error: "not authenticated with Supabase test account" }, { status: 401 });
  }

  const { id } = await params;
  const supabase = createBoldSupabaseClient(accessToken);
  const { data, error } = await supabase
    .from("documents")
    .select("id, owner_id, body")
    .eq("id", id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }

  // Intentional RLS hole lives in Supabase: documents SELECT policy is `using (true)`.
  // With user A's access token, user B's document row is returned.
  return NextResponse.json(data);
}
