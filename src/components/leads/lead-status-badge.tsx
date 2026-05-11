import { Badge } from "@/components/ui/badge";
import type { LeadStatus } from "@/types/database";

const MAP: Record<
  LeadStatus,
  { label: string; variant: "muted" | "info" | "warning" | "success" | "danger" }
> = {
  new: { label: "New", variant: "muted" },
  called: { label: "Called", variant: "info" },
  personalized: { label: "Personalized", variant: "info" },
  queued: { label: "Queued", variant: "warning" },
  sent: { label: "Sent", variant: "info" },
  replied: { label: "Replied", variant: "success" },
  bounced: { label: "Bounced", variant: "danger" },
  unsubscribed: { label: "Unsub", variant: "muted" },
};

export function LeadStatusBadge({ status }: { status: LeadStatus }) {
  const { label, variant } = MAP[status];
  return <Badge variant={variant}>{label}</Badge>;
}
