@AGENTS.md

# F*cts Space — Portal interno (contexto del proyecto)

Portal interno de **F*cts Studio** para sustituir a **Holded** en RR.HH.
Next.js 16.2.9 + React 19 + Tailwind 3.4 + **Supabase** (auth Google `@fcts.studio`).
Repo `Alvarofcts/fcts-portal`. Trabajo en rama `feat/vacaciones-fichaje`.

## Marca y estética (IMPORTANTE)
- Paleta **negros y cremas**, NO verde. Acción primaria = `btn-primary` (negro `bg-ink text-bg`).
  Acentos = ink/neutros (tokens `brand` ya remapeados a negro/crema en `globals.css`).
- Superficies suaves: contenedores `rounded-2xl bg-surface/55 p-6`, filas `bg-surface2/40`,
  títulos `section-eyebrow`. **Sin** la clase `card` (paper blanco) ni `border`/outline por todo.
  Referencia buena: `recursos/page.js`, `VacacionesChecker.jsx`, módulos de fichaje/admin.

## Arquitectura
- Auth: `getCurrentEmployee()` en `src/lib/data/helpers.js`; RLS con `current_employee_id()` / `is_admin()`.
- Lecturas en `src/lib/data/*`, mutaciones (Server Actions `"use server"`) en `src/lib/actions/*`.
- Fechas sin librerías en `src/lib/dates.js` (`workingDaysBetween`, `madrid*`, `monthEndISO`,
  `eachDayISO`, `formatDuration`). OJO: usar `monthEndISO(month)`, nunca `${month}-31`.
- Fallback a mock (`src/lib/mock.js`) cuando no hay Supabase (preview).
- Archivos en **Supabase Storage** bucket privado `hr-docs`, descarga por signed URL.

## Estado (hecho)
- Calendario (eventos unificados) + solicitar ausencias desde el calendario con tipo
  (vacaciones/permiso/baja) y veredicto de política (solo vacaciones).
- Fichaje: manual + autorrellenar (salta findes/festivos/cumpleaños/vacaciones) + historial
  día a día + validación + export CSV. Estado `pending/validated`.
- Vacaciones: saldo (solo type=vacaciones), aprobar/rechazar.
- Ficha del empleado (employees ampliado) + **Mi espacio** (Resumen/Ausencias/Datos/Nóminas/Documentos).
- **Admin**: pestañas Aprobaciones (vacaciones+fichaje), Equipo (lista → ficha por persona en
  `/admin/[id]`), Calendario laboral, Informes. Documentos viven DENTRO de cada persona.
- Inicio: aviso al admin de solicitudes pendientes en el panel derecho.

## Pendiente
- Justificantes adjuntos en ausencias (subida a `hr-docs` como documentos).
- Fase 9: pulido UX/UI, avisos in-app, responsive, repaso RGPD.
- Página `/vacaciones` propia (o consolidar en Mi espacio).

## Supabase
- Proyecto real `facts-space` (ref `syhotifklflfozcograt`). Claves en `.env.local` (no commitear).
- Migraciones en `supabase/migrations/` (0001–0007). Tras añadir columnas: `NOTIFY pgrst, 'reload schema';`.
- Para datos reales: `.env.local` con URL+anon key y `NEXT_PUBLIC_AUTH_DISABLED=false`.

## Ejecutar
- `npm run dev` (puerto 3000). Login Google `@fcts.studio`. `npm run build` + `npx eslint` antes de commitear.
