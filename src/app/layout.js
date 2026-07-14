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

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#EFEEEB",
};

// Preferencia de tema del usuario (cookie espejo de employees.theme). Si existe,
// el SSR ya pinta el tema correcto sin parpadeo. Si no, el script de abajo sigue
// la preferencia del sistema.
const themeInit = `(function(){try{if(document.cookie.indexOf('theme=')!==-1)return;if(window.matchMedia('(prefers-color-scheme: dark)').matches)document.documentElement.classList.add('dark');}catch(e){}})();`;

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
