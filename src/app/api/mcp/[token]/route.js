import { NextResponse } from "next/server";
import { manejar } from "../route";

// La misma puerta, con el token en la URL.
//
// Existe por ChatGPT: sus conectores personalizados solo ofrecen OAuth o
// «sin autenticación», y no dejan añadir una cabecera. Montar OAuth para que
// cinco personas consulten sus tareas es desproporcionado, así que la llave
// viaja en la ruta. Sigue siendo personal y revocable; lo que cambia es que
// hay que tratar la URL entera como un secreto —quien la tenga, entra— y por
// eso la pantalla que la genera lo dice así de claro.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request, { params }) {
  const { token } = await params;
  return manejar(request, token);
}

export async function GET() {
  return NextResponse.json({
    nombre: "F*ctito",
    descripcion: "Pega esta URL completa en el conector de ChatGPT, con «sin autenticación».",
  });
}
