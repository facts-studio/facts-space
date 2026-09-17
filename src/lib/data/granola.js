import "server-only";

// ── Reuniones de Granola ─────────────────────────────────────────────────────
// Las notas de las reuniones viven en Granola. Conectar Granola entero a
// ChatGPT lo abriría TODO, y ahí hay mucho que no es del equipo: management,
// clientes, conversaciones privadas. Así que no se conecta Granola: se conecta
// el portal, y el portal solo mira dentro de las carpetas de esta lista.
//
// La lista blanca se aplica aquí, en el servidor, no en el prompt ni en el
// cliente. Una nota que no cuelgue de una carpeta permitida no se lista y
// tampoco se puede abrir por id — se comprueba también al leerla, porque si no
// bastaría con adivinar un id para saltarse la carpeta.
//
// Y de cada nota sale el resumen. Nunca `private_notes_*` (las notas privadas
// de quien la tomó) ni `transcript` (la transcripción literal de todos los que
// hablaron). El resumen es lo que ya se comparte en el status; lo demás no.
//
// Config (.env.local y Vercel):
//   GRANOLA_API_KEY=grn_…            clave con scope "Public notes" a secas
//   GRANOLA_FOLDERS=Creative Team,Team meetings   (opcional) carpetas visibles
const BASE = "https://public-api.granola.ai/v1";
const CARPETAS_POR_DEFECTO = ["Creative Team", "Team meetings"];

export function isGranolaConfigured() {
  return Boolean(process.env.GRANOLA_API_KEY);
}

const norm = (s) =>
  (s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

function carpetasConfiguradas() {
  const raw = process.env.GRANOLA_FOLDERS;
  const nombres = raw ? raw.split(",") : CARPETAS_POR_DEFECTO;
  return nombres.map(norm).filter(Boolean);
}

async function call(path, params) {
  if (!isGranolaConfigured()) return null;
  const qs = new URLSearchParams(params || {}).toString();
  const res = await fetch(`${BASE}${path}${qs ? `?${qs}` : ""}`, {
    headers: { Authorization: `Bearer ${process.env.GRANOLA_API_KEY}` },
    // Una reunión no cambia cada minuto, pero el resumen sí tarda un rato en
    // generarse después de la llamada: cinco minutos es suficiente margen.
    next: { revalidate: 300, tags: ["granola"] },
  });
  if (!res.ok) return null;
  return res.json().catch(() => null);
}

// Árbol de carpetas resuelto a: qué ids están permitidos y cómo se llama la
// ruta de cada uno ("Creative Team / Status"), que es lo que se enseña.
async function arbol() {
  const json = await call("/folders", { limit: "200" });
  const folders = json?.folders ?? [];
  const porId = new Map(folders.map((f) => [f.id, f]));

  const ruta = (f) => {
    const partes = [f.name];
    let cur = f;
    const vistos = new Set([f.id]);
    while (cur.parent_folder_id && porId.has(cur.parent_folder_id) && !vistos.has(cur.parent_folder_id)) {
      vistos.add(cur.parent_folder_id);
      cur = porId.get(cur.parent_folder_id);
      partes.push(cur.name);
    }
    return partes.reverse().join(" / ");
  };

  const permitidas = carpetasConfiguradas();
  // Raíces de la lista blanca: por nombre de carpeta o por ruta completa.
  const raices = folders.filter((f) => permitidas.includes(norm(f.name)) || permitidas.includes(norm(ruta(f))));

  // Y todo lo que cuelga de ellas: si "Creative Team" está permitida,
  // "Creative Team / Status" también lo está.
  const permitidos = new Set(raices.map((f) => f.id));
  let creció = true;
  while (creció) {
    creció = false;
    for (const f of folders) {
      if (!permitidos.has(f.id) && f.parent_folder_id && permitidos.has(f.parent_folder_id)) {
        permitidos.add(f.id);
        creció = true;
      }
    }
  }

  return { folders, porId, ruta, raices, permitidos };
}

export async function getMeetingFolders() {
  const { raices, ruta, folders, permitidos } = await arbol();
  if (!raices.length) return [];
  return folders
    .filter((f) => permitidos.has(f.id))
    .map((f) => ({ id: f.id, nombre: f.name, ruta: ruta(f) }))
    .sort((a, b) => a.ruta.localeCompare(b.ruta, "es"));
}

// El listado de Granola no trae `web_url`, solo el detalle: cuando no hay, no
// se inventa un campo vacío que parezca un enlace roto.
const resumenNota = (n, rutas) => ({
  id: n.id,
  titulo: n.title || "Sin título",
  fecha: (n.created_at || "").slice(0, 10),
  carpetas: rutas ?? [],
  ...(n.web_url ? { url: n.web_url } : {}),
});

// Reuniones de las carpetas permitidas, de la más reciente a la más antigua.
// `carpeta` acota a una de ellas (por nombre o por id); `desde` a partir de una
// fecha ISO. Solo la lista: el contenido se pide nota a nota.
export async function getMeetings({ carpeta, desde, limite = 20 } = {}) {
  const { raices, ruta, folders, permitidos } = await arbol();
  if (!raices.length) return [];

  let objetivo = raices;
  if (carpeta) {
    const q = norm(carpeta);
    const elegida = folders.filter((f) => permitidos.has(f.id) && (f.id === carpeta || norm(f.name) === q || norm(ruta(f)) === q));
    if (!elegida.length) return [];
    objetivo = elegida;
  }

  const porNota = new Map();
  const listas = await Promise.all(
    objetivo.map((f) => call("/notes", { folder_id: f.id, limit: "100" }).then((r) => [f, r?.notes ?? []])),
  );
  for (const [f, notas] of listas) {
    for (const n of notas) {
      const prev = porNota.get(n.id);
      if (prev) prev.carpetas.push(ruta(f));
      else porNota.set(n.id, { ...resumenNota(n, [ruta(f)]), _n: n });
    }
  }

  return [...porNota.values()]
    .filter((n) => !desde || n.fecha >= desde)
    .sort((a, b) => (a.fecha < b.fecha ? 1 : a.fecha > b.fecha ? -1 : 0))
    .slice(0, Math.min(Number(limite) || 20, 50))
    .map(({ _n, ...n }) => n);
}

// Una reunión con su resumen. Devuelve null si la nota no existe o si no cuelga
// de ninguna carpeta permitida: el id por sí solo no da acceso a nada.
export async function getMeeting(id) {
  if (!id || !/^not_[A-Za-z0-9]+$/.test(String(id))) return null;
  const { raices, ruta, porId, permitidos } = await arbol();
  if (!raices.length) return null;

  const json = await call(`/notes/${id}`);
  const n = json?.note ?? json;
  if (!n?.id) return null;

  const suyas = (n.folder_membership ?? []).filter((f) => permitidos.has(f.id));
  if (!suyas.length) return null;

  return {
    ...resumenNota(n, suyas.map((f) => ruta(porId.get(f.id) ?? f))),
    asistentes: (n.attendees ?? []).map((a) => a.name || a.email).filter(Boolean),
    resumen: n.summary_markdown || n.summary_text || "",
  };
}
