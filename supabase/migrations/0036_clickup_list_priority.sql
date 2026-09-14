-- La PRIORIDAD de una lista de ClickUp es, en el space "F*cts Studio", la fase
-- del proyecto (la mantiene F*cts Bitácora al crear y mover proyectos):
--   urgent → En curso / Revisión      normal → Propuesta
--   high   → Aprobado                 low    → Lead, Bloqueado, Entregado…
--   null   → NO es un proyecto (las listas "General" de cada cliente)
-- El estado exacto y quién lo lleva van en la cabecera de la descripción
-- ([estado: …] / [colaborador: …]); ver src/lib/projects.js.
alter table public.clickup_lists
  add column if not exists list_priority text;

notify pgrst, 'reload schema';
