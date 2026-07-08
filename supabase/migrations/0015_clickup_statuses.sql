-- Estados de ClickUp por lista (heredados del space): permiten gestionar el
-- estado de una tarea desde el portal con los mismos colores/fases que ClickUp.
-- Array de { status, type, color, orderindex }.
alter table public.clickup_lists
  add column if not exists statuses jsonb not null default '[]'::jsonb;

NOTIFY pgrst, 'reload schema';
