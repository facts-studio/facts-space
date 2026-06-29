"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import FctsMark from "@/components/FctsMark";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const domain = process.env.NEXT_PUBLIC_ALLOWED_EMAIL_DOMAIN || "fcts.studio";

  async function signIn() {
    setLoading(true);
    const supabase = createClient();
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      (typeof window !== "undefined" ? window.location.origin : "");
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${siteUrl}/auth/callback`,
        queryParams: { hd: domain, prompt: "select_account" },
      },
    });
  }

  return (
    <main className="min-h-screen grid place-items-center px-6">
      <div className="w-full max-w-[400px] fade-up">
        <div className="text-center mb-8">
          <FctsMark className="h-9 w-auto text-brand mx-auto mb-5" />
          <p className="section-eyebrow mb-3">F*cts Studio</p>
          <h1 className="font-display text-[34px] leading-[1.1] text-ink">
            Portal <span className="title-italic">interno</span>
          </h1>
          <p className="section-helper mx-auto">
            Calendario, políticas y recursos del equipo, todo en un sitio.
          </p>
        </div>

        <div className="card p-6">
          <button
            onClick={signIn}
            disabled={loading}
            className="btn-primary w-full h-11 text-[14px] disabled:opacity-60"
          >
            {loading ? "Conectando…" : "Entrar con Google"}
          </button>
          <p className="text-micro text-mutedSoft text-center mt-4">
            Solo cuentas <span className="text-muted">@{domain}</span>
          </p>
        </div>
      </div>
    </main>
  );
}
