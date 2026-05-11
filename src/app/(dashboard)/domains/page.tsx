import { Globe } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/empty-state";
import { AddDomainDialog } from "@/components/domains/add-domain-dialog";
import { DomainsTable } from "@/components/domains/domains-table";

export const metadata = { title: "Domains — Outreach" };
export const dynamic = "force-dynamic";

export default async function DomainsPage() {
  const supabase = await createSupabaseServerClient();

  const [{ data: domains, error: domainsError }, { data: inboxes }] =
    await Promise.all([
      supabase
        .from("domains")
        .select(
          "id, root_domain, status, dkim_configured, spf_configured, dmarc_configured, registered_at, created_at",
        )
        .order("created_at", { ascending: false }),
      supabase.from("inboxes").select("domain_id"),
    ]);

  if (domainsError) {
    throw new Error(domainsError.message);
  }

  const countsByDomain = new Map<string, number>();
  for (const i of inboxes ?? []) {
    countsByDomain.set(i.domain_id, (countsByDomain.get(i.domain_id) ?? 0) + 1);
  }

  const rows = (domains ?? []).map((d) => ({
    ...d,
    inbox_count: countsByDomain.get(d.id) ?? 0,
  }));

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Domains</h1>
          <p className="text-sm text-muted-foreground">
            Root domains used for cold sending. Cap of 3 inboxes per domain.
            Configure DKIM, SPF, and DMARC on each before warming inboxes.
          </p>
        </div>
        <AddDomainDialog />
      </header>

      {rows.length === 0 ? (
        <EmptyState
          icon={Globe}
          title="No domains yet"
          description="Add your first sending domain (e.g. tryyouragency.com). You'll attach up to 3 inboxes per domain and toggle DKIM/SPF/DMARC as DNS propagates."
          action={<AddDomainDialog />}
        />
      ) : (
        <DomainsTable domains={rows} />
      )}
    </div>
  );
}
