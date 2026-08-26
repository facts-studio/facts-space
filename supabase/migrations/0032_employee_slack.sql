-- Vínculo explícito empleado ↔ perfil de Slack.
-- Guardamos el id de usuario de Slack (U…) para poder relacionar los tickets de
-- los canales compartidos con la ficha: saber cuáles son tuyos, cuáles de tu
-- equipo y cuáles siguen sin dueño. Sin vínculo, el empleado no aparece en esas
-- funciones (igual que pasa con clickup_group_id).
alter table public.employees
  add column if not exists slack_user_id text;

notify pgrst, 'reload schema';
