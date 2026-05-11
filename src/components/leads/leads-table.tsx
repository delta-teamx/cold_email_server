import Link from "next/link";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { LeadStatusBadge } from "./lead-status-badge";
import { formatRelative } from "@/lib/utils";
import type { Tables } from "@/types/database";

type LeadRow = Pick<
  Tables<"leads">,
  | "id"
  | "business_name"
  | "email"
  | "phone"
  | "status"
  | "call_status"
  | "email_track"
  | "rating"
  | "review_count"
  | "scraped_at"
>;

export function LeadsTable({ leads }: { leads: LeadRow[] }) {
  return (
    <div className="rounded-lg border border-border bg-card">
      <Table>
        <TableCaption className="sr-only">
          Scraped leads with their contact info, call result, and email track.
        </TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Business</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Rating</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Call</TableHead>
            <TableHead>Track</TableHead>
            <TableHead>Scraped</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.map((l) => (
            <TableRow key={l.id}>
              <TableCell className="font-medium">
                <Link href={`/leads/${l.id}`} className="hover:underline">
                  {l.business_name}
                </Link>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                <div>{l.email ?? "—"}</div>
                <div className="text-xs">{l.phone ?? ""}</div>
              </TableCell>
              <TableCell className="text-sm tabular-nums">
                {l.rating != null ? (
                  <>
                    {l.rating.toFixed(1)}
                    <span className="ml-1 text-xs text-muted-foreground">
                      ({l.review_count ?? 0})
                    </span>
                  </>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell>
                <LeadStatusBadge status={l.status} />
              </TableCell>
              <TableCell className="text-sm">
                {l.call_status ? (
                  <Badge variant="muted">{l.call_status.replace("_", " ")}</Badge>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell className="text-sm">
                {l.email_track ? (
                  <Badge variant="info">{l.email_track.replace("_", " ")}</Badge>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {formatRelative(l.scraped_at)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
