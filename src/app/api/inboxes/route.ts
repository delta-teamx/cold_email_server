import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/require-user";

const createSchema = z.object({
  domain_id: z.string().uuid(),
  email_address: z.string().email().toLowerCase(),
  display_name: z.string().trim().min(1).max(120),
  profile_photo_url: z
    .string()
    .url()
    .max(2048)
    .optional()
    .or(z.literal("").transform(() => undefined)),
  instantly_account_id: z
    .string()
    .max(120)
    .optional()
    .or(z.literal("").transform(() => undefined)),
  start_warmup_now: z.boolean().optional(),
});

export async function GET() {
  await requireUser();
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("inboxes")
    .select(
      "*, domain:domains(id, root_domain, status)",
    )
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ data });
}

export async function POST(request: NextRequest) {
  await requireUser();

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = createSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const supabase = await createSupabaseServerClient();

  // Confirm domain exists (and surface a friendlier error than a FK violation).
  const { data: domain, error: domainErr } = await supabase
    .from("domains")
    .select("id, root_domain")
    .eq("id", parsed.data.domain_id)
    .single();

  if (domainErr || !domain) {
    return NextResponse.json({ error: "Domain not found" }, { status: 404 });
  }

  // Soft-check the 3-inboxes-per-domain cap before the DB trigger fires.
  const { count } = await supabase
    .from("inboxes")
    .select("id", { count: "exact", head: true })
    .eq("domain_id", parsed.data.domain_id);

  if ((count ?? 0) >= 3) {
    return NextResponse.json(
      { error: "This domain already has the maximum of 3 inboxes." },
      { status: 409 },
    );
  }

  const nowIso = new Date().toISOString();
  const { data, error } = await supabase
    .from("inboxes")
    .insert({
      domain_id: parsed.data.domain_id,
      email_address: parsed.data.email_address,
      display_name: parsed.data.display_name,
      profile_photo_url: parsed.data.profile_photo_url ?? null,
      instantly_account_id: parsed.data.instantly_account_id ?? null,
      state: "warming",
      current_daily_limit: 0,
      warmup_started_at: parsed.data.start_warmup_now ? nowIso : null,
    })
    .select("*")
    .single();

  if (error) {
    const status = error.code === "23505" ? 409 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }
  return NextResponse.json({ data }, { status: 201 });
}
