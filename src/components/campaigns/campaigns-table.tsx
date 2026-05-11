"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Pause, Play, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CampaignStatusBadge } from "./campaign-status-badge";
import { formatRelative } from "@/lib/utils";
import type { CampaignStatus, Tables } from "@/types/database";

interface Props {
  campaigns: Array<
    Pick<
      Tables<"campaigns">,
      "id" | "name" | "niche" | "city" | "status" | "created_at"
    > & { lead_count: number }
  >;
}

export function CampaignsTable({ campaigns }: Props) {
  return (
    <div className="rounded-lg border border-border bg-card">
      <Table>
        <TableCaption className="sr-only">
          Campaigns with their niche, city, status, and lead counts.
        </TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Niche</TableHead>
            <TableHead>City</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Leads</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="w-12" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {campaigns.map((c) => (
            <TableRow key={c.id}>
              <TableCell className="font-medium">{c.name}</TableCell>
              <TableCell className="text-sm">{c.niche}</TableCell>
              <TableCell className="text-sm">{c.city}</TableCell>
              <TableCell>
                <CampaignStatusBadge status={c.status} />
              </TableCell>
              <TableCell className="text-sm tabular-nums">
                {c.lead_count}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {formatRelative(c.created_at)}
              </TableCell>
              <TableCell>
                <CampaignActions
                  campaignId={c.id}
                  name={c.name}
                  status={c.status}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function CampaignActions({
  campaignId,
  name,
  status,
}: {
  campaignId: string;
  name: string;
  status: CampaignStatus;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function patch(body: Record<string, unknown>, successMsg: string) {
    startTransition(async () => {
      const res = await fetch(`/api/campaigns/${campaignId}`, {
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
      router.refresh();
    });
  }

  function onDelete() {
    if (
      !confirm(
        `Delete campaign "${name}"? This cascades to all leads in it. This cannot be undone.`,
      )
    ) {
      return;
    }
    startTransition(async () => {
      const res = await fetch(`/api/campaigns/${campaignId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        toast.error("Could not delete campaign", {
          description: data.error ?? "Unknown error",
        });
        return;
      }
      toast.success(`Deleted "${name}"`);
      router.refresh();
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          disabled={pending}
          aria-label={`Actions for ${name}`}
        >
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {status === "active" ? (
          <DropdownMenuItem
            onSelect={() => patch({ status: "paused" }, "Campaign paused")}
          >
            <Pause className="size-4" />
            Pause
          </DropdownMenuItem>
        ) : status === "draft" || status === "paused" ? (
          <DropdownMenuItem
            onSelect={() => patch({ status: "active" }, "Campaign activated")}
          >
            <Play className="size-4" />
            Activate
          </DropdownMenuItem>
        ) : null}
        {status !== "completed" ? (
          <DropdownMenuItem
            onSelect={() =>
              patch({ status: "completed" }, "Campaign marked complete")
            }
          >
            Mark complete
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={onDelete} className="text-destructive">
          <Trash2 className="size-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
