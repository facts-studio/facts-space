"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentEmployee } from "@/lib/data/helpers";

/**
 * Campos que CADA PERSONA puede cambiar de su propia ficha: datos de contacto
 * suyos. Todo lo demás (DNI, NSS, IBAN, salario, contrato, jornada, puesto,
 * permisos, días de vacaciones…) es de administración y no se toca desde aquí.
 */
const SELF_EDITABLE = [
  "personal_email",
  "mobile",
  "phone",
  "address",
  "city",
  "postal_code",
  "province",
  "country",
  "emergency_contact",
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Actualiza los datos de contacto de quien está logueado.
 *
 * OJO con el cliente: la política `employees_admin_write` solo deja escribir en
 * `employees` a los admins, así que con el cliente de sesión esto fallaría para
 * el resto del equipo. Se usa el de servicio, pero acotado a dos cosas que hacen
 * de barrera equivalente: SOLO las columnas de SELF_EDITABLE y SOLO la fila de
 * la persona autenticada (nunca llega un id desde el cliente).
 */
export async function updateMyProfile(fields = {}) {
  const me = await getCurrentEmployee();
  if (!me) return { ok: false, error: "No hay sesión activa." };

  const patch = {};
  for (const key of SELF_EDITABLE) {
    if (!(key in fields)) continue;
    const raw = fields[key];
    patch[key] = typeof raw === "string" ? raw.trim() : raw;
  }
  if (!Object.keys(patch).length) return { ok: true };

  if (patch.personal_email && !EMAIL_RE.test(patch.personal_email)) {
    return { ok: false, error: "El email personal no tiene un formato válido." };
  }

  const db = createAdminClient();
  if (!db) return { ok: false, error: "Falta la configuración del servidor." };

  const { error } = await db.from("employees").update(patch).eq("id", me.id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/ajustes");
  revalidatePath("/mi-espacio");
  return { ok: true };
}
