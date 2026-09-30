import { NextRequest, NextResponse } from "next/server";
import { dataStore } from "@aegis/database";
import { getSessionFromRequest } from "@/lib/auth-session";
import { assertAuthorized } from "@aegis/auth";
import { UserRole } from "@aegis/types";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tenantSlug = searchParams.get("slug") || process.env.DEFAULT_TENANT_SLUG || "arukamed";
  const tenant = await dataStore.getTenantBySlug(tenantSlug);

  if (!tenant) {
    return NextResponse.json({ message: "Tenant not found" }, { status: 404 });
  }

  return NextResponse.json({ tenant });
}

export async function PUT(req: NextRequest) {
  try {
    const session = getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ message: "Authentication required" }, { status: 401 });
    }

    // RBAC validation: only SUPER_ADMIN and BRAND_ADMIN can edit corporate & content details
    assertAuthorized({
      user: session,
      allowedRoles: [UserRole.SUPER_ADMIN, UserRole.BRAND_ADMIN],
    });

    const body = await req.json();
    const tenantSlug = body.slug || process.env.DEFAULT_TENANT_SLUG || "arukamed";

    const existingTenant = await dataStore.getTenantBySlug(tenantSlug);
    if (!existingTenant) {
      return NextResponse.json({ message: "Tenant not found" }, { status: 404 });
    }

    // Merge incoming changes
    const patch = {
      ...(body.name ? { name: body.name.trim() } : {}),
      ...(body.customDomain !== undefined ? { customDomain: body.customDomain?.trim() || null } : {}),
      ...(body.logoUrlLight ? { logoUrlLight: body.logoUrlLight.trim() } : {}),
      ...(body.logoUrlDark !== undefined ? { logoUrlDark: body.logoUrlDark?.trim() || null } : {}),
      ...(body.markUrl !== undefined ? { markUrl: body.markUrl?.trim() || null } : {}),
      ...(body.themeConfig ? { themeConfig: { ...existingTenant.themeConfig, ...body.themeConfig } } : {}),
      ...(body.complianceInfo ? { complianceInfo: { ...existingTenant.complianceInfo, ...body.complianceInfo } } : {}),
      ...(body.commercialSettings ? { commercialSettings: { ...existingTenant.commercialSettings, ...body.commercialSettings } } : {}),
      ...(body.featureFlags ? { featureFlags: { ...existingTenant.featureFlags, ...body.featureFlags } } : {}),
      ...(body.websiteContent ? { websiteContent: { ...existingTenant.websiteContent, ...body.websiteContent } } : {}),
    };

    const updated = await dataStore.updateTenant(tenantSlug, patch);

    return NextResponse.json({
      success: true,
      message: "Details saved and published successfully",
      tenant: updated,
    });
  } catch (err: any) {
    const status = err?.message?.includes("Unauthorized") ? 403 : 500;
    return NextResponse.json({ message: err?.message || "Failed to update tenant" }, { status });
  }
}
