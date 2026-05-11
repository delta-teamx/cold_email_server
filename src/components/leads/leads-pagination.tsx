"use client";

import Link from "next/link";
import { useSearchParams, usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  page: number;
  pageSize: number;
  total: number;
}

export function LeadsPagination({ page, pageSize, total }: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastPage = Math.max(1, Math.ceil(total / pageSize));
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  function hrefFor(targetPage: number): string {
    const next = new URLSearchParams(searchParams.toString());
    if (targetPage <= 1) next.delete("page");
    else next.set("page", String(targetPage));
    const qs = next.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  }

  const canPrev = page > 1;
  const canNext = page < lastPage;

  return (
    <div className="flex items-center justify-between gap-4 text-sm text-muted-foreground">
      <span>
        {total === 0
          ? "0 results"
          : `Showing ${start}–${end} of ${total.toLocaleString()}`}
      </span>
      <div className="flex items-center gap-2">
        <Button
          asChild={canPrev}
          size="sm"
          variant="outline"
          disabled={!canPrev}
        >
          {canPrev ? (
            <Link href={hrefFor(page - 1)} aria-label="Previous page">
              <ChevronLeft className="size-4" />
              Prev
            </Link>
          ) : (
            <span aria-disabled="true">
              <ChevronLeft className="size-4" />
              Prev
            </span>
          )}
        </Button>
        <span className="tabular-nums">
          {page} / {lastPage}
        </span>
        <Button
          asChild={canNext}
          size="sm"
          variant="outline"
          disabled={!canNext}
        >
          {canNext ? (
            <Link href={hrefFor(page + 1)} aria-label="Next page">
              Next
              <ChevronRight className="size-4" />
            </Link>
          ) : (
            <span aria-disabled="true">
              Next
              <ChevronRight className="size-4" />
            </span>
          )}
        </Button>
      </div>
    </div>
  );
}
