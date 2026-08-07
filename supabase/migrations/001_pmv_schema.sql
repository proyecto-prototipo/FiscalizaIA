create extension if not exists "pgcrypto";

do $$ begin
  create type public.app_role as enum ('fiscalizador','empresa_evaluada');
exception when duplicate_object then null; end $$;

create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  legal_name text not null,
  ruc text not null unique,
  region text,
  active boolean not null default true,
  current_compliance numeric not null default 0 check (current_compliance between 0 and 100),
  current_risk text not null default 'Bajo' check (current_risk in ('Bajo','Medio','Alto','Crítico')),
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role public.app_role not null,
  company_id uuid references public.companies(id) on delete set null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.mining_operations (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  code text not null unique,
  name text not null,
  region text,
  operation_type text,
  project_stage text,
  responsible_name text,
  profile_complete boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.obligation_catalog (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  title text not null,
  description text,
  category text not null,
  criticality text not null check (criticality in ('Alta','Media','Baja')),
  required_evidence text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.obligation_assignments (
  id uuid primary key default gen_random_uuid(),
  operation_id uuid not null references public.mining_operations(id) on delete cascade,
  catalog_id uuid not null references public.obligation_catalog(id),
  due_date date,
  status text not null default 'Pendiente',
  assigned_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  unique(operation_id,catalog_id)
);

create table if not exists public.evidence_documents (
  id uuid primary key default gen_random_uuid(),
  operation_id uuid not null references public.mining_operations(id) on delete cascade,
  assignment_id uuid not null references public.obligation_assignments(id) on delete cascade,
  file_name text not null,
  storage_path text not null,
  version integer not null default 1,
  replaces_evidence_id uuid references public.evidence_documents(id),
  status text not null default 'Pendiente',
  uploaded_by uuid references public.profiles(id),
  uploaded_at timestamptz not null default now()
);

create table if not exists public.ai_analyses (
  id uuid primary key default gen_random_uuid(),
  evidence_id uuid not null references public.evidence_documents(id) on delete cascade,
  model text not null,
  compliance_status text not null,
  risk_level text not null,
  missing_information jsonb not null default '[]'::jsonb,
  inconsistencies jsonb not null default '[]'::jsonb,
  observations jsonb not null default '[]'::jsonb,
  recommendations jsonb not null default '[]'::jsonb,
  confidence numeric,
  human_status text not null default 'Pendiente',
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.evaluations (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null unique references public.obligation_assignments(id) on delete cascade,
  evidence_id uuid references public.evidence_documents(id),
  ai_analysis_id uuid references public.ai_analyses(id),
  compliance_status text not null,
  risk_level text not null,
  score numeric not null default 0 check (score between 0 and 100),
  validated boolean not null default false,
  validated_by uuid references public.profiles(id),
  validated_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.gaps (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.obligation_assignments(id) on delete cascade,
  title text not null,
  description text,
  risk_level text not null check (risk_level in ('Bajo','Medio','Alto','Crítico')),
  status text not null default 'Abierta',
  created_at timestamptz not null default now()
);

create table if not exists public.observations (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.obligation_assignments(id) on delete cascade,
  source text not null check (source in ('IA','Fiscalizador')),
  text text not null,
  validated boolean not null default false,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table if not exists public.recommendations (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.obligation_assignments(id) on delete cascade,
  text text not null,
  priority text not null check (priority in ('Alta','Media','Baja')),
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table if not exists public.preparation_scores (
  id uuid primary key default gen_random_uuid(),
  operation_id uuid not null references public.mining_operations(id) on delete cascade,
  score numeric not null check (score between 0 and 100),
  risk_level text not null,
  calculated_at timestamptz not null default now()
);

create table if not exists public.preparation_reports (
  id uuid primary key default gen_random_uuid(),
  operation_id uuid not null references public.mining_operations(id) on delete cascade,
  storage_path text,
  status text not null default 'Pendiente',
  legal_note text not null,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table if not exists public.system_settings (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  value jsonb not null,
  updated_by uuid references public.profiles(id),
  updated_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id),
  entity text not null,
  entity_id uuid,
  action text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

insert into storage.buckets (id,name,public)
values ('evidences','evidences',false)
on conflict (id) do nothing;

do $$ begin
  alter publication supabase_realtime add table public.companies;
  alter publication supabase_realtime add table public.mining_operations;
  alter publication supabase_realtime add table public.obligation_assignments;
  alter publication supabase_realtime add table public.evidence_documents;
  alter publication supabase_realtime add table public.ai_analyses;
  alter publication supabase_realtime add table public.evaluations;
  alter publication supabase_realtime add table public.gaps;
  alter publication supabase_realtime add table public.observations;
  alter publication supabase_realtime add table public.recommendations;
  alter publication supabase_realtime add table public.preparation_scores;
exception when duplicate_object then null; end $$;
