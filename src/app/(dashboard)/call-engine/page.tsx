import { PhoneCall } from "lucide-react";
import { EmptyState } from "@/components/empty-state";

export const metadata = { title: "Call Engine — Outreach" };

export default function CallEnginePage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold">Call Engine</h1>
        <p className="text-sm text-muted-foreground">
          Twilio-driven ping calls. Single attempt per lead, hang up within
          2 seconds of any answer, log the result, and route the lead into
          the matching email angle.
        </p>
      </header>
      <EmptyState
        icon={PhoneCall}
        title="Call Engine activates in Phase 3"
        description="The live call queue, per-day stats, and TCPA-safe windowing (9 AM–5 PM local, no weekends, no voicemails) ship in Week 2 of the build."
      />
    </div>
  );
}
