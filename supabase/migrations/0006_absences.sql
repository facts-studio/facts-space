-- Generaliza vacation_requests a "ausencias": tipo, si es retribuida y ruta del
-- justificante. El saldo de vacaciones solo cuenta type='vacaciones'.
alter table public.vacation_requests
  add column if not exists type text not null default 'vacaciones'
    check (type in ('vacaciones','baja','permiso','asuntos_propios','teletrabajo','otro')),
  add column if not exists paid boolean not null default true,
  add column if not exists attachment_path text not null default '';

NOTIFY pgrst, 'reload schema';
