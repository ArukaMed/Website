import { dataStore } from "@aegis/database";
import { VisitingCard } from "@/components/visiting-card";
import { ThemeInjector } from "@aegis/ui";
import { notFound } from "next/navigation";
import { headers } from "next/headers";

export default async function DefaultCardPage() {
  const headersList = await headers();
  const host = headersList.get("host") || "";
  const baseDomain = host.replace(/^connect\./i, "").split(":")[0];
  const defaultSlug = process.env.DEFAULT_TENANT_SLUG || "arukamed";

  let tenant = await dataStore.getTenantByDomain(baseDomain);
  if (!tenant) {
    tenant = await dataStore.getTenantBySlug(defaultSlug);
  }

  if (!tenant) {
    notFound();
  }

  const employees = await dataStore.getAllEmployees(tenant.slug);
  const employee = employees.find((e) => e.isActive) || employees[0];

  if (!employee) {
    notFound();
  }

  // Increment scan count
  await dataStore.incrementStat(tenant.slug, employee.slug, "scan");

  const vcardUrl = `/api/vcard/${tenant.slug}/${employee.slug}`;

  return (
    <>
      <ThemeInjector theme={tenant.themeConfig} />
      <VisitingCard
        tenant={tenant as any}
        employee={employee as any}
        vcardUrl={vcardUrl}
      />
    </>
  );
}

