// Navegación del portal, en grupos separados por hairlines. Cada grupo es un
// array de items; un item puede tener `children` (sub-navegación, p. ej. las
// áreas de Recursos).
export const NAV_GROUPS = [
  [
    { href: "/", label: "Inicio", icon: "home" },
    { href: "/tareas", label: "Tareas", icon: "tasks" },
    { href: "/calendario", label: "Calendario", icon: "calendar" },
    { href: "/fichaje", label: "Fichaje", icon: "clock" },
  ],
  [
    { href: "/mi-espacio", label: "Mi espacio", icon: "user" },
    { href: "/equipo", label: "Equipo", icon: "users" },
  ],
  [
    { href: "/politicas", label: "Políticas", icon: "doc" },
    {
      href: "/recursos",
      label: "Recursos",
      icon: "grid",
      children: [
        { href: "/recursos#programas", label: "Programas" },
        { href: "/recursos#enlaces", label: "Enlaces de interés" },
        { href: "/tools", label: "F*cts Tools" },
      ],
    },
    { href: "/clientes", label: "Clientes", icon: "briefcase" },
  ],
  [
    { href: "/onboarding", label: "Onboarding", icon: "sparkles", hint: "Para nuevas incorporaciones" },
  ],
];
