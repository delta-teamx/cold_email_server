import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/require-user";

const LEAD_STATUSES = [
  "new",
  "called",
  "personalized",
  "queued",
  "sent",
  "replied",
  "bounced",
  "unsubscribed",
] as const;

const CALL_STATUSES = [
  "voicemail",
  "no_answer",
  "busy",
  "voicemail_full",
  "answered",
  "failed",
] as const;

const EMAIL_TRACKS = ["voicemail_angle", "strong_desk_angle", "excluded"] as const;

const querySchema = z.object({
  campaign_id: z.string().uuid().optional(),
  status: z.enum(LEAD_STATUSES).optional(),
  call_status: z.enum(CALL_STATUSES).optional(),
  email_track: z.enum(EMAIL_TRACKS).optional(),
  q: z.string().max(120).optional(),
  page: z.coerce.number().int().min(1).default(1),
  page_size: z.coerce.number().int().min(1).max(200).default(50),
});

const createSchema = z.object({
  campaign_id: z.string().uuid(),
  business_name: z.string().trim().min(1).max(255),
  owner_name: z.string().trim().max(255).optional(),
  email: z.string().email().toLowerCase().optional(),
  phone: z.string().trim().max(40).optional(),
  website: z.string().url().max(2048).optional(),
  google_maps_url: z.string().url().max(2048).optional(),
  rating: z.number().min(0).max(5).optional(),
  review_count: z.number().int().min(0).optional(),
});

export async function GET(request: NextRequest) {
  await requireUser();
  const url = new URL(request.url);
  const parsed = querySchema.safeParse(Object.fromEntries(url.searchParams));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid query" },
      { status: 400 },
    );
  }
  const { campaign_id, status, call_status, email_track, q, page, page_size } =
    parsed.data;

  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("leads")
    .select(
      "id, campaign_id, business_name, email, phone, status, call_status, email_track, rating, review_count, scraped_at, called_at, sent_at",
      { count: "exact" },
    )
    .order("scraped_at", { ascending: false });

  if (campaign_id) query = query.eq("campaign_id", campaign_id);
  if (status) query = query.eq("status", status);
  if (call_status) query = query.eq("call_status", call_status);
  if (email_track) query = query.eq("email_track", email_track);
  if (q && q.trim()) {
    const term = q.trim().replace(/[%_]/g, "\\$&");
    query = query.or(
      `business_name.ilike.%${term}%,email.ilike.%${term}%,phone.ilike.%${term}%`,
    );
  }

  const from = (page - 1) * page_size;
  const to = from + page_size - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({
    data,
    page,
    page_size,
    total: count ?? 0,
  });
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
  const { data, error } = await supabase
    .from("leads")
    .insert({
      campaign_id: parsed.data.campaign_id,
      business_name: parsed.data.business_name,
      owner_name: parsed.data.owner_name ?? null,
      email: parsed.data.email ?? null,
      phone: parsed.data.phone ?? null,
      website: parsed.data.website ?? null,
      google_maps_url: parsed.data.google_maps_url ?? null,
      rating: parsed.data.rating ?? null,
      review_count: parsed.data.review_count ?? null,
    })
    .select("*")
    .single();

  if (error) {
    const status = error.code === "23505" ? 409 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }
  return NextResponse.json({ data }, { status: 201 });
}
