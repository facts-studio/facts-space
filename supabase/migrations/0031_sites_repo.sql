-- Repositorio de cada web (URL del repo de Git). Se muestra en la ficha de la
-- web y lo edita administración desde el formulario.
alter table public.sites
  add column if not exists repo_url text;

notify pgrst, 'reload schema';
