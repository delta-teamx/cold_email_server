"use client";

import { RouteError } from "@/components/route-error";

export default function LeadsError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <RouteError scope="leads" {...props} />;
}
