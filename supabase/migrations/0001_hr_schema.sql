-- F*cts Space — Esquema RR.HH. (vacaciones + fichaje)
-- Sustituye el mock de mock.js por datos reales en Supabase.
-- Ejecutar en el SQL editor de Supabase o con `supabase db push`.

-- ─────────────────────────────────────────────────────────────────────────────
-- Tablas
-- ─────────────────────────────────────────────────────────────────────────────

-- Empleados (sustituye al array TEAM). Se enlaza con auth.users por email
-- en el primer login (auth_user_id).
create table if not exists public.employees (
  id                 uuid primary key default gen_random_uuid(),
  auth_user_id       uuid references auth.users(id) on delete set null,
  name               text not null,
  email              text not null unique,
  role               text not null default '',
  color              text not null default 'brand',
  photo              text not null default '',
  birthday           date,
  manager_id         uuid references public.employees(id) on delete set null,
  is_admin           boolean not null default false,
  vacation_allowance numeric(4,1) not null default 23,
  active             boolean not null default true,
  created_at         timestamptz not null default now()
);

-- Solicitudes de vacaciones.
create table if not exists public.vacation_requests (
  id            uuid primary key default gen_random_uuid(),
  employee_id   uuid not null references public.employees(id) on delete cascade,
  start_date    date not null,
  end_date      date not null,
  half_day      boolean not null default false,
  working_days  numeric(4,1) not null default 0,
  note          text not null default '',
  status        text not null default 'pending'
                  check (status in ('pending','approved','rejected','cancelled')),
  decided_by    uuid references public.employees(id) on delete set null,
  decided_at    timestamptz,
  decision_note text not null default '',
  created_at    timestamptz not null default now(),
  check (end_date >= start_date)
);
create index if not exists vacation_requests_employee_idx on public.vacation_requests(employee_id);
create index if not exists vacation_requests_status_idx on public.vacation_requests(status);

-- Fichaje (registro de jornada). Append-only: las correcciones se hacen creando
-- una nueva fila (corrected_from) y marcando la antigua como voided; nunca se
-- borra físicamente (requisito legal de conservación 4 años).
create table if not exists public.time_entries (
  id             uuid primary key default gen_random_uuid(),
  employee_id    uuid not null references public.employees(id) on delete cascade,
  clock_in       timestamptz not null,
  clock_out      timestamptz,
  work_date      date not null,
  source         text not null default 'web',
  corrected_from uuid references public.time_entries(id) on delete set null,
  voided         boolean not null default false,
  created_at     timestamptz not null default now(),
  check (clock_out is null or clock_out >= clock_in)
);
create index if not exists time_entries_employee_date_idx on public.time_entries(employee_id, work_date);

-- Eventos de calendario que NO se derivan de otra tabla: festivos e hitos.
-- (Las vacaciones salen de vacation_requests; los cumpleaños, de employees.birthday.)
create table if not exists public.calendar_events (
  id         uuid primary key default gen_random_uuid(),
  type       text not null check (type in ('festivo','hito')),
  title      text not null,
  start_date date not null,
  end_date   date not null,
  created_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Helpers de seguridad (SECURITY DEFINER para poder leer employees dentro de RLS)
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function public.current_employee_id()
returns uuid
language sql stable security definer set search_path = public
as $$
  select id from public.employees where auth_user_id = auth.uid() limit 1;
$$;

create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select coalesce(
    (select is_admin from public.employees where auth_user_id = auth.uid() limit 1),
    false
  );
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- RLS
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.employees        enable row level security;
alter table public.vacation_requests enable row level security;
alter table public.time_entries      enable row level security;
alter table public.calendar_events   enable row level security;

-- employees: todos los autenticados pueden leer el directorio (calendario/equipo);
-- solo admin escribe.
create policy employees_select on public.employees
  for select to authenticated using (true);
create policy employees_admin_write on public.employees
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- vacation_requests:
--  - lectura: las aprobadas las ve todo el equipo (calendario); las propias y las
--    de los reportes directos las ve el dueño/manager; admin lo ve todo.
create policy vacation_select on public.vacation_requests
  for select to authenticated using (
    status = 'approved'
    or employee_id = public.current_employee_id()
    or exists (
      select 1 from public.employees e
      where e.id = vacation_requests.employee_id
        and e.manager_id = public.current_employee_id()
    )
    or public.is_admin()
  );
--  - alta: solo para uno mismo, en estado pending.
create policy vacation_insert on public.vacation_requests
  for insert to authenticated with check (
    employee_id = public.current_employee_id() and status = 'pending'
  );
--  - cambios: el dueño (cancelar) o el manager/admin (decidir).
create policy vacation_update on public.vacation_requests
  for update to authenticated using (
    employee_id = public.current_employee_id()
    or exists (
      select 1 from public.employees e
      where e.id = vacation_requests.employee_id
        and e.manager_id = public.current_employee_id()
    )
    or public.is_admin()
  );

-- time_entries: cada uno los suyos; admin todos. Sin delete (append-only).
create policy time_select on public.time_entries
  for select to authenticated using (
    employee_id = public.current_employee_id() or public.is_admin()
  );
create policy time_insert on public.time_entries
  for insert to authenticated with check (
    employee_id = public.current_employee_id()
  );
create policy time_update on public.time_entries
  for update to authenticated using (
    employee_id = public.current_employee_id() or public.is_admin()
  );

-- calendar_events: lectura para todos; escritura solo admin.
create policy calendar_select on public.calendar_events
  for select to authenticated using (true);
create policy calendar_admin_write on public.calendar_events
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
