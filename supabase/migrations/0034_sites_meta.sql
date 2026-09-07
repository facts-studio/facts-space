-- Foto fija del SEO/GEO de cada web, para no volver a rastrearla en cada carga.
--   meta    → lo que devuelve analyzeSiteMeta (títulos, descripciones, OG,
--             JSON-LD, llms.txt, robots…)
--   meta_at → cuándo se rastreó, para saber si el dato está viejo
-- Es una caché, no la verdad: la verdad está en la web. Se refresca con el
-- botón "Recargar meta" de Recursos › Websites.
alter table public.sites
  add column if not exists meta jsonb,
  add column if not exists meta_at timestamptz;

notify pgrst, 'reload schema';
