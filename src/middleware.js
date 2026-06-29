import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request) {
  // Modo preview: sin auth, para enseñar el entorno antes de conectar Supabase.
  if (process.env.NEXT_PUBLIC_AUTH_DISABLED === "true") {
    return;
  }
  return await updateSession(request);
}

export const config = {
  // Todo salvo estáticos e imágenes.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
