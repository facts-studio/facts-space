-- Documentos de RR.HH. (nóminas, contratos, otros) por empleado.
create table if not exists public.documents (
  id           uuid primary key default gen_random_uuid(),
  employee_id  uuid not null references public.employees(id) on delete cascade,
  category     text not null check (category in ('nomina','contrato','documento')),
  title        text not null default '',
  period       text not null default '',     -- "YYYY-MM" para nóminas
  storage_path text not null,
  uploaded_by  uuid references public.employees(id) on delete set null,
  created_at   timestamptz not null default now()
);
create index if not exists documents_employee_idx on public.documents(employee_id);

alter table public.documents enable row level security;

-- Lectura: el dueño y admin. Escritura: solo admin.
create policy documents_select on public.documents
  for select to authenticated using (
    employee_id = public.current_employee_id() or public.is_admin()
  );
create policy documents_admin_write on public.documents
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ── Storage: bucket privado para los archivos ────────────────────────────────
insert into storage.buckets (id, name, public)
values ('hr-docs', 'hr-docs', false)
on conflict (id) do nothing;

-- Ruta de objeto: "{employee_id}/{category}/{archivo}". El primer segmento es el
-- employee_id, que usamos para permitir la lectura al dueño.
create policy "hr-docs read own or admin" on storage.objects
  for select to authenticated using (
    bucket_id = 'hr-docs'
    and ((storage.foldername(name))[1] = public.current_employee_id()::text or public.is_admin())
  );
create policy "hr-docs admin insert" on storage.objects
  for insert to authenticated with check (bucket_id = 'hr-docs' and public.is_admin());
create policy "hr-docs admin update" on storage.objects
  for update to authenticated using (bucket_id = 'hr-docs' and public.is_admin());
create policy "hr-docs admin delete" on storage.objects
  for delete to authenticated using (bucket_id = 'hr-docs' and public.is_admin());

NOTIFY pgrst, 'reload schema';
