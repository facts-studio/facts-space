-- Tokens personales de acceso al portal desde fuera (ChatGPT, Claude…).
--
-- La clave: el token ES la persona. Quien lo use ve exactamente lo que vería
-- entrando al portal con su cuenta —ni más ni menos— y escribe con sus mismos
-- permisos. No hay un token de servicio que lo abra todo: eso convertiría
-- cualquier fuga en una llave maestra a nóminas y datos personales.
--
-- Se guarda solo el HASH. El token en claro se enseña una vez al crearlo y no
-- se puede volver a ver; si se pierde, se revoca y se crea otro.
create table if not exists public.api_tokens (
  id           uuid primary key default gen_random_uuid(),
  employee_id  uuid not null references public.employees(id) on delete cascade,
  nombre       text not null default 'ChatGPT',
  token_hash   text not null unique,
  -- Prefijo visible (primeros caracteres) para reconocerlo en la lista sin
  -- guardar el secreto: "fsp_a1b2…".
  pista        text not null default '',
  created_at   timestamptz not null default now(),
  last_used_at timestamptz,
  revoked_at   timestamptz
);
create index if not exists api_tokens_employee_idx on public.api_tokens(employee_id);

alter table public.api_tokens enable row level security;

-- Cada uno gestiona los suyos. Ni siquiera admin los lee: no hay nada que
-- mirar (solo hashes) y sí algo que respetar.
create policy api_tokens_owner_all on public.api_tokens
  for all to authenticated
  using (employee_id = public.current_employee_id())
  with check (employee_id = public.current_employee_id());

notify pgrst, 'reload schema';
