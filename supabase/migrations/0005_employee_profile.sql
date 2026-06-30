-- Ficha laboral del empleado (datos personales y de contrato). Campos sensibles
-- (DNI, NSS, IBAN, salario) → visibles solo para el dueño y administración (RLS
-- de employees ya restringe la escritura a admin; la lectura del directorio es
-- general, pero estos campos solo se muestran a dueño/admin en la app).
alter table public.employees
  add column if not exists dni text not null default '',
  add column if not exists nss text not null default '',          -- nº Seguridad Social
  add column if not exists iban text not null default '',
  add column if not exists phone text not null default '',
  add column if not exists address text not null default '',
  add column if not exists emergency_contact text not null default '',
  add column if not exists start_date date,                        -- fecha de alta
  add column if not exists contract_type text not null default '', -- indefinido/temporal/prácticas/becario
  add column if not exists weekly_hours numeric(4,1) not null default 40,
  add column if not exists gross_salary numeric(10,2) not null default 0;
