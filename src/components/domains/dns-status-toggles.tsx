"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

type Flag = "dkim_configured" | "spf_configured" | "dmarc_configured";

interface Props {
  domainId: string;
  flag: Flag;
  label: string;
  initial: boolean;
}

export function DnsStatusToggle({ domainId, flag, label, initial }: Props) {
  const [checked, setChecked] = useState(initial);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function onChange(next: boolean) {
    const prev = checked;
    setChecked(next);
    startTransition(async () => {
      const res = await fetch(`/api/domains/${domainId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [flag]: next }),
      });
      if (!res.ok) {
        setChecked(prev);
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        toast.error(`Failed to update ${label}`, {
          description: body.error ?? "Unknown error",
        });
        return;
      }
      router.refresh();
    });
  }

  return (
    <label className="flex items-center gap-2 text-xs">
      <Switch
        checked={checked}
        onCheckedChange={onChange}
        disabled={pending}
        aria-label={label}
      />
      <span
        className={cn(
          "font-medium uppercase tracking-wide",
          checked ? "text-emerald-400" : "text-muted-foreground",
        )}
      >
        {label}
      </span>
    </label>
  );
}
