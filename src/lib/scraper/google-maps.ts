import { chromium, type Browser, type Page } from "playwright";
import type { RawLead, ScrapeOptions, ScrapeResult } from "./types";
import {
  dedupeLeads,
  parseRating,
  parseReviewCount,
} from "./normalize";

// =====================================================================
// Google Maps scraper
//
// IMPORTANT: Google rotates DOM details frequently and is aggressive about
// bot detection. Treat the selectors below as a starting point. The function
// is structured so each extraction step degrades gracefully — a missing
// selector returns null rather than crashing the whole run.
//
// Operate respectfully:
//   - Default `delayMs` of 1500ms between detail clicks
//   - Stop immediately if /sorry/, a CAPTCHA, or a consent gate is detected
//   - Do not run this against a target you don't have permission to scrape
//
// For production-scale scraping use a paid SERP API (SerpAPI, Apify) instead.
// =====================================================================

const DEFAULT_LIMIT = 100;
const DEFAULT_DELAY_MS = 1500;
const DEFAULT_USER_AGENT =
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

export async function scrapeGoogleMaps(
  options: ScrapeOptions,
): Promise<ScrapeResult> {
  const limit = options.limit ?? DEFAULT_LIMIT;
  const delayMs = options.delayMs ?? DEFAULT_DELAY_MS;
  const query = `${options.niche.trim()} in ${options.city.trim()}`;

  let browser: Browser | null = null;
  let attempted = 0;
  let blocked = false;
  const collected: RawLead[] = [];

  try {
    browser = await chromium.launch({ headless: !options.headed });
    const context = await browser.newContext({
      userAgent: options.userAgent ?? DEFAULT_USER_AGENT,
      viewport: { width: 1366, height: 900 },
      locale: "en-US",
    });
    const page = await context.newPage();

    const searchUrl = `https://www.google.com/maps/search/${encodeURIComponent(query)}/`;
    await page.goto(searchUrl, { waitUntil: "domcontentloaded", timeout: 30_000 });

    if (await detectBlock(page)) {
      return { query, leads: [], blocked: true, attempted: 0 };
    }

    await dismissConsentIfPresent(page);

    // Wait for the results feed to appear. Google sometimes drops you onto a
    // single-result detail panel for very specific queries — handle both.
    const feedSelector = 'div[role="feed"]';
    const hasFeed = await page
      .waitForSelector(feedSelector, { timeout: 15_000 })
      .then(() => true)
      .catch(() => false);

    const resultLinks = hasFeed
      ? await collectResultLinks(page, feedSelector, limit, async () => {
          if (await detectBlock(page)) blocked = true;
          return blocked;
        })
      : [];

    if (blocked) {
      return { query, leads: dedupeLeads(collected), blocked: true, attempted };
    }

    for (const href of resultLinks.slice(0, limit)) {
      if (blocked) break;
      attempted++;
      try {
        const lead = await extractDetail(page, href);
        if (lead) {
          collected.push(lead);
          options.onProgress?.(collected.length);
        }
      } catch {
        // Skip individual detail failures; continue with the next listing.
      }
      if (await detectBlock(page)) {
        blocked = true;
        break;
      }
      await page.waitForTimeout(delayMs);
    }
  } finally {
    if (browser) await browser.close().catch(() => {});
  }

  return { query, leads: dedupeLeads(collected), blocked, attempted };
}

async function dismissConsentIfPresent(page: Page): Promise<void> {
  // EU consent gates use a few different button labels; try the common ones.
  const labels = ["Accept all", "I agree", "Reject all", "Accept"];
  for (const label of labels) {
    const btn = page.getByRole("button", { name: label, exact: false });
    const count = await btn.count().catch(() => 0);
    if (count > 0) {
      await btn.first().click({ timeout: 3000 }).catch(() => {});
      await page.waitForLoadState("domcontentloaded").catch(() => {});
      return;
    }
  }
}

