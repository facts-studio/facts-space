import { redirect } from "next/navigation";

// "Recursos" es una categoría, no una pantalla: las páginas son las de dentro
// (Programas, Websites, F*cts Tools). Al entrar, se abre la primera.
export default function RecursosIndex() {
  redirect("/recursos/programas");
}
