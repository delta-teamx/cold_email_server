import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/auth/allowlist";

/**
 * Guard for Server Components and Route Handlers.
 * Redirects to /login if not authenticated, or if the session belongs to
 * an email that is not on the allowlist.
 */
export async function requireUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isAdminEmail(user.email)) {
    redirect("/login");
  }

  return user;
}
