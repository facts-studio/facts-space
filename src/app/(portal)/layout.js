import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentEmployee } from "@/lib/data/helpers";
import Sidebar from "@/components/Sidebar";

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

  const emp = await getCurrentEmployee();

  return (
    <div className="flex min-h-screen">
      <Sidebar
        user={user}
        isAdmin={Boolean(emp?.is_admin)}
        serverTheme={emp?.theme ?? null}
        initialCollapsed={Boolean(emp?.nav_collapsed)}
      />
      <main className="flex-1 min-w-0 px-5 md:px-10 py-8 md:py-10">
        <div className="fade-up mx-auto w-full max-w-[1440px]">{children}</div>
      </main>
    </div>
  );
}
