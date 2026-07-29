-- Semilla inicial de "Sites": las landings/webs activas del estudio. Datos
-- (título, descripción, preview) tomados del Open Graph de cada web. Idempotente:
-- no re-inserta una URL que ya exista.
insert into public.sites (url, title, description, client, tags, image, active, position)
select * from (values
  ('https://www.tradinglab.es/',
   'TradingLab — Aprende a operar con un sistema validado',
   'La academia de trading que te guía paso a paso hasta operar con consistencia.',
   'TradingLab', '["landing"]'::jsonb, null, true, 0),

  ('https://tlab.es/sesion-estrategica',
   'TradingLab — Sesión estratégica',
   '', 'TradingLab', '["landing","captación"]'::jsonb, null, true, 1),

  ('https://www.tradingmind.es/',
   'TradingMind — Trading desde otra perspectiva',
   '', 'TradingMind', '["landing"]'::jsonb, null, true, 2),

  ('https://evento.tradinglab.es/',
   'AcademyLab VLC — Acceso online al evento',
   'Todo el contenido del evento AcademyLab VLC, ahora online: ponencias, ejercicios por niveles, Trading Plan y psicotrading. +5h de contenido para avanzar en tu operativa a tu ritmo.',
   'TradingLab', '["evento"]'::jsonb,
   'https://evento.tradinglab.es/fotos/work2.jpg', true, 3),

  ('https://thebenchmark.es/',
   'TheBenchmark',
   '', 'The BenchMark', '["web"]'::jsonb, null, true, 4),

  ('https://portal.thebenchmark.es/',
   'TheBenchmark News',
   'Portal de noticias financieras: trading, criptomonedas, mercados y macroeconomía. Análisis y última hora para inversores y traders.',
   'The BenchMark', '["portal"]'::jsonb,
   'https://vraafbmijwskyjemtnxd.supabase.co/storage/v1/object/public/article-images/seo.png', true, 5),

  ('https://flickflow.com/',
   'Flickflow',
   'An interconnected environment where AI filters and relates financial data for you. Understand the market without noise and get a complete, actionable view in one clean interface.',
   'Flickflow', '["web"]'::jsonb,
   'https://framerusercontent.com/assets/0MVhrHgFcUX3Q5ee1rXVBE7aTl0.png', true, 6),

  ('https://www.madebyfacts.com/',
   'F*cts Studio',
   'We build projects that think, feel and make sense. For those who want to make noise and actually have something to say. No buzzwords. No bullshit. Just F*cts.',
   'F*cts Studio', '["estudio"]'::jsonb,
   'https://www.madebyfacts.com/_assets/v11/3c867df1becc87509ddc22df74a47375e32451d5.png', true, 7)
) as v(url, title, description, client, tags, image, active, position)
where not exists (select 1 from public.sites s where s.url = v.url);

notify pgrst, 'reload schema';
