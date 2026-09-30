import { NextRequest, NextResponse } from "next/server";
import { dataStore } from "@aegis/database";
import type { EmployeeRecord } from "@aegis/database";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tenantSlug = searchParams.get("tenant") || process.env.DEFAULT_TENANT_SLUG || "arukamed";

  const employees = await dataStore.getAllEmployees(tenantSlug);
  return NextResponse.json({ employees });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const tenantSlug = body.tenantSlug || process.env.DEFAULT_TENANT_SLUG || "arukamed";
    const tenant = await dataStore.getTenantBySlug(tenantSlug);

    if (!tenant) {
      return NextResponse.json({ message: "Tenant not found" }, { status: 404 });
    }

    if (!body.firstName || !body.lastName || !body.phoneNumber || !body.email) {
      return NextResponse.json({ message: "Missing required employee fields" }, { status: 400 });
    }

    const slug =
      body.slug?.trim() ||
      `${body.firstName.toLowerCase()}-${body.lastName.toLowerCase()}-${Math.random().toString(36).substring(2, 6)}`;

    const newEmp: EmployeeRecord = {
      id: crypto.randomUUID(),
      tenantId: tenant.id,
      slug,
      firstName: body.firstName.trim(),
      lastName: body.lastName.trim(),
      avatarUrl: body.avatarUrl || null,
      designation: body.designation || "Sales Representative",
      division: body.division || "Wholesale Sales",
      territoryRegion: body.territoryRegion || "Regional",
      phoneNumber: body.phoneNumber.trim(),
      whatsappNumber: (body.whatsappNumber || body.phoneNumber).trim(),
      email: body.email.trim(),
      linkedinUrl: body.linkedinUrl || null,
      officeExtension: body.officeExtension || "101",
      customWhatsappTemplate: body.customWhatsappTemplate || null,
      customRateCardUrl: body.customRateCardUrl || null,
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
    return NextResponse.json({ message: err?.message || "Failed to add employee" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
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
    return NextResponse.json({ message: err?.message || "Failed to update employee" }, { status: 500 });
  }
}
