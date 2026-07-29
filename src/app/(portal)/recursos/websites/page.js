import { getSites } from "@/lib/data/sites";
import { getCurrentEmployee } from "@/lib/data/helpers";
import SitesClient from "./sites-client";

export const metadata = { title: "Websites · Recursos" };

export default async function SitesPage() {
  const [sites, me] = await Promise.all([getSites(), getCurrentEmployee()]);
  const isAdmin = Boolean(me?.is_admin);
  return <SitesClient sites={sites} isAdmin={isAdmin} />;
}
