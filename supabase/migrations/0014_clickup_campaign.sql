-- Marca de "campaña" para carpetas de ClickUp (Evento 2026, Black Friday…).
-- Se gestionan como un cliente más, pero con distintivo visual. El flag vive a
-- nivel de lista (todas las listas de una carpeta comparten el mismo valor).
alter table public.clickup_lists
  add column if not exists is_campaign boolean not null default false;

NOTIFY pgrst, 'reload schema';
