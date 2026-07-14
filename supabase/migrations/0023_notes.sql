-- Notas personales: bloc privado de cada empleado. NO trasciende a nadie más
-- (ni admin) — es su libreta. Puede ser texto libre o una checklist.
--   kind: 'text' | 'checklist'
--   body:  contenido de las notas de texto
--   items: [{ id, text, done }] para las checklists
create table if not exists public.notes (
  id           uuid primary key default gen_random_uuid(),
  employee_id  uuid not null references public.employees(id) on delete cascade,
  kind         text not null default 'text' check (kind in ('text', 'checklist')),
  title        text not null default '',
  body         text not null default '',
  items        jsonb not null default '[]'::jsonb,
  pinned       boolean not null default false,
  position     integer not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists notes_employee_idx on public.notes(employee_id);

alter table public.notes enable row level security;

-- SOLO el dueño (ni admin): es un bloc privado.
create policy notes_owner_all on public.notes
  for all to authenticated
  using (employee_id = public.current_employee_id())
  with check (employee_id = public.current_employee_id());

notify pgrst, 'reload schema';
