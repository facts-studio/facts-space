-- Ficha legal completa del empleado (estilo Holded): filiación, contacto y banca.
alter table public.employees
  add column if not exists last_name text not null default '',        -- apellidos
  add column if not exists nationality text not null default '',
  add column if not exists gender text not null default '',
  add column if not exists marital_status text not null default '',
  add column if not exists id_doc_type text not null default '',      -- DNI/NIE/Pasaporte
  add column if not exists mobile text not null default '',
  add column if not exists city text not null default '',
  add column if not exists postal_code text not null default '',
  add column if not exists province text not null default '',
  add column if not exists country text not null default '',
  add column if not exists bank_name text not null default '',
  add column if not exists swift text not null default '';

NOTIFY pgrst, 'reload schema';
