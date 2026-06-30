-- Días extra de vacaciones (+/-) que se suman/restan al estándar anual.
-- Saldo efectivo = vacation_allowance (base, def. 23) + vacation_adjustment.
alter table public.employees
  add column if not exists vacation_adjustment numeric(4,1) not null default 0;

NOTIFY pgrst, 'reload schema';
