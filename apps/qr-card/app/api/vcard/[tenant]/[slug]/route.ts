import { NextRequest, NextResponse } from "next/server";
import { dataStore } from "@aegis/database";

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

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ tenant: string; slug: string }> }
) {
  const { tenant: tenantSlug, slug: employeeSlug } = await params;

  const tenant = await dataStore.getTenantBySlug(tenantSlug);
  const employee = await dataStore.getEmployeeBySlug(tenantSlug, employeeSlug);

  if (!tenant || !employee || !employee.isActive) {
    return new NextResponse("Contact not found or inactive", { status: 404 });
  }

  const addr = tenant.complianceInfo.warehouseAddress;
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
    foldLine(`TEL;TYPE=WORK,VOICE,WHATSAPP:${employee.whatsappNumber}`),
    foldLine(`EMAIL;TYPE=WORK,INTERNET:${employee.email}`),
    foldLine(
      `ADR;TYPE=WORK:;;${escapeVCardValue(addr.line1)};${escapeVCardValue(addr.city)};${escapeVCardValue(
        addr.state
      )};${escapeVCardValue(addr.pincode)};${escapeVCardValue(addr.country)}`
    ),
    foldLine(
      `URL:${tenant.customDomain ? `https://${tenant.customDomain}` : `https://${tenant.slug}.arukamed.com`}`
    ),
  ];

  if (employee.linkedinUrl) {
    lines.push(foldLine(`X-SOCIALPROFILE;TYPE=linkedin:${employee.linkedinUrl}`));
  }

  const licenses = tenant.complianceInfo.drugLicences
    .map((l) => `${l.label}: ${l.number}`)
    .join(" | ");

  const combinedNote = `Territory: ${employee.territoryRegion} | GSTIN: ${tenant.complianceInfo.gstin} | ${licenses}`;
  lines.push(foldLine(`NOTE:${escapeVCardValue(combinedNote)}`));
  lines.push(`REV:${new Date().toISOString()}`);
  lines.push("END:VCARD");

  const vcfString = lines.join("\r\n") + "\r\n";

  // Increment download counter
  await dataStore.incrementStat(tenantSlug, employeeSlug, "vcard");

  return new NextResponse(vcfString, {
    status: 200,
    headers: {
      "Content-Type": "text/vcard; charset=utf-8",
      "Content-Disposition": `attachment; filename="${employee.slug}.vcf"`,
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  });
}
