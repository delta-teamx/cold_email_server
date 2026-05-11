import { KanbanSquare } from "lucide-react";
import { EmptyState } from "@/components/empty-state";

export const metadata = { title: "Pipeline — Outreach" };

export default function PipelinePage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold">Pipeline</h1>
        <p className="text-sm text-muted-foreground">
          Kanban board: New Reply → Qualifying → Demo Booked → Closed Won /
          Lost. Drag deals between stages as conversations progress.
        </p>
      </header>
      <EmptyState
        icon={KanbanSquare}
        title="Pipeline opens in Phase 5"
        description="Each interested reply automatically creates a deal card here. You'll drag-and-drop between stages and track demo bookings and MRR."
      />
    </div>
  );
}
