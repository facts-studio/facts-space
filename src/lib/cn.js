// Une clases condicionalmente. Filtra falsy y aplana. No hace merge de Tailwind
// (mantén las clases sin conflictos; pásalas ordenadas base → override).
export function cn(...parts) {
  return parts
    .flat(Infinity)
    .filter(Boolean)
    .join(" ")
    .trim();
}
