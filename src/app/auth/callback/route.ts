import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/auth/allowlist";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/domains";

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=missing_code", url.origin));
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.session) {
    return NextResponse.redirect(
      new URL("/login?error=exchange_failed", url.origin),
    );
  }

  // Re-verify allowlist post-exchange. If somehow a non-admin email created a
  // session, sign them out immediately and drop them at /login.
  if (!isAdminEmail(data.user.email)) {
    await supabase.auth.signOut();
    return NextResponse.redirect(new URL("/login?error=not_authorized", url.origin));
  }

  // Best-effort: ensure a `profiles` row exists. Uses service role so this
  // works even before the user's own RLS policies have any data to insert with.
  try {
    const admin = createSupabaseAdminClient();
    await admin.from("profiles").upsert(
      {
        id: data.user.id,
        email: data.user.email!,
        admin_email: data.user.email!,
      },
      { onConflict: "id" },
    );
  } catch {
    // Non-fatal: the auth session is established; profile sync can retry later.
  }

  const redirectPath = next.startsWith("/") ? next : "/domains";
  return NextResponse.redirect(new URL(redirectPath, url.origin));
}
