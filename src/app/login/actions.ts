"use server";

import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/auth/allowlist";
import { requireEnv } from "@/lib/utils";

const schema = z.object({
  email: z.string().email(),
  next: z.string().optional(),
});

export type SendMagicLinkState = {
  ok: boolean;
  error?: string;
};

export async function sendMagicLink(
  _prev: SendMagicLinkState,
  formData: FormData,
): Promise<SendMagicLinkState> {
  const parsed = schema.safeParse({
    email: formData.get("email"),
    next: formData.get("next") ?? undefined,
  });

  if (!parsed.success) {
    return { ok: false, error: "Enter a valid email address." };
  }

  // Allowlist check — refuse to even send the magic link to non-admin addresses.
  if (!isAdminEmail(parsed.data.email)) {
    return {
      ok: false,
      error: "This email is not authorized to access this platform.",
    };
  }

  const supabase = await createSupabaseServerClient();
  const appUrl = requireEnv("NEXT_PUBLIC_APP_URL");
  const next = parsed.data.next?.startsWith("/") ? parsed.data.next : "/domains";

  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: {
      shouldCreateUser: true,
      emailRedirectTo: `${appUrl}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true };
}
