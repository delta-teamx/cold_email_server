import { Megaphone } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/empty-state";
import { AddCampaignDialog } from "@/components/campaigns/add-campaign-dialog";
import { CampaignsTable } from "@/components/campaigns/campaigns-table";

export const metadata = { title: "Campaigns — Outreach" };
export const dynamic = "force-dynamic";

export default async function CampaignsPage() {
  const supabase = await createSupabaseServerClient();

  const [{ data: campaigns, error: cErr }, { data: leads, error: lErr }] =
    await Promise.all([
      supabase
        .from("campaigns")
        .select("id, name, niche, city, status, created_at")
        .order("created_at", { ascending: false }),
      supabase.from("leads").select("campaign_id"),
    ]);

  if (cErr) throw new Error(cErr.message);
  if (lErr) throw new Error(lErr.message);

  const counts = new Map<string, number>();
  for (const l of leads ?? []) {
    counts.set(l.campaign_id, (counts.get(l.campaign_id) ?? 0) + 1);
  }
  const rows = (campaigns ?? []).map((c) => ({
    ...c,
    lead_count: counts.get(c.id) ?? 0,
  }));

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Campaigns</h1>
          <p className="text-sm text-muted-foreground">
            One campaign = one niche + one US city. Each owns its own lead
            list and per-track email templates.
          </p>
        </div>
        <AddCampaignDialog />
      </header>

      {rows.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title="No campaigns yet"
          description="Create your first campaign (e.g. ‘Dentists in Phoenix’). Once Phase 2's scraper lands, you'll be able to populate it with 100–300 Google Maps leads in one go."
          action={<AddCampaignDialog />}
        />
      ) : (
        <CampaignsTable campaigns={rows} />
      )}
    </div>
  );
}
