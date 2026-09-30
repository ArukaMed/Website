import { dataStore } from "@aegis/database";
import { B2BSite } from "@/components/b2b-site";
import { ThemeInjector } from "@aegis/ui";
import { notFound } from "next/navigation";
import { headers } from "next/headers";

export default async function WebsiteHomePage() {
  const headersList = await headers();
  const host = headersList.get("host") || "";
  const defaultSlug = process.env.DEFAULT_TENANT_SLUG || "arukamed";

  // Dynamic tenant resolution: try custom domain match first, then fallback to default slug
  let tenant = await dataStore.getTenantByDomain(host);
  if (!tenant) {
    tenant = await dataStore.getTenantBySlug(defaultSlug);
  }

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

