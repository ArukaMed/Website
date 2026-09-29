import { dataStore } from "@aegis/database";
import { VisitingCard } from "@/components/visiting-card";
import { ThemeInjector } from "@aegis/ui";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{ slug?: string[] }>;
}

export default async function CatchAllCardPage({ params }: PageProps) {
  const { slug } = await params;
  let tenantSlug = "arukamed";
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
