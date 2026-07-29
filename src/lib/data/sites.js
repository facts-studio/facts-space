import "server-only";
import { createClient } from "@/lib/supabase/server";
import { isConfigured } from "./helpers";

// Mock para preview/desarrollo sin Supabase: un par de landings de ejemplo.
const MOCK_SITES = [
  {
    id: "s1", url: "https://tradinglab.es", title: "TradingLab — Landing",
    description: "Landing de captación del curso insignia. Hero con vídeo y prueba social.",
    client: "TradingLab", color: "azul", tags: ["landing", "educación"],
    image: null, active: true, position: 0,
  },
  {
    id: "s2", url: "https://unfiltrade.com", title: "Unfiltrade",
    description: "Web de marca de la comunidad. Sistema oscuro, mucho movimiento.",
    client: "Unfiltrade", color: "morado", tags: ["marca", "comunidad"],
    image: null, active: true, position: 1,
  },
];

// Todas las webs del escaparate (incluye inactivas: el filtro de visibilidad se
// resuelve en la UI según sea admin o no). Ordenadas por posición y recientes.
export async function getSites() {
  if (!isConfigured()) return MOCK_SITES;
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("sites")
      .select("*")
      .order("position", { ascending: true })
      .order("created_at", { ascending: false });
    if (error) return [];
    return (data ?? []).map((s) => ({ ...s, tags: Array.isArray(s.tags) ? s.tags : [] }));
  } catch {
    return [];
  }
}
