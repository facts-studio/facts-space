// Navegación del portal. Iconos como glifos inline para no añadir dependencias aún.
export const NAV = [
  { href: "/", label: "Inicio", icon: "home" },
  { href: "/calendario", label: "Calendario", icon: "calendar" },
  { href: "/politicas", label: "Políticas", icon: "doc" },
  { href: "/recursos", label: "Recursos", icon: "grid" },
  { href: "/clientes", label: "Clientes", icon: "briefcase" },
];

// Accesos secundarios (no son navegación diaria).
export const SECONDARY_NAV = [
  { href: "/equipo", label: "Equipo", icon: "users" },
  { href: "/onboarding", label: "Onboarding", icon: "sparkles", hint: "Para nuevas incorporaciones" },
  { href: "/admin", label: "Administrar", icon: "settings" },
];
