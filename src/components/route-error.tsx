"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  /** Human label of the route, e.g. "domains". */
  scope: string;
  error: Error & { digest?: string };
  reset: () => void;
}

export function RouteError({ scope, error, reset }: Props) {
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.error(`[${scope}]`, error);
    }
  }, [scope, error]);

  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center gap-4 rounded-lg border border-destructive/40 bg-destructive/5 px-6 py-16 text-center"
    >
      <AlertTriangle className="size-8 text-destructive" />
      <div className="max-w-md">
        <h2 className="text-base font-semibold">
          Could not load {scope}.
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {error.message || "An unexpected error occurred."}
          {error.digest ? (
            <span className="ml-1 font-mono text-xs">({error.digest})</span>
          ) : null}
        </p>
      </div>
      <Button onClick={reset} variant="secondary">
        <RotateCw className="size-4" />
        Try again
      </Button>
    </div>
  );
}
