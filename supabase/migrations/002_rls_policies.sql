alter table public.profiles enable row level security;
alter table public.companies enable row level security;
alter table public.mining_operations enable row level security;
alter table public.obligation_catalog enable row level security;
alter table public.obligation_assignments enable row level security;
alter table public.evidence_documents enable row level security;
alter table public.ai_analyses enable row level security;
alter table public.evaluations enable row level security;
alter table public.gaps enable row level security;
alter table public.observations enable row level security;
alter table public.recommendations enable row level security;
alter table public.preparation_scores enable row level security;
alter table public.preparation_reports enable row level security;
alter table public.system_settings enable row level security;
alter table public.audit_logs enable row level security;

create or replace function public.current_role()
returns public.app_role
language sql stable security definer set search_path=public
as $$ select role from public.profiles where id=auth.uid() $$;

create or replace function public.current_company_id()
returns uuid
language sql stable security definer set search_path=public
as $$ select company_id from public.profiles where id=auth.uid() $$;

create policy "profiles self or fiscalizador read"
on public.profiles for select
using (id=auth.uid() or public.current_role()='fiscalizador');

create policy "fiscalizador manages profiles"
on public.profiles for all
using (public.current_role()='fiscalizador')
with check (public.current_role()='fiscalizador');

create policy "companies role access"
on public.companies for select
using (
  public.current_role()='fiscalizador'
  or id=public.current_company_id()
);

create policy "fiscalizador manages companies"
on public.companies for all
using (public.current_role()='fiscalizador')
with check (public.current_role()='fiscalizador');

create policy "operations role access"
on public.mining_operations for select
using (
  public.current_role()='fiscalizador'
  or company_id=public.current_company_id()
);

create policy "fiscalizador manages operations"
on public.mining_operations for all
using (public.current_role()='fiscalizador')
with check (public.current_role()='fiscalizador');

create policy "catalog authenticated read"
on public.obligation_catalog for select
to authenticated using (active=true or public.current_role()='fiscalizador');

create policy "fiscalizador manages catalog"
on public.obligation_catalog for all
using (public.current_role()='fiscalizador')
with check (public.current_role()='fiscalizador');

create policy "assignments role access"
on public.obligation_assignments for select
using (
  public.current_role()='fiscalizador'
  or exists (
    select 1 from public.mining_operations operation
    where operation.id=operation_id
      and operation.company_id=public.current_company_id()
  )
);

create policy "fiscalizador manages assignments"
on public.obligation_assignments for all
using (public.current_role()='fiscalizador')
with check (public.current_role()='fiscalizador');

create policy "evidence role read"
on public.evidence_documents for select
using (
  public.current_role()='fiscalizador'
  or exists (
    select 1 from public.mining_operations operation
    where operation.id=operation_id
      and operation.company_id=public.current_company_id()
  )
);

create policy "company inserts own evidence"
on public.evidence_documents for insert
with check (
  exists (
    select 1 from public.mining_operations operation
    where operation.id=operation_id
      and operation.company_id=public.current_company_id()
  )
);

create policy "fiscalizador updates evidence"
on public.evidence_documents for update
using (public.current_role()='fiscalizador');

create policy "results role read"
on public.ai_analyses for select
using (
  public.current_role()='fiscalizador'
  or exists (
    select 1
    from public.evidence_documents evidence
    join public.mining_operations operation on operation.id=evidence.operation_id
    where evidence.id=evidence_id
      and operation.company_id=public.current_company_id()
  )
);

create policy "fiscalizador manages ai"
on public.ai_analyses for all
using (public.current_role()='fiscalizador')
with check (public.current_role()='fiscalizador');

create policy "evaluations role read"
on public.evaluations for select
using (
  public.current_role()='fiscalizador'
  or exists (
    select 1 from public.obligation_assignments assignment
    join public.mining_operations operation on operation.id=assignment.operation_id
    where assignment.id=assignment_id
      and operation.company_id=public.current_company_id()
  )
);

create policy "fiscalizador manages evaluations"
on public.evaluations for all
using (public.current_role()='fiscalizador')
with check (public.current_role()='fiscalizador');

create policy "fiscalizador manages gaps"
on public.gaps for all
using (public.current_role()='fiscalizador')
with check (public.current_role()='fiscalizador');

create policy "company reads own gaps"
on public.gaps for select
using (
  exists (
    select 1 from public.obligation_assignments assignment
    join public.mining_operations operation on operation.id=assignment.operation_id
    where assignment.id=assignment_id
      and operation.company_id=public.current_company_id()
  )
);

create policy "fiscalizador manages observations"
on public.observations for all
using (public.current_role()='fiscalizador')
with check (public.current_role()='fiscalizador');

create policy "company reads own observations"
on public.observations for select
using (
  exists (
    select 1 from public.obligation_assignments assignment
    join public.mining_operations operation on operation.id=assignment.operation_id
    where assignment.id=assignment_id
      and operation.company_id=public.current_company_id()
  )
);

create policy "fiscalizador manages recommendations"
on public.recommendations for all
using (public.current_role()='fiscalizador')
with check (public.current_role()='fiscalizador');

create policy "company reads own recommendations"
on public.recommendations for select
using (
  exists (
    select 1 from public.obligation_assignments assignment
    join public.mining_operations operation on operation.id=assignment.operation_id
    where assignment.id=assignment_id
      and operation.company_id=public.current_company_id()
  )
);

create policy "scores role read"
on public.preparation_scores for select
using (
  public.current_role()='fiscalizador'
  or exists (
    select 1 from public.mining_operations operation
    where operation.id=operation_id
      and operation.company_id=public.current_company_id()
  )
);

create policy "fiscalizador manages scores"
on public.preparation_scores for all
using (public.current_role()='fiscalizador')
with check (public.current_role()='fiscalizador');

create policy "reports role read"
on public.preparation_reports for select
using (
  public.current_role()='fiscalizador'
  or exists (
    select 1 from public.mining_operations operation
    where operation.id=operation_id
      and operation.company_id=public.current_company_id()
  )
);

create policy "fiscalizador manages reports"
on public.preparation_reports for all
using (public.current_role()='fiscalizador')
with check (public.current_role()='fiscalizador');

create policy "fiscalizador settings"
on public.system_settings for all
using (public.current_role()='fiscalizador')
with check (public.current_role()='fiscalizador');

create policy "fiscalizador logs"
on public.audit_logs for select
using (public.current_role()='fiscalizador');

create policy "authenticated evidence objects read"
on storage.objects for select to authenticated
using (bucket_id='evidences');

create policy "authenticated evidence objects insert"
on storage.objects for insert to authenticated
with check (bucket_id='evidences');
