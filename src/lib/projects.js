// ── Proyectos de F*cts Studio ────────────────────────────────────────────────
//
// En el space "F*cts Studio" cada lista de ClickUp es un proyecto de cliente
// (carpeta = cliente, lista = proyecto). Las crea y las mantiene F*cts Bitácora,
// que codifica su situación en dos sitios:
//
//   1. La PRIORIDAD de la lista agrupa la fase:
//        urgent → En curso o Revisión   (trabajo vivo, hay manos dentro)
//        high   → Aprobado              (vendido, sin empezar)
//        normal → Propuesta             (en la mesa del cliente)
//        low    → Lead, Bloqueado, Entregado, Cerrado, Archivado
//        null   → NO es un proyecto: son las listas "General" de cada cliente,
//                 donde viven sus tareas sueltas.
//      Por eso un proyecto terminado va a Baja y no se queda sin bandera: sin
//      marca no se distinguiría "ya se entregó" de "ni siquiera es un proyecto".
//
//   2. Las primeras líneas de la DESCRIPCIÓN llevan el estado exacto y quién lo
//      lleva, que la prioridad no puede distinguir:
//
//        [estado: En curso]
//        [colaborador: Gabri]
//
//        <línea en blanco>
//        Objetivo del proyecto…
//
// Es información interna: el cliente no la ve. Si alguna vez escribimos la
// descripción de una lista desde aquí, hay que conservar esas líneas tal cual
// (o quitarlas antes), o Bitácora acabará metiendo el estado dentro del objetivo.
//
// Ojo: ClickUp NO deja escribir por API ni el color de una lista ni su campo
// "status" (devuelven SUBCAT_101). La prioridad es el único campo visible que se
// puede mantener automáticamente.

export const FACTS_SPACE_ID = "901511690574";
export const FACTS_SPACE_NAME = "F*cts Studio";

// Fases, de más viva a más apagada. `group` es lo que se puede deducir de la
// prioridad sola; `estado` afina dentro del grupo.
export const PHASES = {
  activo: { label: "En curso", badge: "success", orden: 0 },
  aprobado: { label: "Aprobado", badge: "info", orden: 1 },
  propuesta: { label: "Propuesta", badge: "pending", orden: 2 },
  parado: { label: "Parado", badge: "neutral", orden: 3 },
};

// Estado exacto → grupo. Lo que no esté aquí cae al grupo de su prioridad.
const ESTADO_GRUPO = {
  "en curso": "activo",
  revisión: "activo",
  revision: "activo",
  aprobado: "aprobado",
  propuesta: "propuesta",
  lead: "parado",
  bloqueado: "parado",
  entregado: "parado",
  cerrado: "parado",
  archivado: "parado",
};

const PRIORIDAD_GRUPO = { urgent: "activo", high: "aprobado", normal: "propuesta", low: "parado" };

// Sin acentos y en minúsculas: en la cabecera se escribe a mano ("Alvaro",
// "Álvaro") y no puede depender de cómo se teclee.
export const normalizeName = (v) =>
  String(v || "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim()
    .toLowerCase();
const norm = normalizeName;

// ¿Esta lista es un proyecto de F*cts Studio? Sin bandera de prioridad no lo es
// (es la "General" del cliente), aunque viva en el mismo space.
export function isFactsSpace(list) {
  return String(list?.space_id ?? "") === FACTS_SPACE_ID || (list?.space_name ?? "").trim() === FACTS_SPACE_NAME;
}
// Sin bandera de prioridad no es un proyecto, es la "General" del cliente.
// Pero hay un tercer caso: que la prioridad todavía no se esté sincronizando
// (columna list_priority, migración 0036). Se distingue `null` —ClickUp dice
// que no hay bandera— de `undefined` —no lo hemos preguntado—, y en ese caso
// se cae a la cabecera: un proyecto siempre trae [estado: …].
export function isFactsProject(list) {
  if (!isFactsSpace(list)) return false;
  if (list.list_priority !== undefined) return Boolean(list.list_priority);
  return Boolean(parseProjectMeta(list.list_content).estado);
}

// Lee la cabecera de la descripción. Devuelve siempre la misma forma, para que
// quien la use no tenga que comprobar nulls.
export function parseProjectMeta(content) {
  const lineas = String(content || "").split("\n");
  let estado = null;
  const colaboradores = [];
  let i = 0;
  // La cabecera son las primeras líneas entre corchetes; en cuanto aparece otra
  // cosa, empieza el objetivo.
  for (; i < lineas.length; i++) {
    const l = lineas[i].trim();
    if (!l) continue;
    const m = l.match(/^\[([^:\]]+):\s*([^\]]*)\]$/);
    if (!m) break;
    const clave = norm(m[1]);
    const valor = m[2].trim();
    if (clave === "estado") estado = valor || null;
    else if (clave === "colaborador" || clave === "colaboradores") {
      for (const nombre of valor.split(",").map((x) => x.trim()).filter(Boolean)) colaboradores.push(nombre);
    }
  }
  return { estado, colaboradores, objetivo: lineas.slice(i).join("\n").trim() || null };
}

// Fase de un proyecto: el estado exacto manda; si no se reconoce, la prioridad.
export function phaseOf(list) {
  if (!isFactsProject(list)) return null;
  const { estado } = parseProjectMeta(list.list_content);
  // El estado exacto manda porque distingue lo que la prioridad agrupa (En
  // curso de Revisión, Entregado de Cerrado); la prioridad es el respaldo.
  const grupo = ESTADO_GRUPO[norm(estado)] ?? PRIORIDAD_GRUPO[norm(list.list_priority)] ?? "parado";
  return { key: grupo, ...PHASES[grupo], estado: estado || PHASES[grupo].label };
}

// ── Identidad ───────────────────────────────────────────────────────────────
// El nombre de la cabecera [colaborador: …] se compara EXACTO (sin acentos ni
// mayúsculas) con la identidad que la persona ya tiene en la herramienta: el
// nombre de su perfil de ClickUp, que es el que se vincula en su ficha, y su
// propio nombre. Nada de adivinar por parecido: si "Gabri" no es el nombre de
// ningún perfil, el proyecto se queda sin adjudicar y se ve en Administrar →
// ClickUp, que es donde se arregla. Un emparejamiento aproximado escondería el
// desajuste y algún día le abriría un proyecto a quien no toca.
export function identitiesOf(employee, clickupGroupName = null) {
  return [clickupGroupName, employee?.name].filter(Boolean).map(norm);
}

// Nombres que la cabecera adjudica y que no corresponden a nadie. Alimenta el
// aviso del panel.
export function unknownCollaborators(list, identidades) {
  const { colaboradores } = parseProjectMeta(list?.list_content);
  const conocidas = new Set(identidades.map(norm));
  return colaboradores.filter((c) => !conocidas.has(norm(c)));
}

export function listNamesCollaborator(list, identidades) {
  const { colaboradores } = parseProjectMeta(list?.list_content);
  if (!colaboradores.length) return false;
  const mias = new Set(identidades.map(norm));
  return colaboradores.some((c) => mias.has(norm(c)));
}
