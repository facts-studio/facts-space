// Quién es del equipo, quién colabora desde fuera y con qué acceso.
//
// Tres roles (employees.access_role), de más a menos acceso:
//
//   interno      Plantilla del estudio. Todo el portal.
//   externo      Trabaja con el equipo a diario pero no está contratado por
//                nosotros: sin fichaje ni nómina, contrato o datos bancarios.
//                El resto (calendario, equipo, políticas, tareas) igual que un
//                interno.
//   colaborador  Entra solo para los proyectos que se le adjudican. Versión
//                mínima: ni fichaje, ni Mi espacio, ni Equipo, ni Políticas, ni
//                Calendario. Tampoco los cumpleaños ni las vacaciones del
//                equipo: solo lo que atañe a sus proyectos.
//
// La columna manda; si aún no existe se deduce de is_external (su antecesor) y,
// en último caso, del dominio del email.
export const TEAM_DOMAIN = "fcts.studio";

export const ACCESS_ROLES = {
  interno: {
    label: "Interno",
    short: "Interno",
    hint: "Plantilla del estudio: todo el portal, con fichaje y ficha laboral.",
  },
  externo: {
    label: "Externo",
    short: "Externo",
    hint: "Trabaja con el equipo pero no está contratado por nosotros: sin fichaje ni nóminas.",
  },
  colaborador: {
    label: "Colaborador",
    short: "Colab.",
    hint: "Solo los proyectos que se le adjudican: portal mínimo, sin calendario ni equipo.",
  },
};

export function roleOf(employee) {
  if (!employee) return "interno";
  if (ACCESS_ROLES[employee.access_role]) return employee.access_role;
  if (typeof employee.is_external === "boolean") return employee.is_external ? "externo" : "interno";
  return (employee.email || "").toLowerCase().endsWith(`@${TEAM_DOMAIN}`) ? "interno" : "externo";
}

// Plantilla = lo que tiene relación laboral con nosotros. Un colaborador
// tampoco la tiene, así que hereda todo lo que se le oculta a un externo.
export const isExternal = (employee) => (employee ? roleOf(employee) !== "interno" : false);
export const isTeam = (employee) => !isExternal(employee);
export const isColaborador = (employee) => roleOf(employee) === "colaborador";

// Empresa a la que pertenece un externo. Si no está rellenada en su ficha, se
// usa el dominio de su email como pista ("unfiltrade.com" → "Unfiltrade").
export function companyOf(employee) {
  if (!employee) return null;
  if (employee.company) return employee.company;
  if (!isExternal(employee)) return "F*cts Studio";
  const domain = (employee.email || "").split("@")[1];
  if (!domain) return null;
  const name = domain.split(".")[0];
  return name ? name.charAt(0).toUpperCase() + name.slice(1) : null;
}
