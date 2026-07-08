// Manifest PWA: nombre, icono y colores al instalar el portal como aplicación.
export default function manifest() {
  return {
    name: "F*cts Studio · Portal interno",
    short_name: "F*cts",
    description: "Calendario, políticas y recursos del equipo de F*cts Studio.",
    start_url: "/",
    display: "standalone",
    background_color: "#EFEEEB",
    theme_color: "#EFEEEB",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
