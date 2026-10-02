import { dataStore } from "@aegis/database";
import { AdminDashboard } from "@/components/admin-dashboard";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { getServerSession } from "@/lib/auth-session";

export default async function AdminHomePage() {
  const headersList = await headers();
  const host = headersList.get("host") || "";
  const baseDomain = host.replace(/^admin\./i, "").split(":")[0];
  const defaultSlug = process.env.DEFAULT_TENANT_SLUG || "arukamed";

  let tenant = await dataStore.getTenantByDomain(baseDomain);
  if (!tenant) {
    tenant = await dataStore.getTenantBySlug(defaultSlug);
  }

  if (!tenant) {
    notFound();
  }

  const session = await getServerSession();
  const employees = session ? await dataStore.getAllEmployees(tenant.slug) : [];
  const leads = session ? await dataStore.getAllLeads(tenant.slug) : [];

  // Guarantee plain serializable JSON across RSC boundary
  const safeTenant = JSON.parse(JSON.stringify(tenant));
  const safeEmployees = JSON.parse(JSON.stringify(employees));
  const safeLeads = JSON.parse(JSON.stringify(leads));
  const safeSession = session ? JSON.parse(JSON.stringify(session)) : null;

  return (
    <AdminDashboard
      initialTenant={safeTenant}
      initialEmployees={safeEmployees}
      initialLeads={safeLeads}
      initialSession={safeSession}
    />
  );
}

