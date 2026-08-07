-- Análisis de tráfico por web (Google Analytics 4).
-- Guardamos el id numérico de la propiedad GA4 de cada web; el portal lee las
-- métricas por la GA Data API con una cuenta de servicio (credenciales en el
-- servidor, ver lib/data/analytics.js).
alter table public.sites
  add column if not exists ga_property_id text;

notify pgrst, 'reload schema';
