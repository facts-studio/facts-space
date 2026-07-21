import PageHeader from "@/components/PageHeader";
import AjustesClient from "./ajustes-client";
import { getCurrentEmployee } from "@/lib/data/helpers";

export default async function AjustesPage() {
  const me = await getCurrentEmployee();

  if (!me) {
    return (
      <div>
        <PageHeader eyebrow="Cuenta" title="Ajustes" helper="Tus datos de contacto y preferencias." />
        <div className="rounded-2xl bg-surface/55 p-6 text-small text-muted">
          Tu cuenta no está dada de alta como empleado. Pide a administración que te añada.
        </div>
      </div>
    );
  }

  // Solo lo que necesita la pantalla: nada de salario, IBAN ni DNI.
  const perfil = {
    name: me.name,
    last_name: me.last_name,
    email: me.email,
    role: me.role,
    photo: me.photo,
    is_admin: me.is_admin,
    theme: me.theme ?? null,
    personal_email: me.personal_email ?? "",
    mobile: me.mobile ?? "",
    phone: me.phone ?? "",
    address: me.address ?? "",
    city: me.city ?? "",
    postal_code: me.postal_code ?? "",
    province: me.province ?? "",
    country: me.country ?? "",
    emergency_contact: me.emergency_contact ?? "",
  };

  return (
    <div>
      <PageHeader eyebrow="Cuenta" title="Ajustes" helper="Tus datos de contacto y preferencias." />
      <AjustesClient me={perfil} />
    </div>
  );
}
