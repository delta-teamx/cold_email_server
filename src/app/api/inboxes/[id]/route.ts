import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/require-user";
import {
  computePromotions,
  type InboxForPromotion,
} from "@/lib/inboxes/state-machine";

const patchSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("pause"),
    pause_reason: z.string().trim().min(1).max(500),
    pause_days: z.number().int().min(1).max(60).default(7),
  }),
  z.object({
    action: z.literal("resume"),
  }),
  z.object({
    action: z.literal("start_warmup"),
  }),
]);

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  await requireUser();
  const { id } = await params;

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const supabase = await createSupabaseServerClient();

  const { data: inbox, error: readErr } = await supabase
    .from("inboxes")
    .select(
      "id, state, warmup_started_at, paused_until, current_daily_limit",
    )
    .eq("id", id)
    .single();

  if (readErr || !inbox) {
    return NextResponse.json({ error: "Inbox not found" }, { status: 404 });
  }

  const now = new Date();

  if (parsed.data.action === "pause") {
    const pausedUntil = new Date(
      now.getTime() + parsed.data.pause_days * 86_400_000,
    );
    const { data, error } = await supabase
      .from("inboxes")
      .update({
        state: "paused",
        current_daily_limit: 0,
        pause_reason: parsed.data.pause_reason,
        paused_until: pausedUntil.toISOString(),
      })
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ data });
  }

  if (parsed.data.action === "start_warmup") {
    if (inbox.warmup_started_at) {
      return NextResponse.json(
        { error: "Warmup has already been started for this inbox." },
        { status: 409 },
      );
    }
    const { data, error } = await supabase
      .from("inboxes")
      .update({
        warmup_started_at: now.toISOString(),
        state: "warming",
        current_daily_limit: 0,
      })
      .eq("id", id)
      .select("*")
      .single();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ data });
  }

  // resume — recompute state from warmup age, clear pause fields.
  const cleared: InboxForPromotion = {
    ...inbox,
    state: inbox.warmup_started_at ? "warming" : "warming",
    paused_until: null,
  };
  const [decision] = computePromotions([cleared], now);
  if (!decision) {
    return NextResponse.json({ error: "Could not compute next state" }, { status: 500 });
  }

  const { data, error } = await supabase
    .from("inboxes")
    .update({
      state: decision.next_state,
      current_daily_limit: decision.next_daily_limit,
      pause_reason: null,
      paused_until: null,
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ data });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  await requireUser();
  const { id } = await params;

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("inboxes").delete().eq("id", id);

  if (error) {
    const status = error.code === "23503" ? 409 : 500;
    const message =
      error.code === "23503"
        ? "Cannot delete: inbox is still referenced by emails or replies."
        : error.message;
    return NextResponse.json({ error: message }, { status });
  }
  return NextResponse.json({ ok: true });
}
