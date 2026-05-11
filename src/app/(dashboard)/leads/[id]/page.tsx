import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Globe,
  MapPin,
  Mail,
  Phone,
  Star,
} from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LeadStatusBadge } from "@/components/leads/lead-status-badge";
import { formatRelative } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("leads")
    .select("*, campaign:campaigns(id, name, niche, city)")
    .eq("id", id)
    .single();

  if (error || !data) {
    notFound();
  }

  const campaign = data.campaign;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm">
          <Link href="/leads">
            <ArrowLeft className="size-4" />
            Back to leads
          </Link>
        </Button>
      </div>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            {data.business_name}
          </h1>
          <p className="text-sm text-muted-foreground">
            {campaign ? (
              <Link
                href={`/campaigns`}
                className="hover:underline"
              >
                {campaign.name}
              </Link>
            ) : (
              "Unassigned"
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <LeadStatusBadge status={data.status} />
          {data.email_track ? (
            <Badge variant="info">{data.email_track.replace("_", " ")}</Badge>
          ) : null}
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Contact</CardTitle>
            <CardDescription>
              From the scraper. Click-to-mail and click-to-call where supported.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <FieldRow icon={Mail} label="Email">
              {data.email ? (
                <a
                  href={`mailto:${data.email}`}
                  className="font-medium hover:underline"
                >
                  {data.email}
                </a>
              ) : (
                <span className="text-muted-foreground">Not on file</span>
              )}
            </FieldRow>
            <FieldRow icon={Phone} label="Phone">
              {data.phone ? (
                <a
                  href={`tel:${data.phone}`}
                  className="font-medium hover:underline"
                >
                  {data.phone}
                </a>
              ) : (
                <span className="text-muted-foreground">Not on file</span>
              )}
            </FieldRow>
            <FieldRow icon={Globe} label="Website">
              {data.website ? (
                <a
                  href={data.website}
                  target="_blank"
                  rel="noreferrer"
                  className="break-all font-medium hover:underline"
                >
                  {data.website}
                </a>
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </FieldRow>
            <FieldRow icon={MapPin} label="Google Maps">
              {data.google_maps_url ? (
                <a
                  href={data.google_maps_url}
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium hover:underline"
                >
                  Open listing
                </a>
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </FieldRow>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Signal</CardTitle>
            <CardDescription>
              Public reputation and the call + email lifecycle so far.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <FieldRow icon={Star} label="Rating">
              {data.rating != null ? (
                <span className="tabular-nums">
                  {data.rating.toFixed(1)}{" "}
                  <span className="text-muted-foreground">
                    ({data.review_count ?? 0} reviews)
                  </span>
                </span>
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </FieldRow>
            <div className="grid grid-cols-2 gap-3">
              <Stat label="Scraped" value={formatRelative(data.scraped_at)} />
              <Stat
                label="Called"
                value={
                  data.called_at ? formatRelative(data.called_at) : "—"
                }
              />
              <Stat
                label="Call result"
                value={
                  data.call_status ? data.call_status.replace("_", " ") : "—"
                }
              />
              <Stat
                label="Sent"
                value={data.sent_at ? formatRelative(data.sent_at) : "—"}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {(data.review_snippets ?? []).length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent reviews</CardTitle>
            <CardDescription>
              Pulled by the scraper to seed personalization later.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {(data.review_snippets ?? []).map((snippet, i) => (
                <li
                  key={i}
                  className="rounded-md border border-border bg-muted/30 p-3 text-sm"
                >
                  {snippet}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

function FieldRow({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof Mail;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon aria-hidden="true" className="mt-0.5 size-4 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <div className="text-xs uppercase tracking-wide text-muted-foreground">
          {label}
        </div>
        <div className="mt-0.5 break-words">{children}</div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-md border border-border bg-muted/30 px-3 py-2">
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="mt-0.5 text-sm">{value}</div>
    </div>
  );
}
