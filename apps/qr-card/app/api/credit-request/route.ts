import { NextRequest, NextResponse } from "next/server";
import { verifyHoneypot, sanitizeHtmlText } from "@aegis/auth";
import { LeadInquiryInputSchema } from "@aegis/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // 1. Honeypot check
    if (!verifyHoneypot(body.website_hp)) {
      // Silently accept bots without storing
      return NextResponse.json({ success: true, message: "Request received" });
    }

    // 2. Validate input
    const parsed = LeadInquiryInputSchema.safeParse({
      tenantSlug: body.tenantSlug || "arukamed",
      employeeSlug: body.employeeSlug,
      institutionName: sanitizeHtmlText(body.businessName),
      businessType: sanitizeHtmlText(body.businessType),
      contactName: sanitizeHtmlText(body.contactName),
      phone: body.phone,
      drugLicenceNumber: sanitizeHtmlText(body.licence || ""),
      estimatedMonthlyVolume: sanitizeHtmlText(body.note || ""),
      sourceUrl: req.headers.get("referer") || "https://c.arukamed.com",
    });

    if (!parsed.success) {
      const err = parsed.error.errors[0]?.message || "Validation failed";
      return NextResponse.json({ message: err }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: "Credit inquiry registered successfully",
      lead: parsed.data,
    });
  } catch {
    return NextResponse.json({ message: "Invalid payload" }, { status: 400 });
  }
}