async function detectBlock(page: Page): Promise<boolean> {
  const url = page.url();
  if (url.includes("/sorry/") || url.includes("recaptcha")) return true;
  const body = await page
    .locator("body")
    .innerText({ timeout: 2000 })
    .catch(() => "");
  if (/unusual traffic|verify you're a human|i'm not a robot/i.test(body)) {
    return true;
  }
  return false;
}

async function collectResultLinks(
  page: Page,
  feedSelector: string,
  limit: number,
  onTick: () => Promise<boolean>,
): Promise<string[]> {
  const seen = new Set<string>();
  // Scroll the results feed until we've seen ~limit unique cards or no new
  // entries appear for two consecutive passes.
  let stagnantPasses = 0;
  while (seen.size < limit && stagnantPasses < 2) {
    if (await onTick()) break;
    const links = await page
      .locator(`${feedSelector} a[href*="/maps/place/"]`)
      .evaluateAll((els) =>
        els.map((el) => (el as HTMLAnchorElement).href).filter(Boolean),
      );
    const before = seen.size;
    for (const href of links) {
      if (seen.size >= limit) break;
      seen.add(href);
    }
    if (seen.size === before) {
      stagnantPasses++;
    } else {
      stagnantPasses = 0;
    }
    // Scroll the feed to load the next batch.
    await page
      .locator(feedSelector)
      .evaluate((el) => {
        el.scrollTop = el.scrollHeight;
      })
      .catch(() => {});
    await page.waitForTimeout(1200);
  }
  return [...seen];
}

async function extractDetail(page: Page, href: string): Promise<RawLead | null> {
  await page.goto(href, { waitUntil: "domcontentloaded", timeout: 30_000 });

  // Business name: first H1 in the detail panel.
  const name = await page
    .locator("h1")
    .first()
    .innerText({ timeout: 8000 })
    .catch(() => null);
  if (!name) return null;

  // Rating / review count live inside an [role="img"] aria-label like "4.6 stars".
  const ratingLabel = await page
    .locator('[role="img"][aria-label*="star"]')
    .first()
    .getAttribute("aria-label", { timeout: 2000 })
    .catch(() => null);
  const rating = parseRating(ratingLabel);

  const reviewText = await page
    .locator('button[aria-label*="reviews"], button[aria-label*="review"]')
    .first()
    .getAttribute("aria-label")
    .catch(() => null);
  const reviewCount = parseReviewCount(reviewText);

  const address = await readAria(page, 'button[data-item-id="address"]', "Address");
  const phone = await readAria(page, 'button[data-item-id^="phone:"]', "Phone");
  const website = await readHref(
    page,
    'a[data-item-id="authority"], a[aria-label*="Website"]',
  );

  // First 3 review snippets, if visible without a tab click.
  const review_snippets = await page
    .locator('[data-review-id] span[jsaction*="review"]')
    .allInnerTexts()
    .then((arr) => arr.slice(0, 3))
    .catch(() => [] as string[]);

  return {
    business_name: name.trim(),
    email: null, // Google Maps doesn't expose emails; enrichment happens later.
    phone,
    website,
    google_maps_url: page.url(),
    address,
    rating,
    review_count: reviewCount,
    review_snippets,
    hours_json: null,
  };
}

async function readAria(
  page: Page,
  selector: string,
  prefix: string,
): Promise<string | null> {
  const label = await page
    .locator(selector)
    .first()
    .getAttribute("aria-label", { timeout: 2000 })
    .catch(() => null);
  if (!label) return null;
  // Aria labels are typically "Address: 123 Main St" — strip the prefix.
  const stripped = label.replace(new RegExp(`^${prefix}:?\\s*`, "i"), "").trim();
  return stripped || null;
}

async function readHref(page: Page, selector: string): Promise<string | null> {
  return page
    .locator(selector)
    .first()
    .getAttribute("href", { timeout: 2000 })
    .catch(() => null);
}
