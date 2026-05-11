import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { requireEnv } from "@/lib/utils";

/**
 * Service-role client. Bypasses RLS. Server-only.
 * Use sparingly — prefer the user-scoped server client when possible.
 */
export function createSupabaseAdminClient() {
  return createClient<Database>(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
    {
      auth: { autoRefreshToken: false, persistSession: false },
    },
  );
}
