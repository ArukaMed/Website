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

  return (
    <AdminDashboard
      initialTenant={tenant as any}
      initialEmployees={employees as any}
      initialLeads={leads as any}
      initialSession={session}
    />
  );
}

