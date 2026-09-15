import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentEmployee } from "@/lib/data/helpers";

// Los tokens de F*ctito de quien mira. Nunca el secreto: solo su pista, cuándo
// se creó y cuándo se usó por última vez.
export async function getMisTokens() {
  const me = await getCurrentEmployee();
  const supabase = createAdminClient();
  if (!me || !supabase) return [];
  const { data } = await supabase
    .from("api_tokens")
    .select("id, nombre, pista, created_at, last_used_at")
    .eq("employee_id", me.id)
    .is("revoked_at", null)
    .order("created_at", { ascending: false });
  return data ?? [];
}
