import { dataStore } from "@aegis/database";
import { B2BSite } from "@/components/b2b-site";
import { ThemeInjector } from "@aegis/ui";
import { notFound } from "next/navigation";

export default async function MarketingHomePage() {
  const tenant = await dataStore.getTenantBySlug("arukamed");

  if (!tenant) {
    notFound();
  }

  return (
    <>
      <ThemeInjector theme={tenant.themeConfig} />
      <B2BSite tenant={tenant as any} />
    </>
  );
}
