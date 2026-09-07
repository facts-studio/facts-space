# mcp-clickup

Servidor MCP que le da a F*ctito acceso al ClickUp del estudio: proyectos
(listas configuradas en el portal), sprints, tareas y sus estados.

No habla con el portal por HTTP: lee **la misma configuración** que el portal
(`clickup_lists` en Supabase) y la API de ClickUp directamente. Así el
asistente ve exactamente lo que ve la pantalla de Tareas, incluida la
visibilidad: una lista marcada como *solo admin* o desactivada no aparece.

## Entorno

Sale del `.env.local` del portal (se pasa con `--env-file`):

- `CLICKUP_API_TOKEN`, `CLICKUP_TEAM_ID`
- `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`

## Herramientas

| | |
|---|---|
| `list_proyectos` | Clientes y sus listas, con fechas y si son sprint o proyecto temporal |
| `list_tareas` | Tareas de una lista o de todo el portal, con filtros (abiertas, vencidas, persona) |
| `get_tarea` | Detalle de una tarea por id o por nombre |
| `list_estados` | Estados posibles de una lista (para saber a qué se puede cambiar) |
| `set_estado_tarea` | Cambia el estado de una tarea |
| `resumen_proyecto` | Cuántas tareas activas, vencidas y hechas tiene un proyecto, y sus fechas |

## Registro

`.mcp.json` está fuera del repositorio (lleva rutas absolutas de la máquina), así
que hay que añadirlo a mano en la raíz del proyecto:

```json
{
  "mcpServers": {
    "clickup": {
      "command": "node",
      "args": [
        "--env-file=/ruta/al/repo/.env.local",
        "/ruta/al/repo/mcp-clickup/index.js"
      ]
    }
  }
}
```

Sin dependencias: el protocolo MCP por stdio son cuatro mensajes JSON-RPC y se
hablan directamente. El SDK oficial declara sus *exports* con comodines (`./*`)
y este repositorio vive en una carpeta que lleva un `*` en el nombre, así que
Node mezclaba ambos y no resolvía el paquete.

## Probarlo sin el portal

```bash
printf '%s\n' \
  '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{}}' \
  '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"resumen_proyecto","arguments":{"proyecto":"Black Friday"}}}' \
  | node --env-file=.env.local mcp-clickup/index.js
```
