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

export default function RootLayout({ children }) {
  return (
    <html lang="es" className="h-full">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
