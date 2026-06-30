-- F*cts Space — Seed inicial desde el mock (mock.js).
-- Idempotente: usa ON CONFLICT por email / no duplica si se reejecuta.

-- ── Empleados ────────────────────────────────────────────────────────────────
insert into public.employees (name, email, role, color, photo, birthday, is_admin) values
  ('Álvaro',  'alvaro@fcts.studio',  'Director Creativo & Head UX/UI',     'brand',   '/team/alvaro.jpg',  '1990-05-05', true),
  ('Alba',    'alba@fcts.studio',    'Copywriter & Trader',                'info',    '/team/alba.jpg',    '1990-03-06', false),
  ('Carla',   'carla@fcts.studio',   'Social Media Manager',               'violet',  '/team/carla.jpg',   '1990-08-03', false),
  ('Carles',  'carles@fcts.studio',  'Product Designer & Front Developer', 'warn',    '/team/carles.jpg',  '1990-07-30', false),
  ('Lucas',   'lucas@fcts.studio',   'CCO & Director del Área de Producto','success', '/team/lucas.jpg',   '1993-09-30', false),
  ('Mariola', 'mariola@fcts.studio', 'Graphic Designer',                   'info',    '/team/mariola.jpg', '1990-09-10', false),
  ('Samu',    'samu@fcts.studio',    'Product Developer',                  'brand',   '/team/samu.jpg',    '1994-03-03', false)
on conflict (email) do nothing;

-- Manager por defecto: Álvaro aprueba a todos (editable luego en /admin).
update public.employees
set manager_id = (select id from public.employees where email = 'alvaro@fcts.studio')
where email <> 'alvaro@fcts.studio' and manager_id is null;

-- ── Festivos (Cataluña/Barcelona 2026) e hitos ───────────────────────────────
insert into public.calendar_events (type, title, start_date, end_date) values
  ('festivo', 'Año Nuevo',                       '2026-01-01', '2026-01-01'),
  ('festivo', 'Día de Reyes',                    '2026-01-06', '2026-01-06'),
  ('festivo', 'Viernes Santo',                   '2026-04-03', '2026-04-03'),
  ('festivo', 'Lunes de Pascua',                 '2026-04-06', '2026-04-06'),
  ('festivo', 'Día del Trabajador',              '2026-05-01', '2026-05-01'),
  ('festivo', 'San Juan',                        '2026-06-24', '2026-06-24'),
  ('festivo', 'Asunción de la Virgen',           '2026-08-15', '2026-08-15'),
  ('festivo', 'Día Nacional de Cataluña',        '2026-09-11', '2026-09-11'),
  ('festivo', 'La Mercè',                        '2026-09-24', '2026-09-24'),
  ('festivo', 'Fiesta nacional de España',       '2026-10-12', '2026-10-12'),
  ('festivo', 'Día de Todos los Santos',         '2026-11-01', '2026-11-01'),
  ('festivo', 'Día de la Constitución',          '2026-12-06', '2026-12-06'),
  ('festivo', 'Día de la Inmaculada Concepción', '2026-12-08', '2026-12-08'),
  ('festivo', 'Navidad',                         '2026-12-25', '2026-12-25'),
  ('festivo', 'San Esteban',                     '2026-12-26', '2026-12-26'),
  ('hito',    'Black Friday',                    '2026-11-27', '2026-11-27')
on conflict do nothing;

-- ── Vacaciones existentes (migradas como aprobadas) ──────────────────────────
-- working_days = días laborables del rango (excluye findes y festivos ya sembrados).
insert into public.vacation_requests
  (employee_id, start_date, end_date, working_days, status, note, decided_at)
select
  e.id,
  v.start_date,
  v.end_date,
  (select count(*) from generate_series(v.start_date, v.end_date, interval '1 day') g
     where extract(dow from g) not in (0, 6)
       and g::date not in (select start_date from public.calendar_events where type = 'festivo')),
  'approved',
  v.note,
  now()
from (values
  ('Mariola', date '2026-02-02', date '2026-02-02', ''),
  ('Carles',  date '2026-02-27', date '2026-02-27', ''),
  ('Alba',    date '2026-03-09', date '2026-03-09', ''),
  ('Carles',  date '2026-03-13', date '2026-03-13', ''),
  ('Mariola', date '2026-03-16', date '2026-03-16', ''),
  ('Carles',  date '2026-03-23', date '2026-03-23', ''),
  ('Álvaro',  date '2026-04-01', date '2026-04-14', ''),
  ('Carla',   date '2026-04-13', date '2026-04-13', ''),
  ('Alba',    date '2026-04-30', date '2026-04-30', ''),
  ('Carla',   date '2026-05-07', date '2026-05-08', ''),
  ('Mariola', date '2026-06-22', date '2026-06-22', 'Día libre'),
  ('Alba',    date '2026-06-22', date '2026-06-23', ''),
  ('Mariola', date '2026-06-25', date '2026-06-26', ''),
  ('Carla',   date '2026-06-29', date '2026-06-30', ''),
  ('Mariola', date '2026-07-16', date '2026-07-23', ''),
  ('Alba',    date '2026-08-24', date '2026-08-28', ''),
  ('Mariola', date '2026-08-24', date '2026-08-28', ''),
  ('Alba',    date '2026-08-31', date '2026-08-31', ''),
  ('Alba',    date '2026-09-01', date '2026-09-04', ''),
  ('Alba',    date '2026-09-14', date '2026-09-14', ''),
  ('Alba',    date '2026-10-13', date '2026-10-13', ''),
  ('Mariola', date '2026-12-07', date '2026-12-07', ''),
  ('Alba',    date '2026-12-07', date '2026-12-07', ''),
  ('Carles',  date '2026-07-29', date '2026-07-29', ''),
  ('Carles',  date '2026-07-31', date '2026-07-31', ''),
  ('Carles',  date '2026-08-03', date '2026-08-03', ''),
  ('Carles',  date '2026-08-04', date '2026-08-04', '')
) as v(who, start_date, end_date, note)
join public.employees e on e.name = v.who
where not exists (
  select 1 from public.vacation_requests r
  where r.employee_id = e.id and r.start_date = v.start_date and r.end_date = v.end_date
);
