create extension if not exists "pgcrypto";

create table if not exists public.candidates (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  email text not null,
  resume_url text,
  portfolio_url text,
  linkedin_url text,
  agreement_confirmed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists candidates_email_idx on public.candidates (email);

create table if not exists public.assessment_sessions (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.candidates(id) on delete cascade,
  assessment_name text not null,
  status text not null default 'draft',
  started_at timestamptz,
  expires_at timestamptz,
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint assessment_sessions_status_check check (
    status in ('draft', 'started', 'submitted', 'expired')
  )
);

create index if not exists assessment_sessions_candidate_id_idx
  on public.assessment_sessions (candidate_id);

create table if not exists public.assessment_submissions (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.candidates(id) on delete cascade,
  assessment_session_id uuid not null references public.assessment_sessions(id) on delete cascade,
  website_figma_link text,
  website_file_name text,
  website_explanation text not null,
  website_walkthrough_url text not null,
  healthcare_figma_link text,
  healthcare_file_name text,
  healthcare_explanation text not null,
  linkedin_post text not null,
  linkedin_graphic_file_name text,
  linkedin_graphic_figma_link text,
  submitted_payload jsonb not null default '{}'::jsonb,
  submitted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint assessment_submissions_session_unique unique (assessment_session_id)
);

create index if not exists assessment_submissions_candidate_id_idx
  on public.assessment_submissions (candidate_id);

insert into storage.buckets (id, name, public)
values ('resumes', 'resumes', true)
on conflict (id) do nothing;

alter table public.candidates enable row level security;
alter table public.assessment_sessions enable row level security;
alter table public.assessment_submissions enable row level security;

drop policy if exists "Allow public candidate intake inserts"
on public.candidates;

drop policy if exists "Allow public candidate intake selects"
on public.candidates;

drop policy if exists "Allow public assessment session inserts"
on public.assessment_sessions;

drop policy if exists "Allow public assessment session selects"
on public.assessment_sessions;

drop policy if exists "Allow public assessment submission inserts"
on public.assessment_submissions;

drop policy if exists "Allow public assessment submission selects"
on public.assessment_submissions;

drop policy if exists "Allow public assessment submission updates"
on public.assessment_submissions;

drop policy if exists "Allow public resume uploads"
on storage.objects;

drop policy if exists "Allow public resume reads"
on storage.objects;

create policy "Allow public candidate intake inserts"
on public.candidates
for insert
to anon
with check (true);

create policy "Allow public candidate intake selects"
on public.candidates
for select
to anon
using (true);

create policy "Allow public assessment session inserts"
on public.assessment_sessions
for insert
to anon
with check (true);

create policy "Allow public assessment session selects"
on public.assessment_sessions
for select
to anon
using (true);

create policy "Allow public assessment submission inserts"
on public.assessment_submissions
for insert
to anon
with check (true);

create policy "Allow public assessment submission selects"
on public.assessment_submissions
for select
to anon
using (true);

create policy "Allow public assessment submission updates"
on public.assessment_submissions
for update
to anon
using (true)
with check (true);

create policy "Allow public resume uploads"
on storage.objects
for insert
to anon
with check (bucket_id = 'resumes');

create policy "Allow public resume reads"
on storage.objects
for select
to anon
using (bucket_id = 'resumes');
