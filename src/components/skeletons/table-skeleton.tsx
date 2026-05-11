import { Skeleton } from "@/components/ui/skeleton";

interface Props {
  rows?: number;
  columns?: number;
}

export function TableSkeleton({ rows = 5, columns = 5 }: Props) {
  return (
    <div
      className="rounded-lg border border-border bg-card"
      role="status"
      aria-label="Loading"
    >
      <div className="border-b border-border/60 px-4 py-3">
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={i} className="h-3 w-20" />
          ))}
        </div>
      </div>
      <div className="divide-y divide-border/60">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="px-4 py-4">
            <div className="grid items-center gap-4" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
              {Array.from({ length: columns }).map((_, c) => (
                <Skeleton key={c} className="h-4 w-full max-w-[180px]" />
              ))}
            </div>
          </div>
        ))}
      </div>
      <span className="sr-only">Loading data…</span>
    </div>
  );
}
