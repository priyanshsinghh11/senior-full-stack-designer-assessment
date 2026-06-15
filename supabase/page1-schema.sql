create extension if not exists "pgcrypto";

create table if not exists public.candidates (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  resume_url text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.candidates
  add column if not exists full_name text;

alter table public.candidates
  add column if not exists resume_url text;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'candidates'
      and column_name = 'first_name'
  ) then
    execute $sql$
      update public.candidates
      set full_name = nullif(
        trim(
          concat_ws(
            ' ',
            nullif(first_name, ''),
            nullif(last_name, '')
          )
        ),
        ''
      )
      where full_name is null or trim(full_name) = ''
    $sql$;
  end if;
end $$;

update public.candidates
set full_name = 'Unknown Candidate'
where full_name is null or trim(full_name) = '';

update public.candidates
set resume_url = ''
where resume_url is null;

alter table public.candidates
  alter column full_name set not null;

alter table public.candidates
  alter column resume_url set not null;

alter table public.candidates
  drop column if exists first_name,
  drop column if exists last_name,
  drop column if exists portfolio_url,
  drop column if exists linkedin_url,
  drop column if exists agreement_confirmed;

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

drop policy if exists allow_public_candidate_intake_inserts
on public.candidates;

drop policy if exists allow_public_candidate_intake_selects
on public.candidates;

drop policy if exists allow_public_assessment_session_inserts
on public.assessment_sessions;

drop policy if exists allow_public_assessment_session_selects
on public.assessment_sessions;

drop policy if exists allow_public_assessment_submission_inserts
on public.assessment_submissions;

drop policy if exists allow_public_assessment_submission_selects
on public.assessment_submissions;

drop policy if exists allow_public_assessment_submission_updates
on public.assessment_submissions;

drop policy if exists allow_public_resume_uploads
on storage.objects;

drop policy if exists allow_public_resume_reads
on storage.objects;

create policy allow_public_candidate_intake_inserts
on public.candidates
for insert
to anon
with check (true);

create policy allow_public_candidate_intake_selects
on public.candidates
for select
to anon
using (true);

create policy allow_public_assessment_session_inserts
on public.assessment_sessions
for insert
to anon
with check (true);

create policy allow_public_assessment_session_selects
on public.assessment_sessions
for select
to anon
using (true);

create policy allow_public_assessment_submission_inserts
on public.assessment_submissions
for insert
to anon
with check (true);

create policy allow_public_assessment_submission_selects
on public.assessment_submissions
for select
to anon
using (true);

create policy allow_public_assessment_submission_updates
on public.assessment_submissions
for update
to anon
using (true)
with check (true);

create policy allow_public_resume_uploads
on storage.objects
for insert
to anon
with check (bucket_id = 'resumes');

create policy allow_public_resume_reads
on storage.objects
for select
to anon
using (bucket_id = 'resumes');
