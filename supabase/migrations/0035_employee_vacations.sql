-- Vacaciones por persona: hay colaboradores externos que no gestionan sus
-- ausencias con nosotros (las llevan en su propia empresa). Con el flag a
-- false desaparece TODO el sistema para ellos: no pueden solicitar, no ven su
-- saldo ni sus ausencias, y no reciben los avisos de ritmo de vacaciones.
alter table public.employees
  add column if not exists vacations_enabled boolean not null default true;

-- La plantilla siempre las tiene: el flag es para afinar a los externos.
update public.employees set vacations_enabled = true where is_external = false;

notify pgrst, 'reload schema';
