import { Users } from "lucide-react";
import { Suspense } from "react";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/empty-state";
import { LeadsFilters } from "@/components/leads/leads-filters";
import { LeadsTable } from "@/components/leads/leads-table";
import { LeadsPagination } from "@/components/leads/leads-pagination";

export const metadata = { title: "Leads — Outreach" };
export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

const searchSchema = z.object({
  campaign_id: z.string().uuid().optional(),
  status: z
    .enum([
      "new",
      "called",
      "personalized",
      "queued",
      "sent",
      "replied",
      "bounced",
      "unsubscribed",
    ])
    .optional(),
  call_status: z
    .enum([
      "voicemail",
      "no_answer",
      "busy",
      "voicemail_full",
      "answered",
      "failed",
    ])
    .optional(),
  email_track: z
    .enum(["voicemail_angle", "strong_desk_angle", "excluded"])
    .optional(),
  q: z.string().max(120).optional(),
  page: z.coerce.number().int().min(1).default(1),
});

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = await searchParams;
  const flat = Object.fromEntries(
    Object.entries(raw).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]),
  );
  const filters = searchSchema.parse(flat);

  const supabase = await createSupabaseServerClient();

  const { data: campaigns } = await supabase
    .from("campaigns")
    .select("id, name")
    .order("created_at", { ascending: false });

  const from = (filters.page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = supabase
    .from("leads")
    .select(
      "id, business_name, email, phone, status, call_status, email_track, rating, review_count, scraped_at",
      { count: "exact" },
    )
    .order("scraped_at", { ascending: false })
    .range(from, to);

  if (filters.campaign_id) query = query.eq("campaign_id", filters.campaign_id);
  if (filters.status) query = query.eq("status", filters.status);
  if (filters.call_status) query = query.eq("call_status", filters.call_status);
  if (filters.email_track) query = query.eq("email_track", filters.email_track);
  if (filters.q && filters.q.trim()) {
    const term = filters.q.trim().replace(/[%_]/g, "\\$&");
    query = query.or(
      `business_name.ilike.%${term}%,email.ilike.%${term}%,phone.ilike.%${term}%`,
    );
  }

  const { data: leads, error, count } = await query;
  if (error) throw new Error(error.message);

  const total = count ?? 0;
  const hasAnyCampaign = (campaigns ?? []).length > 0;
  const hasResults = (leads ?? []).length > 0;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold">Leads</h1>
        <p className="text-sm text-muted-foreground">
          Every scraped business across every campaign. Filter, search, and
          drill in. Scraping comes online in the next iteration.
        </p>
      </header>

      {!hasAnyCampaign ? (
        <EmptyState
          icon={Users}
          title="No campaigns yet"
          description="Leads attach to campaigns. Create a campaign first, then add or scrape leads into it."
        />
      ) : (
        <>
          <Suspense fallback={null}>
            <LeadsFilters campaigns={campaigns ?? []} />
          </Suspense>

          {hasResults ? (
            <>
              <LeadsTable leads={leads ?? []} />
              <Suspense fallback={null}>
                <LeadsPagination
                  page={filters.page}
                  pageSize={PAGE_SIZE}
                  total={total}
                />
              </Suspense>
            </>
          ) : (
            <EmptyState
              icon={Users}
              title="No leads match these filters"
              description="Adjust filters above, or wait for the scraper to populate this campaign."
            />
          )}
        </>
      )}
    </div>
  );
}
