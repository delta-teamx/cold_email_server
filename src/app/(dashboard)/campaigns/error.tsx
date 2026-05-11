"use client";

import { RouteError } from "@/components/route-error";

export default function CampaignsError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <RouteError scope="campaigns" {...props} />;
}
