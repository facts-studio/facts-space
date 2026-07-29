import { ScreenHeader } from "@/components/ui";
import MiEspacioClient from "./mi-espacio-client";
import { getCurrentEmployee } from "@/lib/data/helpers";
import { getMyOverview } from "@/lib/data/me";
import { getMyRequests } from "@/lib/actions/vacations";
import { getMyDocuments } from "@/lib/data/documents";
import { getMissingWorkdays } from "@/lib/data/time";
import { madridDateISO } from "@/lib/dates";

export default async function MiEspacioPage() {
  const me = await getCurrentEmployee();

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
      <MiEspacioClient me={me} overview={overview} missingCount={missing.length} requests={requests} documents={documents} />
    </div>
  );
}
