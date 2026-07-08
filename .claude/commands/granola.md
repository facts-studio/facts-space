---
description: Puente Granola → ClickUp / portal. Lee reuniones de Granola y ayuda a convertirlas en tareas o notas.
---

# /granola — de reunión a acción

Eres el puente entre **Granola** (notas/transcripciones de reuniones) y el trabajo del equipo
(ClickUp + portal F*cts). Este comando NO conecta Granola (eso es OAuth vía `/mcp` o claude.ai →
Connectors, a nivel de cuenta). Aquí ya lo usas para sacar valor.

Argumento opcional `$ARGUMENTS`: qué reunión o filtro (p. ej. "última de TradingLab", "hoy",
"reunión de estrategia"). Si viene vacío, ofrece las reuniones recientes para elegir.

## Paso 0 — ¿Está Granola disponible?
Comprueba las tools de Granola con **ToolSearch** (query: `granola meetings`). 
- Si **no aparecen**: dile al usuario que active el conector **Granola** en una sesión interactiva
  (`/mcp` → autorizar) o en **claude.ai → Settings → Connectors**, y **detente** ahí. No inventes contenido.
- Si **aparecen**: continúa.

## Paso 1 — Traer la reunión
- Si `$ARGUMENTS` identifica una reunión, búscala; si no, lista las **recientes** (título + fecha)
  y pide al usuario cuál.
- Trae la **transcripción/notas** de la elegida.

## Paso 2 — Resumen accionable
Devuelve, conciso y en español:
- **Resumen** (3–5 líneas): decisiones y temas clave.
- **Action items**: lista con, si se deduce, **responsable** (email @fcts.studio) y **cliente/proyecto**
  (Unfiltrade, TradingLab, Flickflow, The BenchMark, Alex Ruiz, F*cts Studio, o campaña).

## Paso 3 — Convertir en acción (con confirmación)
Ofrece, y ejecuta SOLO tras OK del usuario:
- **Crear tareas en ClickUp** a partir de los action items. Usa la API v2 con el token del
  `.env.local` (`CLICKUP_API_TOKEN`, `CLICKUP_TEAM_ID`). Antes de crear, **muestra el plan**
  (qué tarea, en qué lista/carpeta, asignado, fecha) y confirma la **lista destino**.
  - Mapea cliente→carpeta y disciplina→lista (Management/Copy/Social Media/Design/UX-UI).
  - Endpoint: `POST /api/v2/list/{list_id}/task` con `{ name, description, assignees, due_date, status }`.
- **Dejar notas en el portal**: de momento no hay endpoint de notas; si el usuario lo pide,
  proponer crearlo (tabla Supabase + módulo) — no lo inventes.

## Reglas
- Escribe en ClickUp SOLO con confirmación explícita; empieza por poco y verifica.
- No expongas el token. No conectes nada tú (OAuth lo hace el usuario).
- Marca de estilo del portal: negros y cremas; ver DESIGN_SYSTEM.md si tocas UI.
