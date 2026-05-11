# outreach-platform

AI Receptionist outreach system — single-platform pipeline: scrape → call-ping → personalize → send → reply → book. Built per `PROJECT_SPEC.md`.

**Phase 1 (this commit):** Next.js 15 + Supabase scaffold, magic-link auth (single-user allowlist), full database schema, Domains and Inboxes CRUD with the warming → ramping → active state machine and a cron endpoint to drive it.

Stack: Next.js 15 (App Router, TypeScript) · Tailwind v4 · shadcn/ui · Supabase (Postgres + Auth) · Zod.

---

## Prerequisites

| Tool | Why |
|------|-----|
| Node.js ≥ 20 | Next.js 15 + React 19 |
| Supabase CLI (`brew install supabase/tap/supabase` or [other installers](https://supabase.com/docs/guides/local-development/cli/getting-started)) | Runs Postgres + Auth + Inbucket locally |
| Docker Desktop (running) | Required by `supabase start` |

---

## Setup

### 1. Clone & install

```bash
git clone <this-repo> outreach-platform
cd outreach-platform
npm install
```

### 2. Start local Supabase

```bash
supabase start
```

This boots Postgres on `:54322`, the API gateway on `:54321`, Studio on `:54323`, and the Inbucket mail catcher on `:54324`. The CLI prints the local anon key and service-role key — copy them in the next step.

### 3. Configure environment

```bash
cp .env.local.example .env.local
```

Fill `.env.local`:

| Var | Value |
|-----|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `http://127.0.0.1:54321` (local default) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | From `supabase start` output |
| `SUPABASE_SERVICE_ROLE_KEY` | From `supabase start` output |
| `ADMIN_EMAIL` | The **only** email allowed to sign in (e.g. `ja2413059@gmail.com`) |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` |
| `CRON_SECRET` | Any long random string. Required to call `/api/cron/*`. |

### 4. Apply the schema

The Supabase CLI auto-applies migrations on `start` and on `db reset`. If you need to re-apply manually:

```bash
supabase db reset      # nukes local DB, replays supabase/migrations/*
```

### 5. (Optional) Regenerate database types

`src/types/database.ts` is checked in and hand-mirrors the migration so the app type-checks immediately. To regenerate from your live local schema:

```bash
npm run db:types
```

### 6. Run the app

```bash
npm run dev
```

Open <http://localhost:3000> → you'll be redirected to `/login`.

### 7. Sign in

1. Enter `ADMIN_EMAIL` on the login page.
2. Magic link is sent. Locally it lands in **Inbucket** at <http://127.0.0.1:54324>.
3. Click the link → callback exchanges the code, re-verifies the allowlist, and drops you on `/domains`.

Any email other than `ADMIN_EMAIL` is rejected at the magic-link request step **and** the callback step.

---

## Going to production (cloud Supabase)

1. Create a project at <https://supabase.com>.
2. Run `supabase link --project-ref <ref>` then `supabase db push` to apply migrations to the cloud project.
3. In your hosting provider (Vercel recommended), set the same env vars but pointing at the cloud project's URL and keys.
4. Add the cloud `…/auth/callback` URL to **Auth → URL Configuration → Redirect URLs**.
5. Schedule the cron endpoint daily (see below).

---

## The inbox state machine

`src/lib/inboxes/state-machine.ts` is the single source of truth (mirrors `PROJECT_SPEC.md` §2):

| Days since `warmup_started_at` | State    | Daily limit |
|--------------------------------|----------|-------------|
| 0–13                           | warming  | 0           |
| 14–20                          | ramping  | 5           |
| 21–27                          | ramping  | 10          |
| 28–34                          | ramping  | 15          |
| 35+                            | active   | 20 (hard cap) |

Paused inboxes stay paused until `paused_until` elapses, then re-enter the age-based state.

### Cron endpoint

`POST` (or `GET`) `/api/cron/promote-inboxes` with header:

```
Authorization: Bearer <CRON_SECRET>
```

Returns the list of changed inboxes. Schedule daily (Vercel cron, GitHub Actions, or `pg_cron`).

**Local test:**

```bash
curl -i http://localhost:3000/api/cron/promote-inboxes \
  -H "Authorization: Bearer $(grep CRON_SECRET .env.local | cut -d= -f2)"
```

---

## Scraping leads from Google Maps

The scraper is a standalone Node CLI — it launches Chromium via Playwright, walks the search results, and inserts unique leads via the service-role key. It never runs inside Next; Vercel function timeouts (60s) would kill a real scrape mid-run.

### Install the browser binary once

```bash
npx playwright install chromium
```

(Adds ~150MB to your dev machine — only needed where you'll actually run the scraper.)

### Run a scrape

Auto-create a campaign and populate it:

```bash
npm run scrape -- --niche "Dentists" --city "Phoenix" --limit 100
```

Or target an existing campaign:

```bash
npm run scrape -- --campaign 9d3a... --limit 200 --delay 2000
```

Flags:

| Flag | Default | Purpose |
|------|---------|---------|
| `--campaign <uuid>` | — | Existing campaign id (skip auto-create) |
| `--niche <text>` `--city <text>` | — | Required when no `--campaign` |
| `--name <text>` | `"$niche in $city"` | Display name for the auto-created campaign |
| `--limit <n>` | 100 | Cap on businesses extracted |
| `--delay <ms>` | 1500 | Pause between detail visits (be respectful) |
| `--headed` | off | Run with a visible browser to debug selectors |

### Expected behavior

- Saves the campaign id first so a partial scrape doesn't lose progress.
- Inserts leads in chunks of 50 with `upsert` on `email` so re-running is safe.
- If Google serves a `/sorry/`, CAPTCHA, or consent gate, the run aborts cleanly and saves whatever it managed to pull.
- Selectors in `src/lib/scraper/google-maps.ts` target stable ARIA attributes (`button[data-item-id="address"]`, etc.) — Google changes these occasionally; tune them when you see fields coming back as null.

### When to use a paid SERP API instead

Self-hosted scraping breaks under sustained load. For >1k leads/day, swap in SerpAPI or Apify by replacing `scrapeGoogleMaps()` with a call to their API and reusing the same `normalize.ts` pipeline downstream.

---

## What's in Phases 1–2

- ✅ Next.js 15 + Tailwind v4 + shadcn/ui (dark by default).
- ✅ Supabase clients: server (RSC + handlers), browser, service-role, middleware refresh.
- ✅ Magic-link auth with `ADMIN_EMAIL` allowlist enforced at request, callback, middleware, and every route handler.
- ✅ Full schema migration (`supabase/migrations/0001_init.sql`) with enums, RLS, the 3-inboxes-per-domain trigger, `updated_at` triggers.
- ✅ Dashboard shell with sidebar (Domains · Inboxes · Campaigns · Leads · Call Engine · Inbox · Pipeline · Settings).
- ✅ Domains: create / DKIM-SPF-DMARC toggle / delete; status auto-derived.
- ✅ Inboxes: create, state badge, pause/resume, start warmup clock, cron-driven promotion.
- ✅ Campaigns: full CRUD with status workflow and lead counts.
- ✅ Leads: paginated list with q/campaign/status/call_status filters, lead detail page.
- ✅ Google Maps scraper CLI with normalization, dedupe, and block-detection.

## Coming next

- **Phase 3:** Twilio Call Engine + TCPA windowing.
- **Phase 4:** Claude personalizer + Instantly integration + volume governor.
- **Phase 5:** IMAP reply listener + unified inbox + Kanban pipeline.

---

## Scripts

| Command           | What it does |
|-------------------|---|
| `npm run dev`     | Next dev server |
| `npm run build`   | Production build |
| `npm start`       | Run the production build |
| `npm run lint`    | Next/ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test`        | Run vitest suite once |
| `npm run test:watch` | Vitest in watch mode |
| `npm run scrape`  | CLI: scrape Google Maps into a campaign (see Scraping section) |
| `npm run db:reset`  | Reset local Supabase + re-apply migrations |
| `npm run db:types`  | Regenerate `src/types/database.ts` from local schema |
| `npm run db:push`   | Push migrations to linked cloud project |
