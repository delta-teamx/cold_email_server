import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { computePromotions } from "@/lib/inboxes/state-machine";
import { requireEnv } from "@/lib/utils";

/**
 * Cron-callable. Promotes every inbox through warming → ramping → active
 * based on `warmup_started_at` age, and reactivates inboxes whose
 * `paused_until` has elapsed. Idempotent: rows that need no change are skipped.
 *
 * Auth: requires header `Authorization: Bearer <CRON_SECRET>`.
 * Schedule daily (e.g. Vercel cron at 00:05 UTC, or Supabase pg_cron later).
 */
export async function POST(request: NextRequest) {
  return run(request);
}

// GET is also accepted so platform crons that hit GET-only URLs still work.
export async function GET(request: NextRequest) {
  return run(request);
}

async function run(request: NextRequest) {
  const expected = `Bearer ${requireEnv("CRON_SECRET")}`;
  if (request.headers.get("authorization") !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createSupabaseAdminClient();

  const { data: inboxes, error: readErr } = await supabase
    .from("inboxes")
    .select(
      "id, state, warmup_started_at, paused_until, current_daily_limit",
    );

  if (readErr) {
    return NextResponse.json({ error: readErr.message }, { status: 500 });
  }

  const decisions = computePromotions(inboxes ?? []);
  const changes = decisions.filter((d) => d.changed);

  for (const change of changes) {
    const { error } = await supabase
      .from("inboxes")
      .update({
        state: change.next_state,
        current_daily_limit: change.next_daily_limit,
        ...(change.next_state !== "paused"
          ? { pause_reason: null, paused_until: null }
          : {}),
      })
      .eq("id", change.id);

    if (error) {
      return NextResponse.json(
        { error: `Failed to update inbox ${change.id}: ${error.message}` },
        { status: 500 },
      );
    }
  }

  return NextResponse.json({
    inspected: decisions.length,
    updated: changes.length,
    changes,
  });
}
