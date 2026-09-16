"use client";

import { useState, useTransition } from "react";
import { Surface, Badge, Button, Input } from "@/components/ui";
import { crearTokenFctito, revocarTokenFctito } from "@/lib/actions/tokens";

// Conectar F*ctito al ChatGPT del estudio. La cuenta es compartida, así que la
// llave es una sola y la gestiona administración: F*ctito contesta siempre con
// el alcance de un miembro del equipo, sea quien sea el que pregunte.
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
        <p className="section-eyebrow mb-1">F*ctito en ChatGPT</p>
        <p className="text-small text-muted max-w-[70ch] leading-relaxed">
          Una llave para el ChatGPT del equipo: pueden preguntarle por las tareas de la semana, los proyectos
          en curso, quién está fuera, los tickets y las políticas — y cambiar el estado de una tarea. Como la
          cuenta es compartida, contesta <span className="text-ink">a nivel de equipo</span>: nada de nóminas,
          contratos, datos bancarios, saldos de vacaciones ni proyectos de Adhōc.
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
        <Input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Para qué es" className="min-w-[200px]" />
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
