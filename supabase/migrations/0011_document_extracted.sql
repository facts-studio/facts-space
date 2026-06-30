-- Datos extraídos automáticamente de un documento (p. ej. factura): proveedor,
-- importe, fecha, etc. Se rellena con IA al subir/extraer.
alter table public.documents
  add column if not exists extracted jsonb;

NOTIFY pgrst, 'reload schema';
