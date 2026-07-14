-- Preferencias de interfaz por usuario (viajan con la cuenta, no con el
-- navegador): tema claro/oscuro y si el menú lateral queda recogido.
--   theme: 'light' | 'dark' | null (null = seguir el sistema).
--   nav_collapsed: true = menú recogido.
alter table public.employees
  add column if not exists theme         text,
  add column if not exists nav_collapsed boolean not null default false;

notify pgrst, 'reload schema';
