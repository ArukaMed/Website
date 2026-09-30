import { NextRequest, NextResponse } from "next/server";
import { verifyHoneypot, sanitizeHtmlText, sendLeadAlertEmail } from "@aegis/auth";
import { LeadInquiryInputSchema } from "@aegis/types";
import { dataStore } from "@aegis/database";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // 1. Honeypot check
    if (!verifyHoneypot(body.website_hp)) {
      // Silently accept bots without storing
      return NextResponse.json({ success: true, message: "Request received" });
    }

    const tenantSlug = body.tenantSlug || process.env.DEFAULT_TENANT_SLUG || "arukamed";
    const employeeSlug = body.employeeSlug;

    const tenant = await dataStore.getTenantBySlug(tenantSlug);
    const employee = employeeSlug ? await dataStore.getEmployeeBySlug(tenantSlug, employeeSlug) : null;

    // 2. Validate input
    const parsed = LeadInquiryInputSchema.safeParse({
      tenantSlug,
      employeeSlug: body.employeeSlug,
      institutionName: sanitizeHtmlText(body.businessName),
      businessType: sanitizeHtmlText(body.businessType),
      contactName: sanitizeHtmlText(body.contactName),
      phone: body.phone,
      drugLicenceNumber: sanitizeHtmlText(body.licence || ""),
      estimatedMonthlyVolume: sanitizeHtmlText(body.note || ""),
      sourceUrl: req.headers.get("referer") || req.nextUrl.origin,
    });

    if (!parsed.success) {
      const err = parsed.error.errors[0]?.message || "Validation failed";
      return NextResponse.json({ message: err }, { status: 400 });
    }

    // 3. Persist lead record
    const savedLead = await dataStore.createLead(tenantSlug, {
      employeeId: employee?.id || null,
      institutionName: parsed.data.institutionName,
      businessType: parsed.data.businessType,
      contactName: parsed.data.contactName,
      phone: parsed.data.phone,
      drugLicenceNumber: parsed.data.drugLicenceNumber || null,
      estimatedMonthlyVolume: parsed.data.estimatedMonthlyVolume || null,
      sourceUrl: parsed.data.sourceUrl,
      userAgent: req.headers.get("user-agent") || null,
      ipAddress: req.headers.get("x-forwarded-for") || null,
    });

    // 4. Send email alert via Resend
    const recipientEmail = tenant?.commercialSettings?.orderDeskEmail || "credit@arukamed.com";
    const employeeName = employee ? `${employee.firstName} ${employee.lastName}` : null;

    sendLeadAlertEmail({
      toEmail: recipientEmail,
      tenantName: tenant ? tenant.name : "Aruka Med",
      sourceType: "VISITING_CARD_CREDIT",
      institutionName: parsed.data.institutionName,
      businessType: parsed.data.businessType,
      contactName: parsed.data.contactName,
      phone: parsed.data.phone,
      drugLicence: parsed.data.drugLicenceNumber,
      categoryOrVolume: parsed.data.estimatedMonthlyVolume,
      sourceUrl: parsed.data.sourceUrl,
      employeeName,
    }).catch(() => {
      // Non-blocking
    });

    return NextResponse.json({
      success: true,
      message: "Credit inquiry registered successfully",
      leadId: savedLead.id,
    });
  } catch {
    return NextResponse.json({ message: "Invalid payload" }, { status: 400 });
  }
}

