import { dataStore } from "@aegis/database";
import { VisitingCard } from "@/components/visiting-card";
import { ThemeInjector } from "@aegis/ui";
import { notFound } from "next/navigation";
import { headers } from "next/headers";

interface PageProps {
  params: Promise<{ slug?: string[] }>;
}

export default async function CatchAllCardPage({ params }: PageProps) {
  const { slug } = await params;
  const headersList = await headers();
  const host = headersList.get("host") || "";
  const baseDomain = host.replace(/^connect\./i, "").split(":")[0];
  const defaultSlug = process.env.DEFAULT_TENANT_SLUG || "arukamed";

  // Check if tenant matches the host's custom domain
  const domainTenant = await dataStore.getTenantByDomain(baseDomain);
  let tenantSlug = domainTenant ? domainTenant.slug : defaultSlug;
  let employeeSlug = "amit-sharma-4k7q";

  if (slug && slug.length === 1) {
    employeeSlug = slug[0];
  } else if (slug && slug.length >= 2) {
    tenantSlug = slug[0];
    employeeSlug = slug[1];
  }


  const tenant = await dataStore.getTenantBySlug(tenantSlug);
  const employee = await dataStore.getEmployeeBySlug(tenantSlug, employeeSlug);

  if (!tenant || !employee || !employee.isActive) {
    notFound();
  }

  await dataStore.incrementStat(tenantSlug, employeeSlug, "scan");

  const vcardUrl = `/api/vcard/${tenantSlug}/${employeeSlug}`;

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
