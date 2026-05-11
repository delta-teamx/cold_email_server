"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  domains: Array<{ id: string; root_domain: string; inbox_count: number }>;
}

export function AddInboxDialog({ domains }: Props) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [startWarmup, setStartWarmup] = useState(false);
  const router = useRouter();

  const availableDomains = domains.filter((d) => d.inbox_count < 3);
  const disabled = availableDomains.length === 0;

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const payload = {
      domain_id: String(form.get("domain_id") ?? ""),
      email_address: String(form.get("email_address") ?? "").trim(),
      display_name: String(form.get("display_name") ?? "").trim(),
      profile_photo_url:
        String(form.get("profile_photo_url") ?? "").trim() || undefined,
      instantly_account_id:
        String(form.get("instantly_account_id") ?? "").trim() || undefined,
      start_warmup_now: startWarmup,
    };

    startTransition(async () => {
      const res = await fetch("/api/inboxes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        toast.error("Could not add inbox", {
          description: body.error ?? "Unknown error",
        });
        return;
      }
      toast.success("Inbox added");
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" disabled={disabled}>
          <Plus className="size-4" />
          Add inbox
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a sending inbox</DialogTitle>
          <DialogDescription>
            Attach an inbox to one of your domains. Cap: 3 inboxes per domain.
            Hard cap: 20 sends/day per inbox at steady state.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="domain_id">Domain</Label>
            <select
              id="domain_id"
              name="domain_id"
              required
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="">Select a domain…</option>
              {availableDomains.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.root_domain} ({d.inbox_count}/3)
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email_address">Email address</Label>
            <Input
              id="email_address"
              name="email_address"
              type="email"
              required
              placeholder="john@tryyouragency.com"
              autoComplete="off"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="display_name">Display name</Label>
            <Input
              id="display_name"
              name="display_name"
              required
              placeholder="John Smith"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="profile_photo_url">Profile photo URL (optional)</Label>
            <Input
              id="profile_photo_url"
              name="profile_photo_url"
              type="url"
              placeholder="https://…"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="instantly_account_id">
              Instantly account ID (optional)
            </Label>
            <Input
              id="instantly_account_id"
              name="instantly_account_id"
              placeholder="acct_…"
            />
          </div>
          <label className="flex items-start gap-2 rounded-md border border-border bg-muted/30 p-3 text-sm">
            <input
              type="checkbox"
              checked={startWarmup}
              onChange={(e) => setStartWarmup(e.target.checked)}
              className="mt-0.5 size-4 accent-emerald-500"
            />
            <span>
              <span className="font-medium">Start warmup clock now.</span>{" "}
              <span className="text-muted-foreground">
                14-day warming → 3-week ramp → 20/day active. Only check this
                once Instantly warmup is actually running on this inbox.
              </span>
            </span>
          </label>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Adding…" : "Add inbox"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
