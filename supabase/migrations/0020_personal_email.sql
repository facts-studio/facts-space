-- Email personal del empleado (distinto del de empresa). Editable en la ficha.
alter table public.employees add column if not exists personal_email text;

-- Rellenar con los datos de Holded.
update public.employees set personal_email = 'mariola01333@gmail.com'       where email = 'mariola@fcts.studio';
update public.employees set personal_email = 'carlesbusquests96@gmail.com'  where email = 'carles@fcts.studio';
update public.employees set personal_email = 'alvaro.rodriguez.vigil@gmail.com' where email = 'alvaro@fcts.studio';
update public.employees set personal_email = 'cadevall.alba@gmail.com'      where email = 'alba@fcts.studio';
update public.employees set personal_email = 'carlapenella@gmail.com'       where email = 'carla@fcts.studio';

NOTIFY pgrst, 'reload schema';
