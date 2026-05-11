import { Badge } from "@/components/ui/badge";
import type { InboxState } from "@/types/database";

const MAP: Record<
  InboxState,
  { label: string; variant: "muted" | "info" | "warning" | "success" | "danger" }
> = {
  warming: { label: "Warming", variant: "info" },
  ramping: { label: "Ramping", variant: "warning" },
  active: { label: "Active", variant: "success" },
  paused: { label: "Paused", variant: "danger" },
};

export function InboxStateBadge({ state }: { state: InboxState }) {
  const { label, variant } = MAP[state];
  return <Badge variant={variant}>{label}</Badge>;
}
