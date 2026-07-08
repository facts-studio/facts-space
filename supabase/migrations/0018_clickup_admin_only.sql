-- Tercer estado de una lista: "bloqueada" = visible solo para perfiles admin.
-- Estado efectivo: off (visible=false) · all (visible=true, admin_only=false)
--                  · admin (visible=true, admin_only=true).
alter table public.clickup_lists
  add column if not exists admin_only boolean not null default false;

NOTIFY pgrst, 'reload schema';
