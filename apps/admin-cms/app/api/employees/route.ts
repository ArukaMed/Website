import { NextRequest, NextResponse } from "next/server";
import { dataStore } from "@aegis/database";
import type { EmployeeRecord } from "@aegis/database";
import { getSessionFromRequest } from "@/lib/auth-session";
import { assertAuthorized } from "@aegis/auth";
import { UserRole } from "@aegis/types";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tenantSlug = searchParams.get("tenant") || process.env.DEFAULT_TENANT_SLUG || "arukamed";

  const employees = await dataStore.getAllEmployees(tenantSlug);
  return NextResponse.json({ employees });
}

export async function POST(req: NextRequest) {
  try {
    const session = getSessionFromRequest(req);
    // Enforce role check if authenticated
    if (session) {
      assertAuthorized({
        user: session,
        allowedRoles: [UserRole.SUPER_ADMIN, UserRole.BRAND_ADMIN],
      });
    }

    const body = await req.json();
    const tenantSlug = body.tenantSlug || process.env.DEFAULT_TENANT_SLUG || "arukamed";
    const tenant = await dataStore.getTenantBySlug(tenantSlug);

    if (!tenant) {
      return NextResponse.json({ message: "Tenant not found" }, { status: 404 });
    }

    if (!body.firstName || !body.lastName || !body.phoneNumber || !body.email) {
      return NextResponse.json({ message: "Missing required employee fields" }, { status: 400 });
    }

    const rawSlug = body.slug?.trim() || `${body.firstName.toLowerCase()}-${body.lastName.toLowerCase()}-${Math.random().toString(36).substring(2, 6)}`;
    const slug = rawSlug.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-");

    const newEmp: EmployeeRecord = {
      id: crypto.randomUUID(),
      tenantId: tenant.id,
      slug,
      firstName: body.firstName.trim(),
      lastName: body.lastName.trim(),
      avatarUrl: body.avatarUrl?.trim() || null,
      designation: body.designation?.trim() || "Sales Representative",
      division: body.division?.trim() || "Wholesale Sales",
      territoryRegion: body.territoryRegion?.trim() || "Regional",
      phoneNumber: body.phoneNumber.trim(),
      whatsappNumber: (body.whatsappNumber || body.phoneNumber).trim(),
      email: body.email.trim(),
      linkedinUrl: body.linkedinUrl?.trim() || null,
      officeExtension: body.officeExtension?.trim() || "101",
      customWhatsappTemplate: body.customWhatsappTemplate?.trim() || null,
      customRateCardUrl: body.customRateCardUrl?.trim() || null,
      isActive: true,
      scanCount: 0,
      vcardDownloads: 0,
      whatsappClicks: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await dataStore.saveEmployee(tenantSlug, newEmp);

    return NextResponse.json({
      success: true,
      message: "Employee successfully onboarded",
      employee: newEmp,
    });
  } catch (err: any) {
    const status = err?.message?.includes("Unauthorized") ? 403 : 500;
    return NextResponse.json({ message: err?.message || "Failed to add employee" }, { status });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = getSessionFromRequest(req);
    if (session) {
      assertAuthorized({
        user: session,
        allowedRoles: [UserRole.SUPER_ADMIN, UserRole.BRAND_ADMIN, UserRole.OPS_MANAGER],
      });
    }

    const body = await req.json();
    const tenantSlug = body.tenantSlug || process.env.DEFAULT_TENANT_SLUG || "arukamed";
    const employeeSlug = body.employeeSlug;

    if (!employeeSlug) {
      return NextResponse.json({ message: "Employee slug required" }, { status: 400 });
    }

    const updated = await dataStore.updateEmployee(tenantSlug, employeeSlug, body.patch || {});
    if (!updated) {
      return NextResponse.json({ message: "Employee not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Employee updated successfully",
      employee: updated,
    });
  } catch (err: any) {
    const status = err?.message?.includes("Unauthorized") ? 403 : 500;
    return NextResponse.json({ message: err?.message || "Failed to update employee" }, { status });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = getSessionFromRequest(req);
    if (session) {
      assertAuthorized({
        user: session,
        allowedRoles: [UserRole.SUPER_ADMIN, UserRole.BRAND_ADMIN],
      });
    }

    const { searchParams } = new URL(req.url);
    const tenantSlug = searchParams.get("tenant") || process.env.DEFAULT_TENANT_SLUG || "arukamed";
    const employeeSlug = searchParams.get("employee");

    if (!employeeSlug) {
      return NextResponse.json({ message: "Employee slug required" }, { status: 400 });
    }

    const success = await dataStore.deleteEmployee(tenantSlug, employeeSlug);
    return NextResponse.json({
      success,
      message: success ? "Employee deleted" : "Employee not found",
    });
  } catch (err: any) {
    const status = err?.message?.includes("Unauthorized") ? 403 : 500;
    return NextResponse.json({ message: err?.message || "Failed to delete employee" }, { status });
  }
}
