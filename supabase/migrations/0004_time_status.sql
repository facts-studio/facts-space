-- Estado de validación del fichaje: 'pending' hasta que RR.HH./admin lo valida.
alter table public.time_entries
  add column if not exists status text not null default 'pending'
    check (status in ('pending', 'validated'));
