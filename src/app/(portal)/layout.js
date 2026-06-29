import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Sidebar from "@/components/Sidebar";

export default async function PortalLayout({ children }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div className="flex min-h-screen">
      <Sidebar user={user} />
      <main className="flex-1 min-w-0 px-5 md:px-10 py-8 md:py-10">
        <div className="max-w-[1100px] mx-auto fade-up">{children}</div>
      </main>
    </div>
  );
}
