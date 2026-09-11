// Navegación del portal, en grupos separados por hairlines. Cada grupo es un
// array de items; un item puede tener `children` (sub-navegación, p. ej. las
// áreas de Recursos). Un item con `children` NO navega: es solo el desplegable
// de lo que contiene (su `href` se usa para saber si la sección está activa).
//
// Dos banderas de acceso (ver src/lib/team.js):
//   team:  solo plantilla del estudio (un externo no ficha).
//   colab: también lo ve un colaborador. Sin esto, no. Un colaborador entra
//          solo por sus proyectos, así que su portal es Inicio y poco más.
export const NAV_GROUPS = [
  [
    { href: "/", label: "Inicio", icon: "home", colab: true },
    { href: "/tareas", label: "Tareas", icon: "tasks" },
    { href: "/calendario", label: "Calendario", icon: "calendar" },
    { href: "/fichaje", label: "Fichaje", icon: "clock", team: true },
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
        { href: "/recursos/programas", label: "Programas", icon: "grid" },
        { href: "/recursos/websites", label: "Websites", icon: "eye" },
        { href: "/tools", label: "F*cts Tools", icon: "tools" },
      ],
    },
    { href: "/clientes", label: "Clientes", icon: "briefcase" },
  ],
];

// Filtra la navegación por el acceso de quien mira.
export function navFor({ isExternal = false, isColaborador = false } = {}) {
  return NAV_GROUPS
    .map((group) => group.filter((item) => {
      if (isColaborador) return item.colab;
      return !item.team || !isExternal;
    }))
    .filter((group) => group.length);
}
