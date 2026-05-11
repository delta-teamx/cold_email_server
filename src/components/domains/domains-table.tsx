import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DnsStatusToggle } from "./dns-status-toggles";
import { DeleteDomainButton } from "./delete-domain-button";
import { DomainStatusBadge } from "./domain-status-badge";
import { formatRelative } from "@/lib/utils";
import type { Tables } from "@/types/database";

interface Props {
  domains: Array<
    Pick<
      Tables<"domains">,
      | "id"
      | "root_domain"
      | "status"
      | "dkim_configured"
      | "spf_configured"
      | "dmarc_configured"
      | "registered_at"
      | "created_at"
    > & { inbox_count: number }
  >;
}

export function DomainsTable({ domains }: Props) {
  return (
    <div className="rounded-lg border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Domain</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>DNS</TableHead>
            <TableHead>Inboxes</TableHead>
            <TableHead>Added</TableHead>
            <TableHead className="w-12" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {domains.map((d) => (
            <TableRow key={d.id}>
              <TableCell className="font-medium">{d.root_domain}</TableCell>
              <TableCell>
                <DomainStatusBadge status={d.status} />
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap items-center gap-4">
                  <DnsStatusToggle
                    domainId={d.id}
                    flag="dkim_configured"
                    label="DKIM"
                    initial={d.dkim_configured}
                  />
                  <DnsStatusToggle
                    domainId={d.id}
                    flag="spf_configured"
                    label="SPF"
                    initial={d.spf_configured}
                  />
                  <DnsStatusToggle
                    domainId={d.id}
                    flag="dmarc_configured"
                    label="DMARC"
                    initial={d.dmarc_configured}
                  />
                </div>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {d.inbox_count}/3
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {formatRelative(d.created_at)}
              </TableCell>
              <TableCell>
                <DeleteDomainButton domainId={d.id} rootDomain={d.root_domain} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
