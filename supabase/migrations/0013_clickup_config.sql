-- Centro de control de ClickUp en el admin.
-- clickup_lists: espejo de la jerarquía (Proyecto=carpeta × Disciplina=lista) con
--   un flag `visible` que decide qué entra al portal. Se rellena con "Sincronizar".
-- clickup_members: correspondencia usuario ClickUp ↔ empleado (para asignar y
--   mostrar avatares). Se rellena en la fase de creación de tareas.

create table if not exists public.clickup_lists (
  id          uuid primary key default gen_random_uuid(),
  list_id     text unique not null,
  list_name   text not null,
  folder_id   text,
  folder_name text,             -- proyecto (Unfiltrade, TradingLab, …)
  space_id    text,
  space_name  text,
  discipline  text,             -- Management | Copy | Social Media | Design | UX/UI | (otra)
  task_count  int default 0,
  visible     boolean not null default false,
  sort        int default 0,
  synced_at   timestamptz default now(),
  created_at  timestamptz default now()
);

create table if not exists public.clickup_members (
  id               uuid primary key default gen_random_uuid(),
  clickup_user_id  text unique not null,
  clickup_email    text,
  clickup_username text,
  employee_id      uuid references public.employees(id) on delete set null,
  created_at       timestamptz default now()
);

alter table public.clickup_lists   enable row level security;
alter table public.clickup_members enable row level security;

-- Lectura para cualquier usuario autenticado (el portal necesita saber qué listas
-- están activas); escritura solo admin.
create policy clickup_lists_select on public.clickup_lists
  for select to authenticated using (true);
create policy clickup_lists_admin_write on public.clickup_lists
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy clickup_members_select on public.clickup_members
  for select to authenticated using (true);
create policy clickup_members_admin_write on public.clickup_members
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

NOTIFY pgrst, 'reload schema';
