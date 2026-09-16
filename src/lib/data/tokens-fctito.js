import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentEmployee } from "@/lib/data/helpers";

// Las llaves de F*ctito en uso. Nunca el secreto: solo su pista, cuándo se
// creó y cuándo se usó por última vez. Son del estudio —la cuenta de ChatGPT
// es compartida—, así que las ve y las gestiona administración.
export async function getTokensFctito() {
  const me = await getCurrentEmployee();
  const supabase = createAdminClient();
  if (!me?.is_admin || !supabase) return [];
  const { data } = await supabase
    .from("api_tokens")
    .select("id, nombre, pista, created_at, last_used_at")
    .is("revoked_at", null)
    .order("created_at", { ascending: false });
  return data ?? [];
}
