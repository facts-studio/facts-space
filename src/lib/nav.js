// Navegación del portal. Iconos como glifos inline para no añadir dependencias aún.
export const NAV = [
  { href: "/", label: "Inicio", icon: "home" },
  { href: "/calendario", label: "Calendario", icon: "calendar" },
  { href: "/fichaje", label: "Fichaje", icon: "clock" },
  { href: "/mi-espacio", label: "Mi espacio", icon: "user" },
  { href: "/politicas", label: "Políticas", icon: "doc" },
  { href: "/recursos", label: "Recursos", icon: "grid" },
  { href: "/clientes", label: "Clientes", icon: "briefcase" },
];

// Va anclado al fondo del menú lateral.
export const FOOTER_NAV = [
  { href: "/tools", label: "F*cts Tools", icon: "tools" },
];

// Accesos secundarios (no son navegación diaria).
export const SECONDARY_NAV = [
  { href: "/equipo", label: "Equipo", icon: "users" },
  { href: "/onboarding", label: "Onboarding", icon: "sparkles", hint: "Para nuevas incorporaciones" },
];
