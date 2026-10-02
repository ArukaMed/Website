import { NextRequest, NextResponse } from "next/server";
import { dataStore } from "@aegis/database";

export const dynamic = "force-dynamic";

function foldLine(line: string): string {
  const maxLength = 75;
  if (line.length <= maxLength) return line;

  const chunks: string[] = [];
  chunks.push(line.slice(0, maxLength));
  let remaining = line.slice(maxLength);

  while (remaining.length > 0) {
    chunks.push(" " + remaining.slice(0, maxLength - 1));
    remaining = remaining.slice(maxLength - 1);
  }
  return chunks.join("\r\n");
}

function escapeVCardValue(val: string): string {
  return String(val || "")
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

const defaultFallbackTenant = {
  name: "Aruka Med",
  slug: "arukamed",
  customDomain: "arukamed.com",
  complianceInfo: {
    gstin: "09ABCDE1234F1Z5",
    drugLicences: [
      { label: "Wholesale Drug Licence Form 20B", number: "UP-KNP-20B-000000" },
      { label: "Wholesale Drug Licence Form 21B", number: "UP-KNP-21B-000000" },
    ],
    warehouseAddress: {
      line1: "Plot 24, Industrial Area, Sector 7",
      city: "Kanpur",
      state: "Uttar Pradesh",
      pincode: "208001",
      country: "India",
    },
  },
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ tenant: string; slug: string }> }
) {
  const { tenant: tenantSlug, slug: employeeSlug } = await params;

  // Retrieve actual employee and tenant from dataStore
  const dbTenant = await dataStore.getTenantBySlug(tenantSlug || "arukamed");
  const dbEmployee = await dataStore.getPublicEmployeeProfile(tenantSlug || "arukamed", employeeSlug);

  const tenant = dbTenant || defaultFallbackTenant;
  const employee = dbEmployee;

  if (!employee) {
    return NextResponse.json({ message: "Employee contact not found" }, { status: 404 });
  }

  const addr = tenant.complianceInfo?.warehouseAddress || defaultFallbackTenant.complianceInfo.warehouseAddress;
  const fullName = `${employee.firstName} ${employee.lastName}`.trim();

  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    foldLine(`N:${escapeVCardValue(employee.lastName)};${escapeVCardValue(employee.firstName)};;;`),
    foldLine(`FN:${escapeVCardValue(fullName)}`),
    foldLine(
      `ORG:${escapeVCardValue(tenant.name)}${employee.division ? ";" + escapeVCardValue(employee.division) : ""}`
    ),
    foldLine(`TITLE:${escapeVCardValue(employee.designation)}`),
    foldLine(`TEL;TYPE=CELL,VOICE:${employee.phoneNumber}`),
    foldLine(`TEL;TYPE=WORK,VOICE,WHATSAPP:${employee.whatsappNumber || employee.phoneNumber}`),
    foldLine(`EMAIL;TYPE=WORK,INTERNET:${employee.email}`),
    foldLine(
      `ADR;TYPE=WORK:;;${escapeVCardValue(addr.line1)};${escapeVCardValue(addr.city)};${escapeVCardValue(
        addr.state
      )};${escapeVCardValue(addr.pincode)};${escapeVCardValue(addr.country)}`
    ),
    foldLine(
      `URL:${tenant.customDomain ? `https://${tenant.customDomain}` : `https://${tenant.slug}.com`}`
    ),
  ];

  if (employee.linkedinUrl) {
    lines.push(foldLine(`X-SOCIALPROFILE;TYPE=linkedin:${employee.linkedinUrl}`));
  }

  const licenses = (tenant.complianceInfo?.drugLicences || [])
    .map((l: any) => `${l.label}: ${l.number}`)
    .join(" | ");

  const combinedNote = `Territory: ${employee.territoryRegion} | GSTIN: ${tenant.complianceInfo?.gstin || ""} | ${licenses}`;
  lines.push(foldLine(`NOTE:${escapeVCardValue(combinedNote)}`));
  lines.push(`REV:${new Date().toISOString()}`);
  lines.push("END:VCARD");

  const vcfString = lines.join("\r\n") + "\r\n";

  return new Response(vcfString, {
    status: 200,
    headers: {
      "Content-Type": "text/vcard; charset=utf-8",
      "Content-Disposition": `attachment; filename="${employee.slug || "contact"}.vcf"`,
      "Cache-Control": "no-cache",
    },
  });
}
