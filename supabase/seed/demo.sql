insert into public.companies (id,legal_name,ruc,region,current_compliance,current_risk)
values ('00000000-0000-0000-0000-000000000001','Minera Andina del Sur','20601234567','Arequipa',76,'Alto')
on conflict (ruc) do nothing;

insert into public.mining_operations (id,company_id,code,name,region,operation_type,project_stage,responsible_name,profile_complete)
values ('10000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001','OP-AND-001','Unidad Cerro Azul','Arequipa','Explotación','Operación','Ana Quispe',true)
on conflict (code) do nothing;

insert into public.obligation_catalog (id,code,title,category,criticality,required_evidence)
values
('20000000-0000-0000-0000-000000000001','OB-001','Presentar informe trimestral de monitoreo de agua','Agua','Alta','Informe firmado y anexos de laboratorio'),
('20000000-0000-0000-0000-000000000002','OB-002','Actualizar registro de manejo de residuos peligrosos','Residuos','Alta','Registro actualizado y manifiestos')
on conflict (code) do nothing;

insert into public.obligation_assignments (id,operation_id,catalog_id,due_date,status)
values
('30000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','2026-08-12','En análisis'),
('30000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000002','2026-08-05','Requiere subsanación')
on conflict (operation_id,catalog_id) do nothing;
