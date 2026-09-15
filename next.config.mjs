/** @type {import('next').NextConfig} */
const nextConfig = {
  // El portal se usa como una app instalada del Dock, no como una pestaña de
  // desarrollo: el indicador flotante de Next (la "N" con los avisos de build)
  // se cuela en esa ventana y rompe la ilusión. Seguimos viendo los errores en
  // la consola del navegador y en el log del servicio.
  devIndicators: false,
};

export default nextConfig;
