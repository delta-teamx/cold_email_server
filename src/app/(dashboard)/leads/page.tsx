import { Users } from "lucide-react";
import { EmptyState } from "@/components/empty-state";

export const metadata = { title: "Leads — Outreach" };

export default function LeadsPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold">Leads</h1>
        <p className="text-sm text-muted-foreground">
          Every scraped business across every campaign. Filter by status,
          call result, or email track. Phase 2 wires this up to the scraper.
        </p>
      </header>
      <EmptyState
        icon={Users}
        title="No leads yet"
        description="Leads appear here once the Playwright scraper runs against a campaign. You'll see business name, contact info, Google Maps rating, and the call/email lifecycle for each row."
      />
    </div>
  );
}
