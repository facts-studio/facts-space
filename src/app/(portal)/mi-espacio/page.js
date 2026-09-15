import { ScreenHeader } from "@/components/ui";
import MiEspacioClient from "./mi-espacio-client";
import { getCurrentEmployee } from "@/lib/data/helpers";
import { getMyOverview } from "@/lib/data/me";
import { getMyRequests } from "@/lib/actions/vacations";
import { getMyDocuments } from "@/lib/data/documents";
import { getMissingWorkdays } from "@/lib/data/time";
import { madridDateISO } from "@/lib/dates";
import { getMisTokens } from "@/lib/data/mis-tokens";
import SinAcceso from "@/components/SinAcceso";
import { isColaborador } from "@/lib/team";

export default async function MiEspacioPage() {
  const me = await getCurrentEmployee();
  const tokens = await getMisTokens();
  // La URL que hay que pegar en ChatGPT. En local no sirve de nada —el
  // conector vive en su nube— pero se enseña igual para no mentir sobre dónde
  // apunta cada entorno.
  const urlMcp = `${process.env.SHARE_BASE_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${(process.env.SHARE_BASE_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL).replace(/^https?:\/\//, "")}` : process.env.NEXT_PUBLIC_SITE_URL || ""}/api/mcp`;
  // Esconder el enlace no cierra la ruta.
  if (isColaborador(me)) {
    return (
      <SinAcceso kicker="Personal" title="Mi espacio">
        Tu espacio personal es de la plantilla del estudio. Como colaborador entras solo para los
        proyectos que se te adjudican, así que aquí no hay nada tuyo que guardar.
      </SinAcceso>
    );
  }

  if (!me) {
    return (
      <div>
        <ScreenHeader kicker="Personal" title="Mi espacio" />
        <div className="rounded-2xl bg-surface/55 p-6 text-small text-muted">
          Tu cuenta no está dada de alta como empleado. Pide a administración que te añada.
        </div>
      </div>
    );
  }

  const today = madridDateISO();
  const [overview, missing, requests, documents] = await Promise.all([
    getMyOverview(me),
    getMissingWorkdays(me, `${today.slice(0, 7)}-01`, today),
    getMyRequests(),
    getMyDocuments(),
  ]);

  return (
    <div>
      <ScreenHeader kicker="Personal" title="Mi espacio" />
      <MiEspacioClient
        me={me}
        overview={overview}
        missingCount={missing.length}
        requests={requests}
        documents={documents}
        tokens={tokens}
        urlMcp={urlMcp}
      />
    </div>
  );
}
