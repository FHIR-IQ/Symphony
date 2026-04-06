import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder"
);

export async function POST(request: NextRequest) {
  try {
    const { teamId, voterId, sessionId } = await request.json();

    if (!teamId || !voterId || !sessionId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Upsert vote (one vote per voter per session)
    const { error } = await supabase.from("votes").upsert(
      { team_id: teamId, voter_id: voterId, session_id: sessionId },
      { onConflict: "voter_id,session_id" }
    );

    if (error) {
      console.error("Vote error:", error);
      return NextResponse.json({ error: "Failed to cast vote" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
