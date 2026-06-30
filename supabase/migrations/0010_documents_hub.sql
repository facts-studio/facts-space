-- Hub de documentos: permite documentos de empresa (sin empleado) y más
-- categorías (facturas, legales).
alter table public.documents alter column employee_id drop not null;
alter table public.documents drop constraint if exists documents_category_check;
alter table public.documents add constraint documents_category_check
  check (category in ('nomina','contrato','documento','factura','legal'));

NOTIFY pgrst, 'reload schema';
