-- Apply in a dedicated Supabase project before enabling external recruitment.
-- The participant browser never receives a database key. All access uses
-- server-only API routes with the project secret/service-role key.
create table if not exists public.pilot_invites (
  token_hash text primary key check (length(token_hash) = 64),
  session_hash text unique check (session_hash is null or length(session_hash) = 64),
  condition smallint not null check (condition between 1 and 3),
  order_variant text not null check (order_variant in ('A', 'B')),
  status text not null check (status in ('pending', 'active', 'complete', 'withdrawn')),
  created_at timestamptz not null,
  consented_at timestamptz,
  completed_at timestamptz
);

create table if not exists public.pilot_events (
  id uuid primary key,
  token_hash text not null references public.pilot_invites(token_hash),
  type text not null check (type in ('stage', 'decision', 'survey', 'withdraw')),
  trial_id text,
  stage text,
  client_ms bigint,
  server_at timestamptz not null,
  details jsonb not null default '{}'::jsonb
);

create table if not exists public.pilot_decisions (
  token_hash text not null references public.pilot_invites(token_hash),
  trial_id text not null,
  trial_index smallint not null check (trial_index between 0 and 11),
  choice text not null check (choice in ('follow', 'other')),
  stimulus_version text not null,
  ai_reco text not null check (ai_reco in ('action', 'alternative')),
  ground_truth text not null check (ground_truth in ('action', 'alternative')),
  ai_correct boolean not null,
  correct boolean not null,
  situation_time_ms integer not null check (situation_time_ms >= 0),
  evidence_time_ms integer not null check (evidence_time_ms >= 0),
  read_time_ms integer not null check (read_time_ms >= 0),
  hesitation_time_ms integer not null check (hesitation_time_ms >= 0),
  total_time_ms integer not null check (total_time_ms >= 0),
  submitted_at timestamptz not null,
  primary key (token_hash, trial_id)
);

create table if not exists public.pilot_surveys (
  token_hash text primary key references public.pilot_invites(token_hash),
  answers jsonb not null,
  feedback text not null default '',
  submitted_at timestamptz not null
);

create index if not exists pilot_events_token_idx on public.pilot_events(token_hash, server_at);
create index if not exists pilot_decisions_token_idx on public.pilot_decisions(token_hash, trial_index);

alter table public.pilot_invites enable row level security;
alter table public.pilot_events enable row level security;
alter table public.pilot_decisions enable row level security;
alter table public.pilot_surveys enable row level security;
-- No anon or authenticated policies: public clients cannot select or mutate rows.
