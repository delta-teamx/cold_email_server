import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/require-user";
import type { DomainStatus } from "@/types/database";

const patchSchema = z.object({
  dkim_configured: z.boolean().optional(),
  spf_configured: z.boolean().optional(),
  dmarc_configured: z.boolean().optional(),
  notes: z.string().max(2000).nullable().optional(),
  registered_at: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable()
    .optional(),
});

function deriveStatus(d: {
  dkim_configured: boolean;
  spf_configured: boolean;
  dmarc_configured: boolean;
}): DomainStatus {
  if (d.dkim_configured && d.spf_configured && d.dmarc_configured) return "active";
  if (d.dkim_configured || d.spf_configured || d.dmarc_configured)
    return "configured";
  return "pending";
}

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

  const { data: existing, error: readError } = await supabase
    .from("domains")
    .select("dkim_configured, spf_configured, dmarc_configured")
    .eq("id", id)
    .single();

  if (readError || !existing) {
    return NextResponse.json({ error: "Domain not found" }, { status: 404 });
  }

  const merged = {
    dkim_configured:
      parsed.data.dkim_configured ?? existing.dkim_configured,
    spf_configured: parsed.data.spf_configured ?? existing.spf_configured,
    dmarc_configured:
      parsed.data.dmarc_configured ?? existing.dmarc_configured,
  };

  const { data, error } = await supabase
    .from("domains")
    .update({
      ...parsed.data,
      status: deriveStatus(merged),
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
  const { error } = await supabase.from("domains").delete().eq("id", id);

  if (error) {
    // 23503 = foreign_key_violation (inbox still references this domain)
    const status = error.code === "23503" ? 409 : 500;
    const message =
      error.code === "23503"
        ? "Cannot delete: domain still has inboxes attached."
        : error.message;
    return NextResponse.json({ error: message }, { status });
  }
  return NextResponse.json({ ok: true });
}
