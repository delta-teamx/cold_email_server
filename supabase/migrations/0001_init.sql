-- ============================================================================
-- 0001_init.sql
-- AI Receptionist Outreach Platform — initial schema (Phase 1 + forward-compat)
-- See PROJECT_SPEC.md §5 for the source of truth.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

create type domain_status as enum ('pending', 'configured', 'active');

create type inbox_state as enum ('warming', 'ramping', 'active', 'paused');

create type call_status as enum (
  'voicemail',
  'no_answer',
  'busy',
  'voicemail_full',
  'answered',
  'failed'
);

create type email_track as enum ('voicemail_angle', 'strong_desk_angle', 'excluded');

create type lead_status as enum (
  'new',
  'called',
  'personalized',
  'queued',
  'sent',
  'replied',
  'bounced',
  'unsubscribed'
);

create type email_status as enum ('scheduled', 'sent', 'opened', 'replied', 'bounced');

create type reply_classification as enum (
  'interested',
  'not_interested',
  'question',
  'unsubscribe',
  'oob'
);

create type deal_stage as enum (
  'new_reply',
  'qualifying',
  'demo_booked',
  'closed_won',
  'closed_lost'
);

create type campaign_status as enum ('draft', 'active', 'paused', 'completed');

-- ---------------------------------------------------------------------------
-- profiles — one row, this is you
-- ---------------------------------------------------------------------------

create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  admin_email text not null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- domains
-- ---------------------------------------------------------------------------

