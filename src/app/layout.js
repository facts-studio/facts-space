import "./globals.css";

export const metadata = {
  title: "F*cts Studio · Portal interno",
  description: "Calendario, políticas y recursos del equipo de F*cts Studio.",
  robots: { index: false, follow: false },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#EFEEEB",
};

// Evita el parpadeo: fija el tema antes de pintar, según preferencia guardada
// o, si no hay, la del sistema (prefers-color-scheme).
const themeInit = `(function(){try{var t=localStorage.getItem('theme');var d=t?t==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;if(d)document.documentElement.classList.add('dark');}catch(e){}})();`;

export default function RootLayout({ children }) {
  return (
    <html lang="es" className="h-full">
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
