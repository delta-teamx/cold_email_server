import { Megaphone } from "lucide-react";
import { EmptyState } from "@/components/empty-state";

export const metadata = { title: "Campaigns — Outreach" };

export default function CampaignsPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold">Campaigns</h1>
        <p className="text-sm text-muted-foreground">
          One campaign = one niche + one US city (e.g. &ldquo;Dentists in
          Phoenix&rdquo;). Each campaign owns its lead list and the two email
          template variants (voicemail-angle, strong-desk-angle).
        </p>
      </header>
      <EmptyState
        icon={Megaphone}
        title="Campaign builder lands in Phase 2"
        description="Once scraping is online, you'll create a campaign by picking a niche + city, choose your daily lead target, and Playwright will pull 100–300 Google Maps results."
      />
    </div>
  );
}
