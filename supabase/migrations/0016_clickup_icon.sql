-- Icono (SVG data-URI) por carpeta de ClickUp. Se muestra en el avatar del
-- cliente/campaña; si está vacío, se cae al icono por defecto o a la inicial.
alter table public.clickup_lists
  add column if not exists icon text;

NOTIFY pgrst, 'reload schema';
