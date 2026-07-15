-- Metadatos propios de la lista en ClickUp: descripción y fechas. Se usan sobre
-- todo en las listas marcadas como sprint:
--   list_content → la "Definición" (para qué es el sprint, en breve)
--   list_start / list_due → lo que dura; se publican como hitos en el calendario
-- Los rellena el sync desde ClickUp (no se editan a mano en el portal).
alter table public.clickup_lists
  add column if not exists list_content text not null default '',
  add column if not exists list_start   timestamptz,
  add column if not exists list_due     timestamptz;

notify pgrst, 'reload schema';
