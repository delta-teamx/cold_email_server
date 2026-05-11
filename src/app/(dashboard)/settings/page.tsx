import { Settings } from "lucide-react";
import { EmptyState } from "@/components/empty-state";

export const metadata = { title: "Settings — Outreach" };

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground">
          API keys (Twilio, Instantly, Anthropic), business hours,
          signature templates, and global send rules.
        </p>
      </header>
      <EmptyState
        icon={Settings}
        title="Settings panel arrives with integrations"
        description="Once Twilio, Instantly, and Anthropic are wired up in Phase 3, you'll configure API keys, send windows, and signature templates here."
      />
    </div>
  );
}
