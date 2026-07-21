"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Surface, SectionHeader, Field, Input, Button, Badge } from "@/components/ui";
import ThemeToggle from "@/components/ThemeToggle";
import { updateMyProfile } from "@/lib/actions/profile";
import { createClient } from "@/lib/supabase/client";

// Campos de contacto que cada uno gestiona. El resto de la ficha (DNI, IBAN,
// contrato, salario…) es de administración y se consulta en Mi espacio.
const CAMPOS = [
  { key: "personal_email", label: "Email personal", type: "email", placeholder: "nombre@gmail.com" },
  { key: "mobile", label: "Móvil", type: "tel", placeholder: "600 000 000" },
  { key: "phone", label: "Otro teléfono", type: "tel" },
  { key: "emergency_contact", label: "Contacto de emergencia", hint: "Nombre y teléfono de quien avisar si pasa algo." },
  { key: "address", label: "Dirección", className: "sm:col-span-2" },
  { key: "city", label: "Ciudad" },
  { key: "postal_code", label: "Código postal" },
  { key: "province", label: "Provincia" },
  { key: "country", label: "País" },
];

export default function AjustesClient({ me }) {
  const [form, setForm] = useState(() => Object.fromEntries(CAMPOS.map((c) => [c.key, me[c.key] ?? ""])));
  const [msg, setMsg] = useState(null);
  const [saving, start] = useTransition();

  // Hay cambios sin guardar si algún campo difiere de lo que vino del servidor.
  const dirty = CAMPOS.some((c) => (form[c.key] ?? "") !== (me[c.key] ?? ""));

  const set = (key) => (e) => { setForm((f) => ({ ...f, [key]: e.target.value })); setMsg(null); };

  const guardar = () => {
    setMsg(null);
    start(async () => {
      const res = await updateMyProfile(form);
      setMsg(res?.ok ? { ok: true, text: "Datos guardados." } : { ok: false, text: res?.error || "No se pudo guardar." });
    });
  };

  const cerrarSesion = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  const nombre = [me.name, me.last_name].filter(Boolean).join(" ");

  return (
    <div className="grid gap-8">
      {/* ── Cuenta (solo lectura: lo gestiona administración) ── */}
      <section>
        <SectionHeader label="Cuenta" />
        <Surface className="flex items-center gap-4 flex-wrap">
          {me.photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={me.photo} alt="" className="h-14 w-14 rounded-full object-cover shrink-0" />
          ) : (
            <span className="h-14 w-14 rounded-full bg-brandSoft text-brand grid place-items-center text-[20px] shrink-0">
              {(me.name || "?")[0]?.toUpperCase()}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-[15px] text-ink flex items-center gap-2 flex-wrap">
              {nombre}
              {me.is_admin && <Badge kind="info">Admin</Badge>}
            </p>
            <p className="text-small text-mutedSoft truncate">{me.email}</p>
            {me.role && <p className="text-micro text-mutedSoft">{me.role}</p>}
          </div>
        </Surface>
        <p className="mt-2 text-micro text-mutedSoft">
          Nombre, puesto y datos laborales los gestiona administración. Puedes consultarlos en{" "}
          <Link href="/mi-espacio" className="underline underline-offset-2 hover:text-ink transition">Mi espacio</Link>.
        </p>
      </section>

      {/* ── Contacto (editable) ── */}
      <section>
        <SectionHeader label="Datos de contacto" />
        <Surface>
          <div className="grid sm:grid-cols-2 gap-4">
            {CAMPOS.map((c) => (
              <Field key={c.key} label={c.label} hint={c.hint} className={c.className}>
                <Input
                  type={c.type || "text"}
                  value={form[c.key]}
                  onChange={set(c.key)}
                  placeholder={c.placeholder}
                  autoComplete="off"
                />
              </Field>
            ))}
          </div>

          <div className="mt-5 flex items-center gap-3 flex-wrap">
            <Button onClick={guardar} disabled={!dirty || saving}>
              {saving ? "Guardando…" : "Guardar cambios"}
            </Button>
            {dirty && !saving && (
              <button
                type="button"
                onClick={() => { setForm(Object.fromEntries(CAMPOS.map((c) => [c.key, me[c.key] ?? ""]))); setMsg(null); }}
                className="text-micro text-muted hover:text-ink transition"
              >
                Descartar
              </button>
            )}
            {msg && (
              <span className={`text-micro ${msg.ok ? "text-success" : "text-danger"}`}>{msg.text}</span>
            )}
          </div>
        </Surface>
      </section>

      {/* ── Apariencia ── */}
      <section>
        <SectionHeader label="Apariencia" />
        <Surface className="flex items-center justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <p className="text-small text-ink">Tema</p>
            <p className="text-micro text-mutedSoft">Se recuerda en tu cuenta, así que viaja entre dispositivos.</p>
          </div>
          <ThemeToggle serverTheme={me.theme} />
        </Surface>
      </section>

      {/* ── Sesión ── */}
      <section>
        <SectionHeader label="Sesión" />
        <Surface className="flex items-center justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <p className="text-small text-ink">Cerrar sesión</p>
            <p className="text-micro text-mutedSoft">Saldrás de este dispositivo.</p>
          </div>
          <Button variant="ghost" onClick={cerrarSesion}>Cerrar sesión</Button>
        </Surface>
      </section>
    </div>
  );
}
