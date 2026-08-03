-- Vínculo explícito empleado ↔ perfil de ClickUp.
-- La asignación en ClickUp es por GRUPOS de usuario (cada persona = un grupo).
-- Guardamos el id del grupo (estable aunque se renombre) para relacionar los
-- eventos de ClickUp (cumpleaños, etc.) con el empleado correcto, en vez de
-- cruzar por nombre. Sin vínculo, el empleado no aparece en esas funciones.
alter table public.employees
  add column if not exists clickup_group_id text;

notify pgrst, 'reload schema';
