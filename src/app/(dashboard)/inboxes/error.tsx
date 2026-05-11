"use client";

import { RouteError } from "@/components/route-error";

export default function InboxesError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <RouteError scope="inboxes" {...props} />;
}
