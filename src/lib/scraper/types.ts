/**
 * Shapes returned by the scraper before they're persisted as `leads` rows.
 * Keep this independent of `Tables<"leads">` so the scraper module can be
 * reused (CSV import, third-party data feeds, etc.).
 */
export interface RawLead {
  business_name: string;
  email: string | null;
  phone: string | null;
  website: string | null;
  google_maps_url: string | null;
  address: string | null;
  rating: number | null;
  review_count: number | null;
  review_snippets: string[];
  hours_json: Record<string, string> | null;
}

export interface ScrapeOptions {
  /** What you'd type into Google Maps, e.g. "Dentists in Phoenix, AZ". */
  niche: string;
  city: string;
  /** Hard cap on the number of unique businesses to extract. Defaults to 100. */
  limit?: number;
  /** Where Playwright will resolve relative chromium path. Headed is useful for debugging. */
  headed?: boolean;
  /** Milliseconds to wait between detail visits, to look human. */
  delayMs?: number;
  /** Optional override of the user-agent string. */
  userAgent?: string;
  /** Receives progress updates (count of leads pulled so far). */
  onProgress?: (count: number) => void;
}

export interface ScrapeResult {
  query: string;
  leads: RawLead[];
  /** True if Google blocked us mid-run (CAPTCHA / sorry page / consent gate). */
  blocked: boolean;
  /** Total number of detail panels we attempted to extract. */
  attempted: number;
}
