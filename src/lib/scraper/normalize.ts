import type { RawLead } from "./types";

/**
 * Pure normalization / dedup helpers for scraped leads.
 *
 * - Strips formatting from phone numbers; keeps a leading "+" if present.
 * - Lowercases emails.
 * - Drops null-y duplicate keys when computing dedup signature.
 * - Dedupes a batch of raw leads in-place (last wins on conflict so that
 *   a richer subsequent extraction overwrites a sparser earlier one).
 */

export function normalizePhone(input: string | null | undefined): string | null {
  if (!input) return null;
  const trimmed = input.trim();
  if (!trimmed) return null;
  const hasPlus = trimmed.startsWith("+");
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length < 7) return null;
  return hasPlus ? `+${digits}` : digits;
}

export function normalizeEmail(input: string | null | undefined): string | null {
  if (!input) return null;
  const trimmed = input.trim().toLowerCase();
  // Cheap sanity: must contain "@" and a dot in the domain.
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return null;
  return trimmed;
}

export function normalizeUrl(input: string | null | undefined): string | null {
  if (!input) return null;
  const trimmed = input.trim();
  if (!trimmed) return null;
  try {
    // Accept bare hostnames like "example.com" by prefixing https://
    const candidate = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    const u = new URL(candidate);
    // Strip Google Maps redirector URLs to the underlying destination if present.
    const gmRedirect = u.searchParams.get("q") ?? u.searchParams.get("url");
    if (
      gmRedirect &&
      (u.hostname.endsWith("google.com") || u.hostname.endsWith("google.co"))
    ) {
      return normalizeUrl(gmRedirect);
    }
    return u.toString();
  } catch {
    return null;
  }
}

export function normalizeLead(raw: RawLead): RawLead {
  return {
    ...raw,
    business_name: raw.business_name.trim(),
    email: normalizeEmail(raw.email),
    phone: normalizePhone(raw.phone),
    website: normalizeUrl(raw.website),
    google_maps_url: normalizeUrl(raw.google_maps_url),
    address: raw.address?.trim() ?? null,
    review_snippets: raw.review_snippets
      .map((s) => s.trim())
      .filter((s) => s.length > 0),
  };
}

/**
 * Signature used for deduplication. Prefer Google Maps URL (canonical), then
 * email, then phone, then a normalized name+address combo.
 */
export function dedupeKey(lead: RawLead): string {
  if (lead.google_maps_url) return `gmap:${lead.google_maps_url}`;
  if (lead.email) return `email:${lead.email}`;
  if (lead.phone) return `phone:${lead.phone}`;
  const slug = `${lead.business_name}|${lead.address ?? ""}`
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
  return `slug:${slug}`;
}

export function dedupeLeads(leads: RawLead[]): RawLead[] {
  const byKey = new Map<string, RawLead>();
  for (const raw of leads) {
    const normalized = normalizeLead(raw);
    const key = dedupeKey(normalized);
    byKey.set(key, normalized);
  }
  return [...byKey.values()];
}

/**
 * Parse a rating string emitted by Google Maps (e.g. "4.6", "4,6", or "4.6 stars").
 * Returns null if no valid float is present or it's outside the 0..5 range.
 */
export function parseRating(input: string | null | undefined): number | null {
  if (!input) return null;
  const match = input.replace(",", ".").match(/(\d+(?:\.\d+)?)/);
  if (!match) return null;
  const n = parseFloat(match[1]);
  if (Number.isNaN(n) || n < 0 || n > 5) return null;
  return n;
}

/**
 * Parse a review count from strings like "(1,234)" or "1.2K reviews".
 */
export function parseReviewCount(input: string | null | undefined): number | null {
  if (!input) return null;
  const cleaned = input.replace(/[(),]/g, "").trim();
  const kMatch = cleaned.match(/(\d+(?:\.\d+)?)\s*[kK]/);
  if (kMatch) {
    return Math.round(parseFloat(kMatch[1]) * 1000);
  }
  const match = cleaned.match(/(\d+)/);
  if (!match) return null;
  const n = parseInt(match[1], 10);
  if (Number.isNaN(n) || n < 0) return null;
  return n;
}
