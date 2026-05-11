import { Badge } from "@/components/ui/badge";
import type { DomainStatus } from "@/types/database";

const MAP: Record<
  DomainStatus,
  { label: string; variant: "muted" | "warning" | "success" }
> = {
  pending: { label: "Pending", variant: "muted" },
  configured: { label: "Configured", variant: "warning" },
  active: { label: "Active", variant: "success" },
};

export function DomainStatusBadge({ status }: { status: DomainStatus }) {
  const { label, variant } = MAP[status];
  return <Badge variant={variant}>{label}</Badge>;
}
