-- "Sites": las landings/webs activas del estudio, en un escaparate dentro de
-- Recursos. Curado a mano por administración; el equipo solo las consulta.
--   client → nombre del cliente asociado (opcional), para tag y filtro
--   color  → key de la paleta de cliente (client-palette); opcional
--   tags   → etiquetas libres para filtrar (["landing","saas",…])
--   image  → preview: og:image de la propia web o una captura subida al bucket
--   active → solo las activas salen en el escaparate
create table if not exists public.sites (
  id           uuid primary key default gen_random_uuid(),
  url          text not null,
  title        text not null default '',
  description  text not null default '',
  client       text,
  color        text,
  tags         jsonb not null default '[]'::jsonb,
  image        text,
  active       boolean not null default true,
  position     integer not null default 0,
  created_by   uuid references public.employees(id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists sites_active_idx on public.sites(active);

alter table public.sites enable row level security;

-- Lectura: todo el equipo autenticado. Escritura: solo administración.
create policy sites_read on public.sites
  for select to authenticated using (true);
create policy sites_admin_write on public.sites
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ── Storage: bucket público para las capturas de las webs ────────────────────
-- Público para pintarlas con <img src> sin URLs firmadas. Escritura solo admin.
insert into storage.buckets (id, name, public)
values ('sites', 'sites', true)
on conflict (id) do nothing;

create policy "sites public read" on storage.objects
  for select using (bucket_id = 'sites');
create policy "sites admin insert" on storage.objects
  for insert to authenticated with check (bucket_id = 'sites' and public.is_admin());
create policy "sites admin update" on storage.objects
  for update to authenticated using (bucket_id = 'sites' and public.is_admin());
create policy "sites admin delete" on storage.objects
  for delete to authenticated using (bucket_id = 'sites' and public.is_admin());

notify pgrst, 'reload schema';
