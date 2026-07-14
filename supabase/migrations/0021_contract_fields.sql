-- Campos de contrato adicionales (Holded): jornada laboral y modalidad de trabajo.
alter table public.employees add column if not exists work_schedule text; -- p.ej. "Lunes a Viernes"
alter table public.employees add column if not exists work_mode text;     -- Presencial | Remoto | Híbrido

-- Datos de contrato de Mariola (de Holded).
update public.employees set
  gross_salary  = 22000,
  start_date    = '2025-01-01',
  contract_type = 'Indefinido tiempo completo (100)',
  weekly_hours  = 40,
  work_schedule = 'Lunes a Viernes'
where email = 'mariola@fcts.studio';

NOTIFY pgrst, 'reload schema';
