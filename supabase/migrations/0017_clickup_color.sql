-- Color elegido del cliente/campaña (key de la paleta: mostaza, azul, salvia…).
-- Vacío = color automático por nombre.
alter table public.clickup_lists
  add column if not exists color text;

NOTIFY pgrst, 'reload schema';
