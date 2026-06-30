-- Enlaza automáticamente cada usuario de auth.users con su ficha de employees
-- (por email) en el primer login. Necesario para que RLS identifique a la persona
-- vía current_employee_id()/is_admin().

create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  update public.employees
  set auth_user_id = new.id
  where lower(email) = lower(new.email) and auth_user_id is null;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Enlaza también los que ya existieran en auth.users antes del trigger.
update public.employees e
set auth_user_id = u.id
from auth.users u
where lower(e.email) = lower(u.email) and e.auth_user_id is null;
