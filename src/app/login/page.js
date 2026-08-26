"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import FctsMark from "@/components/FctsMark";

const ERRORS = {
  unregistered: "Esa cuenta no está dada de alta en el portal. Pídeselo a un admin.",
  auth: "No hemos podido iniciar sesión. Inténtalo otra vez.",
};

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const [loading, setLoading] = useState(false);
  const code = useSearchParams().get("error");
  const error = code ? ERRORS[code] || ERRORS.auth : "";

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
        queryParams: { prompt: "select_account" },
      },
    });
  }

  return (
    <main className="min-h-screen grid place-items-center px-6">
      <div className="w-full max-w-[320px] text-center fade-up">
        <FctsMark className="h-8 w-auto text-brand mx-auto mb-8" />

        <h1 className="font-display text-[26px] leading-[1.15] tracking-[-0.02em] text-ink">
          Portal interno
        </h1>
        <p className="text-[14px] text-muted mt-2 mb-9">
          Entra con tu cuenta del equipo.
        </p>

        <button
          onClick={signIn}
          disabled={loading}
          className="w-full h-11 inline-flex items-center justify-center gap-2.5 rounded-full bg-ink text-bg text-[14px] font-medium transition hover:bg-inkSoft active:scale-[0.99] disabled:opacity-60"
        >
          {loading ? (
            "Conectando…"
          ) : (
            <>
              <span className="grid place-items-center h-5 w-5 rounded-full bg-bg shrink-0">
                <svg width="12" height="12" viewBox="0 0 24 24" aria-hidden>
                  <path fill="#4285F4" d="M23 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.2a5.3 5.3 0 0 1-2.3 3.5v2.9h3.7c2.2-2 3.4-5 3.4-8.6z" />
                  <path fill="#34A853" d="M12 24c3.1 0 5.7-1 7.6-2.8l-3.7-2.9c-1 .7-2.3 1.1-3.9 1.1-3 0-5.5-2-6.4-4.7H1.8v3C3.7 21.4 7.5 24 12 24z" />
                  <path fill="#FBBC05" d="M5.6 14.7a7.2 7.2 0 0 1 0-4.6v-3H1.8a12 12 0 0 0 0 10.6z" />
                  <path fill="#EA4335" d="M12 4.8c1.7 0 3.2.6 4.4 1.7l3.3-3.3C17.7 1.2 15.1 0 12 0 7.5 0 3.7 2.6 1.8 6.4l3.8 3a7.1 7.1 0 0 1 6.4-4.6z" />
                </svg>
              </span>
              Entrar con Google
            </>
          )}
        </button>

        <p className="text-micro text-mutedSoft mt-5">
          {error || "Solo cuentas dadas de alta por un admin."}
        </p>
      </div>
    </main>
  );
}
