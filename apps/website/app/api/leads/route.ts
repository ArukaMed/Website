import { NextRequest, NextResponse } from "next/server";
import { verifyHoneypot, sanitizeHtmlText, leadRateLimiter } from "@aegis/auth";
import { LeadInquiryInputSchema } from "@aegis/types";

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

    // 2. Validate using Zod schema
    const parsed = LeadInquiryInputSchema.safeParse({
      tenantSlug: body.tenantSlug || "arukamed",
      institutionName: sanitizeHtmlText(body.institutionName),
      businessType: sanitizeHtmlText(body.businessType),
      contactName: sanitizeHtmlText(body.contactName),
      phone: body.phone,
      drugLicenceNumber: sanitizeHtmlText(body.drugLicenceNumber || ""),
      requirementCategory: sanitizeHtmlText(body.requirementCategory || "General Wholesale"),
      sourceUrl: req.headers.get("referer") || req.nextUrl.origin,
    });

    if (!parsed.success) {
      const firstError = parsed.error.errors[0]?.message || "Validation failed";
      return NextResponse.json({ message: firstError }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: "Lead inquiry registered successfully",
      lead: parsed.data,
    });
  } catch {
    return NextResponse.json({ message: "Invalid payload" }, { status: 400 });
  }
}
