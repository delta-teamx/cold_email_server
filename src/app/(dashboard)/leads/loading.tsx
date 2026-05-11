import { Skeleton } from "@/components/ui/skeleton";
import { TableSkeleton } from "@/components/skeletons/table-skeleton";

export default function Loading() {
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-[460px] max-w-full" />
      </header>
      <div className="flex flex-wrap gap-2">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-9 w-40" />
      </div>
      <TableSkeleton rows={8} columns={7} />
    </div>
  );
}
