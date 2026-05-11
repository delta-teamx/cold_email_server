"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Pause, Play, PlayCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { InboxState } from "@/types/database";

interface Props {
  inboxId: string;
  emailAddress: string;
  state: InboxState;
  warmupStarted: boolean;
}

export function InboxActions({
  inboxId,
  emailAddress,
  state,
  warmupStarted,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [pauseOpen, setPauseOpen] = useState(false);
  const [pauseDays, setPauseDays] = useState(7);
  const [pauseReason, setPauseReason] = useState("");

  function patch(body: Record<string, unknown>, successMsg: string) {
    startTransition(async () => {
      const res = await fetch(`/api/inboxes/${inboxId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        toast.error("Action failed", {
          description: data.error ?? "Unknown error",
        });
        return;
      }
      toast.success(successMsg);
      setPauseOpen(false);
      router.refresh();
    });
  }

  function onDelete() {
    if (
      !confirm(
        `Delete ${emailAddress}? Only do this for inboxes that never sent any emails.`,
      )
    ) {
      return;
    }
    startTransition(async () => {
      const res = await fetch(`/api/inboxes/${inboxId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        toast.error("Could not delete inbox", {
          description: data.error ?? "Unknown error",
        });
        return;
      }
      toast.success(`Deleted ${emailAddress}`);
      router.refresh();
    });
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size="icon"
            variant="ghost"
            disabled={pending}
            aria-label={`Actions for ${emailAddress}`}
          >
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {!warmupStarted ? (
            <DropdownMenuItem
              onSelect={() =>
                patch({ action: "start_warmup" }, "Warmup clock started")
              }
            >
              <PlayCircle className="size-4" />
              Start warmup clock
            </DropdownMenuItem>
          ) : null}
          {state === "paused" ? (
            <DropdownMenuItem
              onSelect={() => patch({ action: "resume" }, "Inbox resumed")}
            >
              <Play className="size-4" />
              Resume
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onSelect={() => setPauseOpen(true)}>
              <Pause className="size-4" />
              Pause…
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={onDelete} className="text-destructive">
            <Trash2 className="size-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={pauseOpen} onOpenChange={setPauseOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pause {emailAddress}</DialogTitle>
            <DialogDescription>
              Sets daily limit to 0 until the pause expires. The state machine
              will re-promote based on warmup age when resumed.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              patch(
                {
                  action: "pause",
                  pause_reason: pauseReason.trim(),
                  pause_days: pauseDays,
                },
                "Inbox paused",
              );
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="pause_reason">Reason</Label>
              <Input
                id="pause_reason"
                value={pauseReason}
                onChange={(e) => setPauseReason(e.target.value)}
                placeholder="High bounce rate, manual review, etc."
                required
                minLength={1}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pause_days">Pause for (days)</Label>
              <Input
                id="pause_days"
                type="number"
                min={1}
                max={60}
                value={pauseDays}
                onChange={(e) => setPauseDays(Number(e.target.value))}
                required
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setPauseOpen(false)}
                disabled={pending}
              >
                Cancel
              </Button>
              <Button type="submit" variant="destructive" disabled={pending}>
                {pending ? "Pausing…" : "Pause inbox"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
