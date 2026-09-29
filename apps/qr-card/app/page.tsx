import { dataStore } from "@aegis/database";
import { VisitingCard } from "@/components/visiting-card";
import { ThemeInjector } from "@aegis/ui";
import { notFound } from "next/navigation";

export default async function DefaultCardPage() {
  const tenant = await dataStore.getTenantBySlug("arukamed");
  const employee = await dataStore.getEmployeeBySlug("arukamed", "amit-sharma-4k7q");

  if (!tenant || !employee) {
    notFound();
  }

  // Increment scan count
  await dataStore.incrementStat("arukamed", "amit-sharma-4k7q", "scan");

  const vcardUrl = `/api/vcard/arukamed/amit-sharma-4k7q`;

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
