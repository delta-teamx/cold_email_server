import { Inbox } from "lucide-react";
import { EmptyState } from "@/components/empty-state";

export const metadata = { title: "Inbox — Outreach" };

export default function UnifiedInboxPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold">Inbox</h1>
        <p className="text-sm text-muted-foreground">
          Every reply from every sending inbox, in one thread view. Replies
          are auto-classified by Claude Haiku (interested / question /
          unsubscribe / OOO / not-interested) and an AI draft response is
          ready for one-click send.
        </p>
      </header>
      <EmptyState
        icon={Inbox}
        title="Unified inbox lands in Phase 5"
        description="Once IMAP listening is wired up, replies stream in here in real time and you get an email ping the moment a hot lead replies."
      />
    </div>
  );
}
