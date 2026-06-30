-- ── Storage: bucket público para las fotos de empleados ──────────────────────
-- Público para poder mostrar el avatar con <img src> en todo el portal
-- (directorio, calendario, fichas) sin URLs firmadas. Escritura solo admin.
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "avatars public read" on storage.objects
  for select using (bucket_id = 'avatars');

create policy "avatars admin insert" on storage.objects
  for insert to authenticated with check (bucket_id = 'avatars' and public.is_admin());

create policy "avatars admin update" on storage.objects
  for update to authenticated using (bucket_id = 'avatars' and public.is_admin());

create policy "avatars admin delete" on storage.objects
  for delete to authenticated using (bucket_id = 'avatars' and public.is_admin());
