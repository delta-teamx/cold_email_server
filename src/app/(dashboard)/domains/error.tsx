"use client";

import { RouteError } from "@/components/route-error";

export default function DomainsError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <RouteError scope="domains" {...props} />;
}
