import "server-only";
import { createClient } from "@supabase/supabase-js";

// Cliente con service-role: SALTA la RLS. Úsalo SOLO en contextos de servidor
// sin sesión de usuario (p. ej. el webhook de ClickUp). Nunca en el cliente.
// Requiere SUPABASE_SERVICE_ROLE_KEY en el entorno.
export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) return null;
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
