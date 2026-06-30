"use server";

import Anthropic from "@anthropic-ai/sdk";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentEmployee } from "@/lib/data/helpers";

// Esquema de los datos que extraemos de una factura.
const INVOICE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    supplier: { type: "string", description: "Nombre del proveedor/emisor" },
    supplier_tax_id: { type: "string", description: "NIF/CIF del proveedor" },
    invoice_number: { type: "string", description: "Número de factura" },
    issue_date: { type: "string", description: "Fecha de emisión en formato YYYY-MM-DD" },
    due_date: { type: "string", description: "Fecha de vencimiento YYYY-MM-DD, o vacío" },
    currency: { type: "string", description: "Moneda, p. ej. EUR" },
    subtotal: { type: "number", description: "Base imponible (sin IVA)" },
    tax: { type: "number", description: "Importe de IVA/impuestos" },
    total: { type: "number", description: "Importe total" },
    concept: { type: "string", description: "Concepto o descripción breve" },
  },
  required: ["supplier", "supplier_tax_id", "invoice_number", "issue_date", "due_date", "currency", "subtotal", "tax", "total", "concept"],
};

// Extrae los datos de un documento (factura) con Claude y los guarda en
// documents.extracted. Solo admin. Requiere ANTHROPIC_API_KEY.
export async function extractInvoice(documentId) {
  const me = await getCurrentEmployee();
  if (!me?.is_admin) return { ok: false, error: "Solo administración." };
  if (!process.env.ANTHROPIC_API_KEY) return { ok: false, error: "Falta ANTHROPIC_API_KEY en el entorno." };

  const supabase = await createClient();
  const { data: doc } = await supabase
    .from("documents")
    .select("id, storage_path")
    .eq("id", documentId)
    .maybeSingle();
  if (!doc) return { ok: false, error: "Documento no encontrado." };

  // Descarga el archivo del bucket.
  const { data: blob, error: dErr } = await supabase.storage.from("hr-docs").download(doc.storage_path);
  if (dErr || !blob) return { ok: false, error: dErr?.message || "No se pudo descargar el archivo." };
  const mediaType = blob.type || "application/pdf";
  const base64 = Buffer.from(await blob.arrayBuffer()).toString("base64");

  const block = mediaType.startsWith("image/")
    ? { type: "image", source: { type: "base64", media_type: mediaType, data: base64 } }
    : { type: "document", source: { type: "base64", media_type: "application/pdf", data: base64 } };

  const client = new Anthropic();
  let data;
  try {
    const res = await client.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 2000,
      output_config: { format: { type: "json_schema", schema: INVOICE_SCHEMA } },
      messages: [
        {
          role: "user",
          content: [
            block,
            { type: "text", text: "Extrae los datos de esta factura. Si un campo no aparece, déjalo vacío (cadena vacía) o 0. Importes como números sin símbolo de moneda." },
          ],
        },
      ],
    });
    const text = res.content.find((b) => b.type === "text")?.text || "{}";
    data = JSON.parse(text);
  } catch (e) {
    return { ok: false, error: e?.message || "Error al extraer con la IA." };
  }

  const { error: uErr } = await supabase.from("documents").update({ extracted: data }).eq("id", documentId);
  if (uErr) return { ok: false, error: uErr.message };

  revalidatePath("/admin");
  return { ok: true, data };
}
