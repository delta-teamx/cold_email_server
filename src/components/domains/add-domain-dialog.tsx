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

export function AddDomainDialog() {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const payload = {
      root_domain: String(form.get("root_domain") ?? "").trim(),
      registered_at: String(form.get("registered_at") ?? "") || undefined,
      notes: String(form.get("notes") ?? "").trim() || undefined,
    };

    startTransition(async () => {
      const res = await fetch("/api/domains", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        toast.error("Could not add domain", {
          description: body.error ?? "Unknown error",
        });
        return;
      }
      toast.success("Domain added");
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="size-4" />
          Add domain
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a sending domain</DialogTitle>
          <DialogDescription>
            One of your root domains (no subdomains). Up to 3 inboxes can be
            attached to each domain.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="root_domain">Root domain</Label>
            <Input
              id="root_domain"
              name="root_domain"
              placeholder="tryyouragency.com"
              required
              autoComplete="off"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="registered_at">Registered on (optional)</Label>
            <Input
              id="registered_at"
              name="registered_at"
              type="date"
              max={new Date().toISOString().slice(0, 10)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Input id="notes" name="notes" placeholder="Registrar, anything to remember…" />
          </div>
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
              {pending ? "Adding…" : "Add domain"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
