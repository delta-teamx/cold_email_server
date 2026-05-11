import Link from "next/link";
import { Mail } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { AddInboxDialog } from "@/components/inboxes/add-inbox-dialog";
import { InboxesTable } from "@/components/inboxes/inboxes-table";

export const metadata = { title: "Inboxes — Outreach" };
export const dynamic = "force-dynamic";

export default async function InboxesPage() {
  const supabase = await createSupabaseServerClient();

  const [{ data: inboxes, error: inboxErr }, { data: domains, error: domainErr }] =
    await Promise.all([
      supabase
        .from("inboxes")
        .select("*, domain:domains(id, root_domain)")
        .order("created_at", { ascending: false }),
      supabase.from("domains").select("id, root_domain"),
    ]);

  if (inboxErr) throw new Error(inboxErr.message);
  if (domainErr) throw new Error(domainErr.message);

  const inboxCounts = new Map<string, number>();
  for (const i of inboxes ?? []) {
    inboxCounts.set(i.domain_id, (inboxCounts.get(i.domain_id) ?? 0) + 1);
  }
  const domainsWithCounts = (domains ?? []).map((d) => ({
    ...d,
    inbox_count: inboxCounts.get(d.id) ?? 0,
  }));

  const hasDomains = domainsWithCounts.length > 0;
  const rows = inboxes ?? [];

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Inboxes</h1>
          <p className="text-sm text-muted-foreground">
            All sending inboxes across your domains. Warming → ramping → active
            is driven by warmup age; daily limits cap at 20/inbox/day.
          </p>
        </div>
        {hasDomains ? (
          <AddInboxDialog domains={domainsWithCounts} />
        ) : null}
      </header>

      {!hasDomains ? (
        <EmptyState
          icon={Mail}
          title="Add a domain first"
          description="Inboxes are attached to a root domain. Set one up on the Domains page before adding inboxes."
          action={
            <Button asChild>
              <Link href="/domains">Go to Domains</Link>
            </Button>
          }
        />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={Mail}
          title="No inboxes yet"
          description="Add your first inbox. After Instantly warmup is running, hit ‘Start warmup clock’ so the platform begins counting toward ramping."
          action={<AddInboxDialog domains={domainsWithCounts} />}
        />
      ) : (
        <InboxesTable inboxes={rows} />
      )}
    </div>
  );
}
