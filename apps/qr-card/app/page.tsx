import { dataStore } from "@aegis/database";
import { CompanyCard } from "@/components/company-card";
import { ThemeInjector } from "@aegis/ui";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers();
  const host = headersList.get("host") || "";
  const baseDomain = host.replace(/^connect\./i, "").split(":")[0];
  const defaultSlug = process.env.DEFAULT_TENANT_SLUG || "arukamed";

  let tenant = await dataStore.getTenantByDomain(baseDomain);
  if (!tenant) {
    tenant = await dataStore.getTenantBySlug(defaultSlug);
  }

  const companyName = tenant?.complianceInfo?.legalEntityName || tenant?.name || "Aruka Med Pharmaceuticals Private Limited";

  return {
    title: `${companyName} | Official Corporate Connect`,
    description: `Official corporate connect card for ${companyName}. Licensed wholesale medicine distributor, WHO-GDP cold chain logistics, drug licences Form 20B/21B, and trade desk contact.`,
    openGraph: {
      title: `${companyName} | Official Connect`,
      description: "Licensed Wholesale Medicine Distributor & Cold Chain Pharma Logistics",
      images: [tenant?.logoUrlDark || "/assets/logos/Wordmark_darkBG.png"],
    },
  };
}

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

  const safeTenant = JSON.parse(JSON.stringify(tenant));
  const vcardUrl = `/api/vcard/${tenant.slug}/company`;

  return (
    <>
      <ThemeInjector theme={safeTenant.themeConfig} />
      <CompanyCard
        tenant={safeTenant}
        vcardUrl={vcardUrl}
      />
    </>
  );
}
