"use client";

import { useState, useTransition } from "react";
import { Surface, Badge, Button, Input } from "@/components/ui";
import { crearTokenFctito, revocarTokenFctito } from "@/lib/actions/tokens";

// Conectar F*ctito a ChatGPT (o a Claude): un token por persona, que responde
// con SUS permisos. Vive en Mi espacio porque es una llave personal, no una
// configuración del estudio.
const fecha = (iso) => (iso ? new Date(iso).toLocaleDateString("es-ES", { day: "numeric", month: "short" }) : "—");

export default function FctitoTokens({ tokens = [], url }) {
  const [nombre, setNombre] = useState("ChatGPT");
  const [nuevo, setNuevo] = useState(null); // el secreto, visible una sola vez
  const [msg, setMsg] = useState(null);
  const [pending, run] = useTransition();

  const crear = () =>
    run(async () => {
      setMsg(null);
      const r = await crearTokenFctito(nombre);
      if (r.ok) setNuevo(r.token); else setMsg(r.error);
    });

  const revocar = (id) =>
    run(async () => {
      const r = await revocarTokenFctito(id);
      if (!r.ok) setMsg(r.error);
    });

  return (
    <Surface variant="soft" className="space-y-4">
      <div>
        <p className="section-eyebrow mb-1">F*ctito fuera del portal</p>
        <p className="text-small text-muted max-w-[68ch] leading-relaxed">
          Crea una llave para preguntarle a F*ctito desde ChatGPT o Claude: tus tareas, tus vacaciones, los
          proyectos que ves y quién está fuera. Responde <span className="text-ink">como tú</span>, con tus
          permisos — no llega a nóminas, contratos, datos bancarios ni a las ausencias de nadie más.
        </p>
      </div>

      {nuevo && (
        <div className="rounded-xl bg-surface2/60 p-4">
          <p className="text-micro text-mutedSoft mb-2">
            Cópiala ahora: no se vuelve a enseñar. Si la pierdes, revócala y crea otra.
          </p>
          <input
            readOnly
            value={`${url}/${nuevo}`}
            onFocus={(e) => e.target.select()}
            className="w-full h-9 rounded-lg bg-surface border border-border px-2.5 text-[12.5px] text-ink outline-none font-mono"
          />
          <p className="text-micro text-mutedSoft mt-2 leading-relaxed">
            En ChatGPT: Ajustes → Aplicaciones → Avanzado → activa el modo desarrollador, y crea un conector
            pegando esa URL con <span className="text-ink">«sin autenticación»</span>. La llave va dentro de la
            dirección, así que trátala como una contraseña: quien la tenga entra como tú.
          </p>
        </div>
      )}

      <div className="flex flex-wrap items-end gap-2">
        <Input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Para qué es" className="min-w-[180px]" />
        <Button size="sm" onClick={crear} disabled={pending}>{pending ? "Creando…" : "Crear llave"}</Button>
        {msg && <span className="text-micro text-danger">{msg}</span>}
      </div>

      {tokens.length > 0 && (
        <ul className="divide-y divide-border/50">
          {tokens.map((t) => (
            <li key={t.id} className="flex items-center gap-3 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="text-small text-ink truncate">{t.nombre}</p>
                <p className="text-micro text-mutedSoft font-mono">{t.pista}</p>
              </div>
              <Badge kind="neutral">
                {t.last_used_at ? `usada el ${fecha(t.last_used_at)}` : "sin usar"}
              </Badge>
              <button
                onClick={() => revocar(t.id)}
                disabled={pending}
                className="shrink-0 text-micro text-mutedSoft hover:text-danger transition"
              >
                Revocar
              </button>
            </li>
          ))}
        </ul>
      )}
    </Surface>
  );
}
