// Quién es del equipo y quién colabora desde fuera.
//
// Las cuentas @fcts.studio son plantilla del estudio; el resto son perfiles de
// cliente o colaboradores externos que entran al portal para lo compartido
// (tareas, calendario, políticas) pero no tienen relación laboral con nosotros:
// ni fichan, ni tienen nómina, contrato ni datos bancarios aquí.
//
// La marca vive en employees.is_external para poder forzarla desde admin; si la
// columna aún no existe, se deduce del dominio del email.
export const TEAM_DOMAIN = "fcts.studio";

export function isExternal(employee) {
  if (!employee) return false;
  if (typeof employee.is_external === "boolean") return employee.is_external;
  return !(employee.email || "").toLowerCase().endsWith(`@${TEAM_DOMAIN}`);
}

export const isTeam = (employee) => !isExternal(employee);

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