create table domains (
  id uuid primary key default gen_random_uuid(),
  root_domain text not null unique,
  registered_at date,
  dkim_configured boolean not null default false,
  spf_configured boolean not null default false,
  dmarc_configured boolean not null default false,
  status domain_status not null default 'pending',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index domains_status_idx on domains (status);

-- ---------------------------------------------------------------------------
-- inboxes
-- ---------------------------------------------------------------------------

create table inboxes (
  id uuid primary key default gen_random_uuid(),
  domain_id uuid not null references domains (id) on delete restrict,
  email_address text not null unique,
  display_name text not null,
  profile_photo_url text,
  instantly_account_id text,

  state inbox_state not null default 'warming',
  warmup_started_at timestamptz,
  current_daily_limit smallint not null default 0
    check (current_daily_limit between 0 and 20),

  sends_today smallint not null default 0
    check (sends_today >= 0),
  reset_at timestamptz,

  recent_bounce_rate numeric(5, 4),
  recent_complaint_rate numeric(5, 4),
  recent_open_rate numeric(5, 4),
  recent_reply_rate numeric(5, 4),

  pause_reason text,
  paused_until timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index inboxes_domain_idx on inboxes (domain_id);
create index inboxes_state_idx on inboxes (state);

-- Enforce: max 3 active+ramping+warming inboxes per domain (spec §2).
-- Paused doesn't count toward the cap.
create or replace function enforce_inboxes_per_domain()
returns trigger
language plpgsql
as $$
declare
  v_count int;
begin
  select count(*) into v_count
  from inboxes
  where domain_id = new.domain_id
    and id <> coalesce(new.id, '00000000-0000-0000-0000-000000000000'::uuid);
  if v_count >= 3 then
    raise exception 'Cannot exceed 3 inboxes per domain (spec §2)';
  end if;
  return new;
end;
$$;

create trigger inboxes_per_domain_cap
before insert on inboxes
for each row execute function enforce_inboxes_per_domain();

-- ---------------------------------------------------------------------------
-- campaigns
-- ---------------------------------------------------------------------------

create table campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  niche text not null,
  city text not null,
  status campaign_status not null default 'draft',
  voicemail_email_template text,
  strong_desk_email_template text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index campaigns_status_idx on campaigns (status);

-- ---------------------------------------------------------------------------
-- leads
-- ---------------------------------------------------------------------------

create table leads (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns (id) on delete cascade,
  business_name text not null,
  owner_name text,
  email text,
  phone text,
  website text,
  google_maps_url text,
  hours_json jsonb,
  review_snippets text[],
  rating numeric(2, 1),
  review_count integer,

  call_status call_status,
  call_attempted_at timestamptz,

  email_track email_track,

  status lead_status not null default 'new',
  assigned_inbox_id uuid references inboxes (id) on delete set null,

  scraped_at timestamptz not null default now(),
  called_at timestamptz,
  sent_at timestamptz
);

create index leads_campaign_idx on leads (campaign_id);
create index leads_status_idx on leads (status);
create index leads_assigned_inbox_idx on leads (assigned_inbox_id);
create unique index leads_email_unique on leads (lower(email)) where email is not null;
create unique index leads_phone_unique on leads (phone) where phone is not null;

-- ---------------------------------------------------------------------------
-- emails (1 sequence = up to 4 rows per lead)
-- ---------------------------------------------------------------------------

create table emails (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references leads (id) on delete cascade,
  campaign_id uuid not null references campaigns (id) on delete cascade,
  inbox_id uuid not null references inboxes (id) on delete restrict,
  step smallint not null check (step between 1 and 4),
  subject text not null,
  body text not null,
  personalization_data jsonb,

  scheduled_at timestamptz,
  sent_at timestamptz,
  opened_at timestamptz,
  clicked_at timestamptz,
  replied_at timestamptz,
  bounced_at timestamptz,

  instantly_message_id text,
  status email_status not null default 'scheduled',

  created_at timestamptz not null default now(),
  unique (lead_id, step)
);

create index emails_lead_idx on emails (lead_id);
create index emails_inbox_idx on emails (inbox_id);
create index emails_status_idx on emails (status);
create index emails_scheduled_idx on emails (scheduled_at) where status = 'scheduled';

-- ---------------------------------------------------------------------------
-- replies
-- ---------------------------------------------------------------------------

create table replies (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references leads (id) on delete cascade,
  email_id uuid references emails (id) on delete set null,
  inbox_id uuid not null references inboxes (id) on delete restrict,
  from_email text not null,
  subject text,
  body_text text,
  body_html text,
  classification reply_classification,
  ai_draft_response text,
  user_response text,
  sent_at timestamptz,
  received_at timestamptz not null default now()
);

create index replies_lead_idx on replies (lead_id);
create index replies_inbox_idx on replies (inbox_id);
create index replies_classification_idx on replies (classification);

-- ---------------------------------------------------------------------------
-- deals
-- ---------------------------------------------------------------------------

create table deals (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null unique references leads (id) on delete cascade,
  stage deal_stage not null default 'new_reply',
  demo_at timestamptz,
  notes text,
  value_dollars integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index deals_stage_idx on deals (stage);

-- ---------------------------------------------------------------------------
-- do_not_contact (TCPA + email opt-outs)
-- ---------------------------------------------------------------------------

create table do_not_contact (
  id uuid primary key default gen_random_uuid(),
  email text,
  phone text,
  reason text,
  created_at timestamptz not null default now(),
  check (email is not null or phone is not null)
);

create unique index dnc_email_unique on do_not_contact (lower(email)) where email is not null;
create unique index dnc_phone_unique on do_not_contact (phone) where phone is not null;

-- ---------------------------------------------------------------------------
-- inbox_health_log
-- ---------------------------------------------------------------------------

create table inbox_health_log (
  id uuid primary key default gen_random_uuid(),
  inbox_id uuid not null references inboxes (id) on delete cascade,
  metric text not null,
  value numeric,
  threshold_breached boolean not null default false,
  action_taken text,
  logged_at timestamptz not null default now()
);

create index inbox_health_log_inbox_idx on inbox_health_log (inbox_id, logged_at desc);

-- ---------------------------------------------------------------------------
-- updated_at trigger helper
-- ---------------------------------------------------------------------------

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger domains_set_updated_at before update on domains
  for each row execute function set_updated_at();
create trigger inboxes_set_updated_at before update on inboxes
  for each row execute function set_updated_at();
create trigger campaigns_set_updated_at before update on campaigns
  for each row execute function set_updated_at();
create trigger deals_set_updated_at before update on deals
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- Single-user platform: authenticated users (the admin) can do anything.
-- Anon users cannot read or write. Service role bypasses RLS automatically.
-- ---------------------------------------------------------------------------

alter table profiles            enable row level security;
alter table domains             enable row level security;
alter table inboxes             enable row level security;
alter table campaigns           enable row level security;
alter table leads               enable row level security;
alter table emails              enable row level security;
alter table replies             enable row level security;
alter table deals               enable row level security;
alter table do_not_contact      enable row level security;
alter table inbox_health_log    enable row level security;

do $$
declare
  t text;
begin
  for t in
    select unnest(array[
      'profiles','domains','inboxes','campaigns','leads',
      'emails','replies','deals','do_not_contact','inbox_health_log'
    ])
  loop
    execute format(
      'create policy "%1$s_authenticated_all" on %1$s for all to authenticated using (true) with check (true);',
      t
    );
  end loop;
end$$;
