-- Colaboradores externos: perfiles que entran al portal pero no son plantilla
-- del estudio (clientes, freelance…). No fichan ni tienen nómina, contrato o
-- datos bancarios aquí; en su ficha se guarda a qué empresa pertenecen.
alter table public.employees
  add column if not exists is_external boolean not null default false,
  add column if not exists company text;

-- Marca como externo a quien no tenga cuenta del estudio.
update public.employees
set is_external = true
where lower(email) not like '%@fcts.studio';

-- Y deja la empresa de los que ya conocemos.
update public.employees set company = 'Unfiltrade®' where lower(email) like '%@unfiltrade.com';
update public.employees set company = 'F*cts Studio' where lower(email) like '%@fcts.studio';

notify pgrst, 'reload schema';
