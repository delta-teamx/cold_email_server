import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { InboxStateBadge } from "./inbox-state-badge";
import { InboxActions } from "./inbox-actions";
import { formatRelative } from "@/lib/utils";
import type { Tables } from "@/types/database";

type InboxRow = Tables<"inboxes"> & {
  domain: Pick<Tables<"domains">, "id" | "root_domain"> | null;
};

export function InboxesTable({ inboxes }: { inboxes: InboxRow[] }) {
  return (
    <div className="rounded-lg border border-border bg-card">
      <Table>
        <TableCaption className="sr-only">
          Sending inboxes with their current state, daily sends, and limits.
        </TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Inbox</TableHead>
            <TableHead>Domain</TableHead>
            <TableHead>State</TableHead>
            <TableHead>Today</TableHead>
            <TableHead>Daily limit</TableHead>
            <TableHead>Warmup started</TableHead>
            <TableHead className="w-12" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {inboxes.map((i) => (
            <TableRow key={i.id}>
              <TableCell>
                <div className="font-medium">{i.email_address}</div>
                <div className="text-xs text-muted-foreground">
                  {i.display_name}
                </div>
              </TableCell>
              <TableCell className="text-sm">
                {i.domain?.root_domain ?? "—"}
              </TableCell>
              <TableCell>
                <div className="flex flex-col gap-1">
                  <InboxStateBadge state={i.state} />
                  {i.state === "paused" && i.pause_reason ? (
                    <span className="text-[11px] text-muted-foreground">
                      {i.pause_reason}
                    </span>
                  ) : null}
                </div>
              </TableCell>
              <TableCell className="text-sm tabular-nums">
                {i.sends_today}
              </TableCell>
              <TableCell className="text-sm tabular-nums">
                {i.current_daily_limit}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {i.warmup_started_at
                  ? formatRelative(i.warmup_started_at)
                  : "not started"}
              </TableCell>
              <TableCell>
                <InboxActions
                  inboxId={i.id}
                  emailAddress={i.email_address}
                  state={i.state}
                  warmupStarted={!!i.warmup_started_at}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
