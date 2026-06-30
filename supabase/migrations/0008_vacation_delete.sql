-- Permite eliminar solicitudes: el propio dueño, el manager del solicitante o admin.
create policy vacation_delete on public.vacation_requests
  for delete to authenticated using (
    employee_id = public.current_employee_id()
    or exists (
      select 1 from public.employees e
      where e.id = vacation_requests.employee_id
        and e.manager_id = public.current_employee_id()
    )
    or public.is_admin()
  );
