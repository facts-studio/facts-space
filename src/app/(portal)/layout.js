import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentEmployee } from "@/lib/data/helpers";
import Sidebar from "@/components/Sidebar";
import MobileNav from "@/components/MobileNav";
import ContentWidth from "@/components/ContentWidth";
import { isExternal } from "@/lib/team";
import TeamPhotos from "@/components/tasks/TeamPhotos";
import AsistenteDock from "@/components/asistente/AsistenteDock";
import { AsistenteProvider } from "@/lib/asistente";
import { getEmployees } from "@/lib/data/employees";

const PREVIEW = process.env.NEXT_PUBLIC_AUTH_DISABLED === "true";
const PREVIEW_USER = {
  email: "equipo@fcts.studio",
  user_metadata: { full_name: "Equipo F*cts" },
};

export default async function PortalLayout({ children }) {
  let user = PREVIEW ? PREVIEW_USER : null;

  if (!PREVIEW) {
    const supabase = await createClient();
    ({
      data: { user },
    } = await supabase.auth.getUser());
    if (!user) redirect("/login");
  }

  const [emp, team] = await Promise.all([getCurrentEmployee(), getEmployees()]);
  // Los colaboradores externos no ven las secciones de plantilla.
  const externo = isExternal(emp);

  return (
    <AsistenteProvider>
    <div className="flex min-h-screen">
      {/* Fotos del equipo real, para los avatares que solo tienen el email. */}
      <TeamPhotos people={team.map((e) => ({ email: e.email, photo: e.photo }))} />
      <Sidebar
        user={user}
        isAdmin={Boolean(emp?.is_admin)}
        isExternal={externo}
        serverTheme={emp?.theme ?? null}
        initialCollapsed={Boolean(emp?.nav_collapsed)}
      />
      {/* Aire para la barra inferior en móvil (56px + safe-area); en desktop, el
          padding normal. La cabecera respeta el notch con pt-safe. */}
      <main className="flex-1 min-w-0 px-5 md:px-10 pt-safe md:pt-10 pb-[calc(58px+env(safe-area-inset-bottom)+1.75rem)] md:pb-10">
        <ContentWidth>{children}</ContentWidth>
      </main>

      <MobileNav isAdmin={Boolean(emp?.is_admin)} isExternal={externo} serverTheme={emp?.theme ?? null} />

      {/* F*ctito. Solo se pinta donde el portal lo sirve tu máquina: en
          producción la ruta ni existe (ver src/lib/lineasRojas.js). */}
      <AsistenteDock />
    </div>
    </AsistenteProvider>
  );
}
