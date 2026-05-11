"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { MailCheck, AlertCircle } from "lucide-react";
import { sendMagicLink, type SendMagicLinkState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: SendMagicLinkState = { ok: false };

export function LoginForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/domains";
  const [state, formAction, pending] = useActionState(sendMagicLink, initialState);

  if (state.ok) {
    return (
      <div className="rounded-lg border border-border bg-card p-6 text-center">
        <MailCheck className="mx-auto mb-3 size-8 text-emerald-500" />
        <p className="font-medium">Check your inbox.</p>
        <p className="mt-1 text-sm text-muted-foreground">
          We sent you a magic link. Click it to finish signing in.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="you@example.com"
        />
      </div>
      {state.error ? (
        <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <span>{state.error}</span>
        </div>
      ) : null}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Sending…" : "Send magic link"}
      </Button>
    </form>
  );
}
