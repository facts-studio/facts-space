-- Comunicación responsable → solicitante: marca de "el usuario ya ha visto la
-- decisión" (aprobada/rechazada). null = pendiente de ver → sale el aviso en
-- Inicio hasta que lo descarta. Se pone a null al (re)decidir, para que un
-- cambio de criterio vuelva a avisar.
alter table public.vacation_requests
  add column if not exists decision_seen_at timestamptz;

notify pgrst, 'reload schema';
