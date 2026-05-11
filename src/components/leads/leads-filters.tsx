"use client";

import { useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Props {
  campaigns: Array<{ id: string; name: string }>;
}

const LEAD_STATUSES = [
  "new",
  "called",
  "personalized",
  "queued",
  "sent",
  "replied",
  "bounced",
  "unsubscribed",
] as const;

const CALL_STATUSES = [
  "voicemail",
  "no_answer",
  "busy",
  "voicemail_full",
  "answered",
  "failed",
] as const;

export function LeadsFilters({ campaigns }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  function setParam(name: string, value: string | undefined) {
    const next = new URLSearchParams(searchParams.toString());
    if (value && value.length > 0) {
      next.set(name, value);
    } else {
      next.delete(name);
    }
    next.delete("page");
    startTransition(() => {
      router.replace(`${pathname}?${next.toString()}`);
    });
  }

  function onSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setParam("q", String(form.get("q") ?? "").trim());
  }

  function clearAll() {
    startTransition(() => router.replace(pathname));
  }

  const selectCls =
    "h-9 rounded-md border border-input bg-transparent px-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";
  const hasFilters = Array.from(searchParams.keys()).length > 0;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <form onSubmit={onSearch} className="relative">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute left-2 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          name="q"
          defaultValue={searchParams.get("q") ?? ""}
          placeholder="Search name, email, phone…"
          className="w-64 pl-8"
        />
      </form>

      <select
        aria-label="Filter by campaign"
        value={searchParams.get("campaign_id") ?? ""}
        onChange={(e) => setParam("campaign_id", e.target.value || undefined)}
        className={selectCls}
        disabled={pending}
      >
        <option value="">All campaigns</option>
        {campaigns.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>

      <select
        aria-label="Filter by status"
        value={searchParams.get("status") ?? ""}
        onChange={(e) => setParam("status", e.target.value || undefined)}
        className={selectCls}
        disabled={pending}
      >
        <option value="">All statuses</option>
        {LEAD_STATUSES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>

      <select
        aria-label="Filter by call result"
        value={searchParams.get("call_status") ?? ""}
        onChange={(e) => setParam("call_status", e.target.value || undefined)}
        className={selectCls}
        disabled={pending}
      >
        <option value="">All call results</option>
        {CALL_STATUSES.map((s) => (
          <option key={s} value={s}>
            {s.replace("_", " ")}
          </option>
        ))}
      </select>

      {hasFilters ? (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearAll}
          disabled={pending}
        >
          <X className="size-4" />
          Clear
        </Button>
      ) : null}
    </div>
  );
}
