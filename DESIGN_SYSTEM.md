# Design System — F*cts Space

Sistema de diseño del portal. **Regla de oro: no se escriben class strings de UI sueltos.**
Toda superficie, botón, campo, píldora o métrica sale de una primitiva. Si el patrón
no existe como primitiva, se crea aquí antes de usarlo — así el sistema se enriquece en
vez de divergir.

## Estética (marca)
- **Negros y cremas, nunca verde.**
- **Botones sin peso: nada de negro macizo ni outlines.** La acción primaria es un
  relleno TONAL suave (`bg-ink/[0.07] text-ink`, ver `.btn-primary`); el secundario,
  relleno crema (`.btn-ghost`), sin borde. La jerarquía sale del tono del relleno.
  Evita outlines/bordes salvo donde son necesarios (campos de formulario).
- **Cabecera de pantalla = `ScreenHeader`** (breadcrumb `KICKER / Título` + acciones a
  la derecha), no el título serif grande. Excepción: Inicio mantiene su cabecera propia.
- Superficies suaves, `rounded-2xl`, sin bordes duros ni cajas blancas (`card` paper prohibido para layout).
- Tipografía display = Bricolage (`font-display`), regular 400, tracking negativo.

## Fundación (no tocar sin motivo)
- **Colores / tipografía / sombra / radios:** tokens en [tailwind.config.js](tailwind.config.js) +
  variables en [src/app/globals.css](src/app/globals.css). Conmutan light/dark solos.
- Usar SIEMPRE tokens (`bg-surface`, `text-ink`, `text-mutedSoft`…), nunca hex.
- Opacidad de superficies estandarizada: **/55** (superficie de sección), **/40** (sub-superficie),
  **/65** (destacado). No inventar /45, /50, /60 nuevos.

## Primitivas — `src/components/ui/`
Importar desde el barrel: `import { Surface, Stat, Badge, Field, Input, Tabs, Button } from "@/components/ui";`

| Primitiva | Para qué | Sustituye a |
|-----------|----------|-------------|
| `Surface` | Contenedor/tarjeta (`variant` soft·muted·raised·dashed, `pad`) | `rounded-2xl bg-surface/55 p-6` suelto |
| `SectionHeader` | Eyebrow + acción a la derecha | `flex justify-between … section-eyebrow` |
| `Stat` | Métrica (eyebrow + número display) | `Stat` inline de fichaje/mi-espacio/empleado |
| `Badge` | Píldora de estado semántica (`kind`) | `bg-warnSoft/60 text-warn` a mano |
| `Field` + `Input`/`Select` | Campo de formulario (label micro + control) | `Labeled`/`Fld`/`Field` inline |
| `Tabs` | Conmutador segmentado | grupo de botones `bg-bg text-ink shadow-sm` |
| `DataList`/`DataRow` | Lista clave/valor con divisor | filas `flex justify-between py-2.5` |
| `EmptyState` | Lista sin datos | `bg-surface2/40 px-4 py-12 text-center` |
| `Button` | Botón (`variant`, `size`) | `.btn-primary` string / botones a mano |

Clases de componente en `globals.css` (`.btn-*`, `.input`, `.pill`, `.section-title`,
`.section-eyebrow`, `.h-page`, `.table`) siguen válidas; las primitivas las envuelven.

## Cómo crear UI nueva (checklist)
1. ¿Existe una primitiva? Úsala.
2. ¿Es una variante de una existente? Añade la variante a esa primitiva (nueva `variant`/`kind`).
3. ¿Es un patrón nuevo repetible? Créalo en `src/components/ui/`, expórtalo en `index.js`,
   añádelo a la tabla de arriba.
4. Solo si es verdaderamente único y de un solo uso → componente local en la pantalla,
   consumiendo tokens/primitivas por dentro. Nunca hex ni tamaños `text-[Npx]` arbitrarios.

## Anti-patrones (rechazar en review)
- Colores hex en JSX o CSS de pantalla.
- `rounded-2xl bg-surface/… p-…` copiado en vez de `<Surface>`.
- Nuevos `bg-*Soft/… text-*` de estado fuera de `Badge`/`BADGE_KINDS`.
- Tabs / stats / campos reimplementados a mano.
- Radios/paddings mezclados en controles (usar `controlCls`).
