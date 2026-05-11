"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface unexpected errors during dev; production should ship to a logger.
    if (process.env.NODE_ENV === "development") {
      // eslint-disable-next-line no-console
      console.error(error);
    }
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <AlertTriangle className="size-10 text-destructive" />
      <div>
        <h2 className="text-lg font-semibold">Something went wrong.</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {error.message || "Unexpected error."}
        </p>
      </div>
      <Button onClick={reset} variant="secondary">
        Try again
      </Button>
    </div>
  );
}
