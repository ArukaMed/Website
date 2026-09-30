import { NextRequest, NextResponse } from "next/server";
import { dataStore } from "@aegis/database";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tenantSlug = searchParams.get("tenant") || process.env.DEFAULT_TENANT_SLUG || "arukamed";
  const format = searchParams.get("format");

  const leads = await dataStore.getAllLeads(tenantSlug);

  if (format === "csv") {
    const headers = [
      "ID",
      "Date",
      "Institution Name",
      "Business Type",
      "Contact Person",
      "Phone",
      "Email",
      "Drug Licence",
      "GSTIN",
      "Requirement / Category",
      "Volume",
      "Source URL",
    ];

    const rows = leads.map((l) => [
      `"${l.id}"`,
      `"${new Date(l.createdAt).toISOString()}"`,
      `"${(l.institutionName || "").replace(/"/g, '""')}"`,
      `"${(l.businessType || "").replace(/"/g, '""')}"`,
      `"${(l.contactName || "").replace(/"/g, '""')}"`,
      `"${(l.phone || "").replace(/"/g, '""')}"`,
      `"${(l.email || "").replace(/"/g, '""')}"`,
      `"${(l.drugLicenceNumber || "").replace(/"/g, '""')}"`,
      `"${(l.gstin || "").replace(/"/g, '""')}"`,
      `"${(l.requirementCategory || "").replace(/"/g, '""')}"`,
      `"${(l.estimatedMonthlyVolume || "").replace(/"/g, '""')}"`,
      `"${(l.sourceUrl || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");

    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${tenantSlug}-wholesale-leads-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  }

  return NextResponse.json({ leads });
}
