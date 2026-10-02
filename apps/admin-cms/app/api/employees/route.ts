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
    if (!session) {
      return NextResponse.json({ message: "Authentication required" }, { status: 401 });
    }
    assertAuthorized({
      user: session,
      allowedRoles: [UserRole.SUPER_ADMIN, UserRole.FOUNDER, UserRole.BRAND_ADMIN, UserRole.R_HRO],
    });

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
    const employeeCode = body.employeeCode?.trim() || `EMP-${Math.floor(10000 + Math.random() * 90000)}`;

    const newEmp: EmployeeRecord = {
      id: crypto.randomUUID(),
      tenantId: tenant.id,
      slug,
      employeeCode,
      firstName: body.firstName.trim(),
      lastName: body.lastName.trim(),
      preferredName: body.preferredName?.trim() || body.firstName.trim(),
      pronouns: body.pronouns?.trim() || "He/Him",
      dateOfBirth: body.dateOfBirth?.trim() || "1992-01-01",
      gender: body.gender?.trim() || "Prefer not to say",
      maritalStatus: body.maritalStatus?.trim() || "Single",
      nationality: body.nationality?.trim() || "Indian",
      avatarUrl: body.avatarUrl?.trim() || null,
      bio: body.bio?.trim() || "Aruka Med team member dedicated to quality wholesale pharmaceutical supply and healthcare logistics.",
      skills: Array.isArray(body.skills) ? body.skills : ["Pharma Distribution", "Supply Chain Operations", "Hospital Account Support"],
      languages: Array.isArray(body.languages) ? body.languages : ["English", "Hindi"],

      // Contact & Address
      phoneNumber: body.phoneNumber.trim(),
      whatsappNumber: (body.whatsappNumber || body.phoneNumber).trim(),
      email: body.email.trim(),
      personalEmail: body.personalEmail?.trim() || null,
      personalPhone: body.personalPhone?.trim() || null,
      alternatePhone: body.alternatePhone?.trim() || null,
      officeExtension: body.officeExtension?.trim() || "101",
      currentAddress: body.currentAddress || {
        line1: body.addressLine1?.trim() || "#101 Central Corporate Park",
        city: body.city?.trim() || "Kanpur",
        state: body.state?.trim() || "Uttar Pradesh",
        pincode: body.pincode?.trim() || "208001",
        country: "India",
        verified: true,
      },
      permanentAddress: body.permanentAddress || {
        sameAsCurrent: true,
        line1: body.addressLine1?.trim() || "#101 Central Corporate Park",
        city: body.city?.trim() || "Kanpur",
        state: body.state?.trim() || "Uttar Pradesh",
        pincode: body.pincode?.trim() || "208001",
        country: "India",
        verified: true,
      },

      // Emergency Contacts
      emergencyContacts: Array.isArray(body.emergencyContacts) && body.emergencyContacts.length > 0 ? body.emergencyContacts : [
        {
          id: crypto.randomUUID(),
          name: body.emergencyContact1Name?.trim() || "Primary Emergency Contact",
          relationship: body.emergencyContact1Rel?.trim() || "Family",
          primaryPhone: body.emergencyContact1Phone?.trim() || body.phoneNumber.trim(),
          isPrimary: true,
        },
        {
          id: crypto.randomUUID(),
          name: body.emergencyContact2Name?.trim() || "Secondary Emergency Contact",
          relationship: body.emergencyContact2Rel?.trim() || "Relative",
          primaryPhone: body.emergencyContact2Phone?.trim() || "+91 91234 56789",
          isPrimary: false,
        },
      ],

      // Job & Org
      designation: body.designation?.trim() || "Operations Specialist",
      department: body.department?.trim() || body.division?.trim() || "Wholesale Operations",
      division: body.division?.trim() || "Wholesale Sales",
      territoryRegion: body.territoryRegion?.trim() || "Regional Hub",
      directManager: body.directManager || {
        id: "mgr-default",
        name: body.managerName?.trim() || "Alex Smith",
        designation: "Head of Operations",
        email: "alex.smith@arukamed.com",
        employeeCode: "EMP-10001",
      },
      employmentType: body.employmentType || "Full-time (Perm)",
      employmentStatus: body.employmentStatus || "Active",
      joiningDate: body.joiningDate || new Date().toISOString().split("T")[0],
      confirmationDate: body.confirmationDate || null,
      workLocation: body.workLocation?.trim() || "Kanpur Logistics Hub, India",
      shiftSchedule: body.shiftSchedule || "Standard Shift (09:30 AM - 06:30 PM IST)",
      timezone: body.timezone || "Asia/Kolkata",
      workFromHomePolicy: body.workFromHomePolicy || "On-Site Hub (5 Days/Week)",
      noticePeriodDays: Number(body.noticePeriodDays || 60),
      bandGrade: body.bandGrade || "L3 - Specialist",
      costCenter: body.costCenter || "CC-OPS-NORTH",

      // Statutory & Tax
      panNumber: body.panNumber?.trim() || "ABCDE1234F",
      aadhaarNumber: body.aadhaarNumber?.trim() || "XXXX-XXXX-1234",
      providentFundUan: body.providentFundUan?.trim() || "100912345678",
      esicNumber: body.esicNumber?.trim() || null,
      taxRegime: body.taxRegime || "New Tax Regime (115BAC)",
      statutoryStatus: body.statutoryStatus || "Pending HR Review",

      // Financial & Banking
      bankAccount: body.bankAccount || {
        bankName: body.bankName?.trim() || "HDFC Bank Ltd",
        accountHolderName: body.accountHolderName?.trim() || `${body.firstName} ${body.lastName}`.trim(),
        accountNumber: body.accountNumber?.trim() || "50100998877665",
        routingCode: body.routingCode?.trim() || "HDFC0001234",
        accountType: "Salary",
        verificationStatus: "Penny-Drop Verified",
      },
      salaryStructure: body.salaryStructure || {
        baseAnnualINR: Number(body.baseAnnualINR || 1200000),
        monthlyGrossINR: Number(body.monthlyGrossINR || 100000),
        variableAnnualINR: Number(body.variableAnnualINR || 150000),
        currency: "INR",
      },
      payrollFreezeNotice: null,

      // Education & Prior Employment
      education: Array.isArray(body.education) ? body.education : [
        {
          id: crypto.randomUUID(),
          institution: body.highestDegreeInstitution?.trim() || "Kanpur University",
          degree: body.highestDegree?.trim() || "Bachelor of Science",
          fieldOfStudy: "Sciences & Management",
          graduationYear: "2018",
        },
      ],
      priorEmployment: Array.isArray(body.priorEmployment) ? body.priorEmployment : [
        {
          id: crypto.randomUUID(),
          company: body.priorCompany?.trim() || "Regional Healthcare Distributors",
          designation: body.priorDesignation?.trim() || "Supply Associate",
          startDate: "2019-01",
          endDate: "2023-01",
        },
      ],

      // Dependents
      dependents: Array.isArray(body.dependents) ? body.dependents : [
        {
          id: crypto.randomUUID(),
          name: body.dependentName?.trim() || "Nominee Family Member",
          relationship: body.dependentRelationship?.trim() || "Spouse",
          nomineeAllocationPercent: 100,
          benefitType: "Group Medical Cover & Gratuity",
        },
      ],

      // Hardware Assets
      assignedAssets: Array.isArray(body.assignedAssets) ? body.assignedAssets : [
        {
          id: crypto.randomUUID(),
          assetName: "Standard Operations Laptop",
          category: "Laptop",
          serialNumber: `SN-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
          assignedDate: new Date().toISOString().split("T")[0],
          status: "Assigned & Active",
        },
      ],

      // Documents
      documents: Array.isArray(body.documents) ? body.documents : [
        {
          id: crypto.randomUUID(),
          title: "Identity & Tax Verification",
          category: "Statutory Tax",
          fileName: "PAN_Card_Copy.pdf",
          fileUrl: "/docs/pan_copy.pdf",
          fileSize: "1.1 MB",
          uploadedAt: new Date().toISOString().split("T")[0],
          status: "Verified",
        },
      ],

      // Revision History
      revisionHistory: [
        {
          id: crypto.randomUUID(),
          timestamp: new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
          editorName: session.fullName || "Admin Ops",
          editorRole: session.role || "HR Admin",
          category: "Enrollment",
          field: "Profile Created",
          oldValue: "None",
          newValue: "Onboarded & Enrolled",
          requiresApproval: false,
          status: "Approved",
        },
      ],

      // Public Visiting Card Overrides
      linkedinUrl: body.linkedinUrl?.trim() || null,
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
      message: "Employee successfully enrolled into operations & digital card registry",
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
    if (!session) {
      return NextResponse.json({ message: "Authentication required" }, { status: 401 });
    }
    assertAuthorized({
      user: session,
      allowedRoles: [UserRole.SUPER_ADMIN, UserRole.FOUNDER, UserRole.BRAND_ADMIN, UserRole.OPS_MANAGER, UserRole.R_HRO, UserRole.R_PAY],
    });

    const body = await req.json();
    const tenantSlug = body.tenantSlug || process.env.DEFAULT_TENANT_SLUG || "arukamed";
    const employeeSlug = body.employeeSlug;

    if (!employeeSlug) {
      return NextResponse.json({ message: "Employee slug required" }, { status: 400 });
    }

    const currentEmp = await dataStore.getEmployeeBySlug(tenantSlug, employeeSlug);
    if (!currentEmp) {
      return NextResponse.json({ message: "Employee not found" }, { status: 404 });
    }

    const patch = body.patch || {};

    // Auto-record revision history entry if audit info provided
    if (body.auditEntry) {
      const history = currentEmp.revisionHistory || [];
      const newEntry = {
        id: crypto.randomUUID(),
        timestamp: new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
        editorName: session.fullName || "Admin",
        editorRole: session.role || "HR Admin",
        category: body.auditEntry.category || "General",
        field: body.auditEntry.field || "Updated Field",
        oldValue: String(body.auditEntry.oldValue ?? "Previous"),
        newValue: String(body.auditEntry.newValue ?? "Updated"),
        requiresApproval: Boolean(body.auditEntry.requiresApproval),
        status: body.auditEntry.status || "Approved",
      };
      patch.revisionHistory = [newEntry, ...history];
    }

    const updated = await dataStore.updateEmployee(tenantSlug, employeeSlug, patch);
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
    if (!session) {
      return NextResponse.json({ message: "Authentication required" }, { status: 401 });
    }
    assertAuthorized({
      user: session,
      allowedRoles: [UserRole.SUPER_ADMIN, UserRole.FOUNDER, UserRole.BRAND_ADMIN],
    });

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
