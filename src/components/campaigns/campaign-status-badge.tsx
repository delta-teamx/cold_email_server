import { Badge } from "@/components/ui/badge";
import type { CampaignStatus } from "@/types/database";

const MAP: Record<
  CampaignStatus,
  { label: string; variant: "muted" | "info" | "success" | "warning" }
> = {
  draft: { label: "Draft", variant: "muted" },
  active: { label: "Active", variant: "success" },
  paused: { label: "Paused", variant: "warning" },
  completed: { label: "Completed", variant: "info" },
};

export function CampaignStatusBadge({ status }: { status: CampaignStatus }) {
  const { label, variant } = MAP[status];
  return <Badge variant={variant}>{label}</Badge>;
}
