-- Tres formas de estar en el portal, en vez del binario plantilla/externo:
--
--   interno      Plantilla del estudio. Todo.
--   externo      No está contratado por nosotros (p. ej. gente de cliente que
--                trabaja con el equipo a diario), así que no ficha ni tiene
--                nómina, contrato o datos bancarios. El resto, como un interno.
--   colaborador  Entra solo para los proyectos que se le adjudican. Versión
--                mínima del portal: ni fichaje, ni Mi espacio, ni Equipo, ni
--                Políticas, ni Calendario. Tampoco ve cumpleaños ni vacaciones
--                del equipo: solo lo que atañe a sus proyectos.
alter table public.employees
  add column if not exists access_role text not null default 'interno'
    check (access_role in ('interno', 'externo', 'colaborador'));

-- Se hereda de is_external, que queda como espejo para no romper nada que aún
-- lo lea. La fuente de verdad pasa a ser access_role (ver src/lib/team.js).
update public.employees set access_role = 'externo' where is_external = true;
update public.employees set access_role = 'interno' where is_external = false;

notify pgrst, 'reload schema';
