-- Espejo de vacaciones/ausencias en ClickUp (lista Agenda F*cts › Vacaciones).
-- Guardamos el id de la tarea creada para poder actualizar su estado o borrarla
-- cuando la solicitud cambia en la intranet (que sigue siendo la fuente).
alter table public.vacation_requests
  add column if not exists clickup_task_id text;

NOTIFY pgrst, 'reload schema';
