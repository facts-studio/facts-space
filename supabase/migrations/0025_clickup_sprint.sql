-- Sprint: una LISTA concreta dentro de un cliente que agrupa un mini-proyecto
-- temporal (p. ej. "Sprint Academia" dentro de TradingLab).
--
-- Ojo a la diferencia con is_campaign: esa marca, aunque viva por lista, se
-- aplica a TODA la carpeta (setFolderCampaign) → el cliente entero es temporal
-- (Evento 2026). is_sprint es de verdad por lista: el cliente sigue siendo el
-- dueño (project = la carpeta) y el sprint es una capa dentro.
alter table public.clickup_lists
  add column if not exists is_sprint boolean not null default false;

notify pgrst, 'reload schema';
