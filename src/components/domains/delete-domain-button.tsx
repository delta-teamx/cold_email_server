"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function DeleteDomainButton({
  domainId,
  rootDomain,
}: {
  domainId: string;
  rootDomain: string;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function onClick() {
    if (!confirm(`Delete ${rootDomain}? This cannot be undone.`)) return;
    startTransition(async () => {
      const res = await fetch(`/api/domains/${domainId}`, { method: "DELETE" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        toast.error("Could not delete domain", {
          description: body.error ?? "Unknown error",
        });
        return;
      }
      toast.success(`Deleted ${rootDomain}`);
      router.refresh();
    });
  }

  return (
    <Button
      size="icon"
      variant="ghost"
      onClick={onClick}
      disabled={pending}
      aria-label={`Delete ${rootDomain}`}
    >
      <Trash2 className="size-4" />
    </Button>
  );
}
