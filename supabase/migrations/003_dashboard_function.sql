create or replace function public.get_company_dashboard(p_company_id uuid)
returns jsonb
language plpgsql security definer set search_path=public
as $$
declare
  result jsonb;
begin
  if public.current_role() <> 'fiscalizador'
     and p_company_id <> public.current_company_id() then
    raise exception 'Acceso no autorizado';
  end if;

  select jsonb_build_object(
    'compliance', coalesce((
      select round(avg(score)) from public.preparation_scores score
      join public.mining_operations operation on operation.id=score.operation_id
      where operation.company_id=p_company_id
    ),0),
    'obligations', (
      select count(*) from public.obligation_assignments assignment
      join public.mining_operations operation on operation.id=assignment.operation_id
      where operation.company_id=p_company_id
    ),
    'evidences', (
      select count(*) from public.evidence_documents evidence
      join public.mining_operations operation on operation.id=evidence.operation_id
      where operation.company_id=p_company_id
    ),
    'pending', (
      select count(*) from public.obligation_assignments assignment
      join public.mining_operations operation on operation.id=assignment.operation_id
      where operation.company_id=p_company_id and assignment.status <> 'Cumple'
    ),
    'criticalGaps', (
      select count(*) from public.gaps gap
      join public.obligation_assignments assignment on assignment.id=gap.assignment_id
      join public.mining_operations operation on operation.id=assignment.operation_id
      where operation.company_id=p_company_id and gap.risk_level='Crítico' and gap.status<>'Cerrada'
    )
  ) into result;

  return result;
end;
$$;
