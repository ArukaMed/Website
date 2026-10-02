import { NextRequest, NextResponse } from "next/server";
import { verifyHoneypot, sanitizeHtmlText, leadRateLimiter, sendLeadAlertEmail } from "@aegis/auth";
import { LeadInquiryInputSchema } from "@aegis/types";
import { dataStore } from "@aegis/database";

export async function POST(req: NextRequest) {
  try {
    // 0. Rate limiting via Upstash Redis (if configured)
    if (leadRateLimiter) {
      const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
      const { success } = await leadRateLimiter.limit(ip);
      if (!success) {
        return NextResponse.json(
          { message: "Too many requests. Please try again shortly." },
          { status: 429 }
        );
      }
    }

    const body = await req.json();

    // 1. Bot check via honeypot
    if (!verifyHoneypot(body.website_hp)) {
      return NextResponse.json({ success: true, message: "Inquiry received" });
    }

    const tenantSlug = body.tenantSlug || process.env.DEFAULT_TENANT_SLUG || "arukamed";
    const tenant = await dataStore.getTenantBySlug(tenantSlug);

    // 2. Validate using Zod schema
    const parsed = LeadInquiryInputSchema.safeParse({
      tenantSlug,
      institutionName: sanitizeHtmlText(body.institutionName),
      businessType: sanitizeHtmlText(body.businessType),
      contactName: sanitizeHtmlText(body.contactName),
      phone: body.phone,
      email: body.email ? sanitizeHtmlText(body.email) : undefined,
      drugLicenceNumber: sanitizeHtmlText(body.drugLicenceNumber || ""),
      gstin: body.gstin ? sanitizeHtmlText(body.gstin) : undefined,
      requirementCategory: sanitizeHtmlText(body.requirementCategory || "General Wholesale"),
      estimatedMonthlyVolume: body.estimatedMonthlyVolume ? sanitizeHtmlText(body.estimatedMonthlyVolume) : undefined,
      sourceUrl: req.headers.get("referer") || req.nextUrl.origin,
    });

    if (!parsed.success) {
      const firstError = parsed.error.errors[0]?.message || "Validation failed";
      return NextResponse.json({ message: firstError }, { status: 400 });
    }

    // 3. Persist lead record
    const savedLead = await dataStore.createLead(tenantSlug, {
      institutionName: parsed.data.institutionName,
      businessType: parsed.data.businessType,
      contactName: parsed.data.contactName,
      phone: parsed.data.phone,
      email: parsed.data.email || null,
      drugLicenceNumber: parsed.data.drugLicenceNumber || null,
      gstin: parsed.data.gstin || null,
      requirementCategory: parsed.data.requirementCategory || null,
      estimatedMonthlyVolume: parsed.data.estimatedMonthlyVolume || null,
      sourceUrl: parsed.data.sourceUrl,
      userAgent: req.headers.get("user-agent") || null,
      ipAddress: req.headers.get("x-forwarded-for") || null,
    });

    // 4. Send background notification email via Resend
    const recipientEmail = tenant?.commercialSettings?.orderDeskEmail || "orders@arukamed.com";
    sendLeadAlertEmail({
      toEmail: recipientEmail,
      tenantName: tenant ? tenant.name : "Aruka Med",
      sourceType: "WEBSITE_INQUIRY",
      institutionName: parsed.data.institutionName,
      businessType: parsed.data.businessType,
      contactName: parsed.data.contactName,
      phone: parsed.data.phone,
      drugLicence: parsed.data.drugLicenceNumber,
      categoryOrVolume: parsed.data.requirementCategory,
      sourceUrl: parsed.data.sourceUrl,
    }).catch(() => {
      // Non-blocking notification
    });

    return NextResponse.json({
      success: true,
      message: "Lead inquiry registered successfully",
      leadId: savedLead.id,
    });
  } catch {
    return NextResponse.json({ message: "Invalid payload" }, { status: 400 });
  }
}

