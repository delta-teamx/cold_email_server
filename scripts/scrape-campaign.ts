#!/usr/bin/env tsx
/**
 * Scrape Google Maps into a campaign.
 *
 * Usage:
 *   npm run scrape -- --campaign <uuid> [--limit 100] [--headed] [--delay 1500]
 *   npm run scrape -- --niche "Dentists" --city "Phoenix" [--name "..."]
 *
 * When --campaign is omitted, the script creates a new campaign from
 * --niche and --city before scraping.
 *
 * Auth: uses SUPABASE_SERVICE_ROLE_KEY from .env.local — bypasses RLS.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { scrapeGoogleMaps } from "../src/lib/scraper/google-maps";
import type { Database } from "../src/types/database";
import type { RawLead } from "../src/lib/scraper/types";

// --- Lightweight .env.local loader (avoids adding dotenv) -----------------
function loadDotenv(path: string): void {
  try {
    const raw = readFileSync(path, "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq <= 0) continue;
      const key = trimmed.slice(0, eq).trim();
      let val = trimmed.slice(eq + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      if (!(key in process.env)) {
        process.env[key] = val;
      }
    }
  } catch {
    // .env.local not present — fall back to whatever's already in env.
  }
}
loadDotenv(resolve(process.cwd(), ".env.local"));

// --- Argument parsing ----------------------------------------------------
interface Args {
  campaign?: string;
  niche?: string;
  city?: string;
  name?: string;
  limit: number;
  delay: number;
  headed: boolean;
}

function parseArgs(argv: string[]): Args {
  const out: Args = { limit: 100, delay: 1500, headed: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const next = () => argv[++i];
    switch (arg) {
      case "--campaign":
        out.campaign = next();
        break;
      case "--niche":
        out.niche = next();
        break;
      case "--city":
        out.city = next();
        break;
      case "--name":
        out.name = next();
        break;
      case "--limit":
        out.limit = Math.max(1, parseInt(next() ?? "100", 10));
        break;
      case "--delay":
        out.delay = Math.max(0, parseInt(next() ?? "1500", 10));
        break;
      case "--headed":
        out.headed = true;
        break;
      case "--help":
      case "-h":
        printHelp();
        process.exit(0);
    }
  }
  return out;
}

function printHelp(): void {
  console.log(`
scrape-campaign — scrape Google Maps into a campaign

Required:
  --campaign <uuid>          Existing campaign id, OR
  --niche <text>  --city <text>   Auto-create a new campaign

Options:
  --name <text>              Display name (default: "\${niche} in \${city}")
  --limit <n>                Cap on businesses to extract (default 100)
  --delay <ms>               Pause between detail visits (default 1500)
  --headed                   Run in headed mode to debug visually
  --help, -h                 Show this message
`);
}

// --- Main ----------------------------------------------------------------
async function main() {
  const args = parseArgs(process.argv.slice(2));
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    console.error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local",
    );
    process.exit(1);
  }

  const supabase = createClient<Database>(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  let campaignId = args.campaign;
  let niche = args.niche;
  let city = args.city;

  if (!campaignId) {
    if (!niche || !city) {
      console.error("Provide either --campaign <uuid> or both --niche and --city.");
      printHelp();
      process.exit(1);
    }
    const name = args.name ?? `${niche} in ${city}`;
    const { data, error } = await supabase
      .from("campaigns")
      .insert({ name, niche, city })
      .select("id")
      .single();
    if (error || !data) {
      console.error("Could not create campaign:", error?.message);
      process.exit(1);
    }
    campaignId = data.id;
    console.log(`Created campaign ${campaignId} — "${name}"`);
  } else {
    const { data, error } = await supabase
      .from("campaigns")
      .select("id, niche, city, name")
      .eq("id", campaignId)
      .single();
    if (error || !data) {
      console.error(`Campaign ${campaignId} not found`);
      process.exit(1);
    }
    niche = niche ?? data.niche;
    city = city ?? data.city;
    console.log(`Scraping into "${data.name}" (${data.niche} / ${data.city})`);
  }

  console.log(
    `Launching scraper — limit=${args.limit}, delay=${args.delay}ms, headed=${args.headed}`,
  );

  let lastProgress = 0;
  const result = await scrapeGoogleMaps({
    niche: niche!,
    city: city!,
    limit: args.limit,
    delayMs: args.delay,
    headed: args.headed,
    onProgress: (n) => {
      if (n - lastProgress >= 5 || n === args.limit) {
        process.stdout.write(`  …${n} leads so far\n`);
        lastProgress = n;
      }
    },
  });

  if (result.blocked) {
    console.error(
      `! Google blocked the session after ${result.attempted} attempts. Saving the ${result.leads.length} leads we managed to extract.`,
    );
  } else {
    console.log(
      `Scrape complete — ${result.leads.length} unique leads from ${result.attempted} attempts`,
    );
  }

  if (result.leads.length === 0) {
    process.exit(result.blocked ? 2 : 0);
  }

  const insertedCount = await insertLeads(supabase, campaignId, result.leads);
  console.log(
    `Inserted ${insertedCount}/${result.leads.length} new leads (rest were duplicates already in this campaign).`,
  );
}

async function insertLeads(
  supabase: ReturnType<typeof createClient<Database>>,
  campaignId: string,
  leads: RawLead[],
): Promise<number> {
  let inserted = 0;
  // Insert in chunks of 50 to keep payloads small and surface partial failures.
  const CHUNK = 50;
  for (let i = 0; i < leads.length; i += CHUNK) {
    const slice = leads.slice(i, i + CHUNK).map((l) => ({
      campaign_id: campaignId,
      business_name: l.business_name,
      email: l.email,
      phone: l.phone,
      website: l.website,
      google_maps_url: l.google_maps_url,
      rating: l.rating,
      review_count: l.review_count,
      review_snippets: l.review_snippets.length > 0 ? l.review_snippets : null,
      hours_json: l.hours_json ?? null,
    }));

    const { data, error } = await supabase
      .from("leads")
      .upsert(slice, {
        onConflict: "email",
        ignoreDuplicates: true,
      })
      .select("id");

    if (error) {
      console.error(`Insert error on chunk ${i / CHUNK + 1}:`, error.message);
      continue;
    }
    inserted += data?.length ?? 0;
  }
  return inserted;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
