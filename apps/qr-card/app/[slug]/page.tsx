import { dataStore } from "@aegis/database";
import { VisitingCard } from "@/components/visiting-card";
import { ThemeInjector } from "@aegis/ui";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const headersList = await headers();
  const host = headersList.get("host") || "";
  const baseDomain = host.replace(/^connect\./i, "").split(":")[0];
  const defaultSlug = process.env.DEFAULT_TENANT_SLUG || "arukamed";

  const domainTenant = await dataStore.getTenantByDomain(baseDomain);
  const tenantSlug = domainTenant ? domainTenant.slug : defaultSlug;

  const tenant = await dataStore.getTenantBySlug(tenantSlug);
  const employee = await dataStore.getPublicEmployeeProfile(tenantSlug, slug);

  if (!employee) return {};

  const fullName = `${employee.firstName} ${employee.lastName}`.trim();

  return {
    title: `${fullName} | ${employee.designation} • ${tenant?.name || "Aruka Med"}`,
    description: `Official digital visiting card for ${fullName}, ${employee.designation} at ${tenant?.name || "Aruka Med"} (${employee.territoryRegion}).`,
    openGraph: {
      title: `${fullName} | ${tenant?.name || "Aruka Med"}`,
      description: `${employee.designation} • ${employee.territoryRegion}`,
      images: employee.avatarUrl ? [employee.avatarUrl] : [],
    },
  };
}

export default async function DirectCardPage({ params }: PageProps) {
  const { slug } = await params;

  // Reserved paths that should never match an employee slug
  const reservedSlugs = ["api", "c", "favicon.ico", "robots.txt", "sitemap.xml", "assets"];
  if (reservedSlugs.includes(slug.toLowerCase())) {
    notFound();
  }

  const headersList = await headers();
  const host = headersList.get("host") || "";
  const baseDomain = host.replace(/^connect\./i, "").split(":")[0];
  const defaultSlug = process.env.DEFAULT_TENANT_SLUG || "arukamed";

  const domainTenant = await dataStore.getTenantByDomain(baseDomain);
  const tenantSlug = domainTenant ? domainTenant.slug : defaultSlug;

  const tenant = await dataStore.getTenantBySlug(tenantSlug);
  const employee = await dataStore.getPublicEmployeeProfile(tenantSlug, slug);

  if (!tenant || !employee || !employee.isActive) {
    notFound();
  }

  await dataStore.incrementStat(tenantSlug, slug, "scan");

  const vcardUrl = `/api/vcard/${tenantSlug}/${slug}`;
  const safeTenant = JSON.parse(JSON.stringify(tenant));
  const safeEmployee = JSON.parse(JSON.stringify(employee));

  return (
    <>
      <ThemeInjector theme={safeTenant.themeConfig} />
      <VisitingCard
        tenant={safeTenant}
        employee={safeEmployee}
        vcardUrl={vcardUrl}
      />
    </>
  );
}
