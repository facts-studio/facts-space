import "./globals.css";
import Script from "next/script";
import { cookies } from "next/headers";

export const metadata = {
  title: "F*cts Studio · Portal interno",
  description: "Calendario, políticas y recursos del equipo de F*cts Studio.",
  robots: { index: false, follow: false },
  // Nombre e icono al instalar en la pantalla de inicio del iPhone.
  appleWebApp: { capable: true, title: "F*cts", statusBarStyle: "black-translucent" },
};

// theme-color de la barra (PWA) atado al tema del PORTAL, no al del sistema: se
// resuelve por la cookie de preferencia del usuario y se actualiza en vivo al
// conmutar (ver themeInit y ThemeToggle). Un solo meta, sin media-queries.
export const THEME_BAR = { light: "#EFEEEB", dark: "#1c1c1a" };

export async function generateViewport() {
  const cookieTheme = (await cookies()).get("theme")?.value;
  return {
    width: "device-width",
    initialScale: 1,
    // Necesario para que env(safe-area-inset-*) tenga valor bajo el notch (PWA).
    viewportFit: "cover",
    themeColor: cookieTheme === "dark" ? THEME_BAR.dark : THEME_BAR.light,
  };
}

// Preferencia de tema del usuario (cookie espejo de employees.theme). Si existe,
// el SSR ya pinta el tema correcto sin parpadeo. Si no, sigue la del sistema.
// En ambos casos, sincroniza el theme-color de la barra con la clase .dark final.
const themeInit = `(function(){try{if(document.cookie.indexOf('theme=')===-1&&window.matchMedia('(prefers-color-scheme: dark)').matches){document.documentElement.classList.add('dark');}}catch(e){}try{var d=document.documentElement.classList.contains('dark');var m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute('content',d?'${THEME_BAR.dark}':'${THEME_BAR.light}');}catch(e){}})();`;

export default async function RootLayout({ children }) {
  const cookieTheme = (await cookies()).get("theme")?.value;
  return (
    <html lang="es" className={cookieTheme === "dark" ? "dark h-full" : "h-full"}>
      <body className="min-h-full">
        <Script id="theme-init" strategy="beforeInteractive">{themeInit}</Script>
        {children}
      </body>
    </html>
  );
}
