import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

// Refresca la sesión y protege rutas. Solo entra quien esté dado de alta y
// activo en la tabla employees (allowlist por tabla).
export async function updateSession(request) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isPublic =
    pathname === "/login" ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/clickup/webhook") || // webhook de ClickUp (sin sesión)
    pathname.startsWith("/api/cron/") || // crons de Vercel (sin sesión)
    pathname === "/favicon.ico";

  // Sin sesión → al login.
  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Con sesión pero sin ficha de empleado activa → fuera. La allowlist es la
  // tabla employees: si no estás dado de alta (o estás inactivo), no entras.
  if (user) {
    const { data: employee } = await supabase
      .from("employees")
      .select("id, active")
      .ilike("email", user.email || "")
      .maybeSingle();
    if (!employee || employee.active === false) {
      await supabase.auth.signOut();
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("error", "unregistered");
      return NextResponse.redirect(url);
    }
  }

  // Ya logueado y en /login → al portal.
  if (user && pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return response;
}
