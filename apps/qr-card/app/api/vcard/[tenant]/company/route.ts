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
    legalEntityName: "Aruka Med Pharmaceuticals Private Limited",
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
  commercialSettings: {
    centralHelplinePhone: "+915120000000",
    orderDeskEmail: "orders@arukamed.com",
  },
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ tenant: string }> }
) {
  const { tenant: tenantSlug } = await params;
  const dbTenant = await dataStore.getTenantBySlug(tenantSlug || "arukamed");
  const tenant = dbTenant || defaultFallbackTenant;

  const legalName = tenant.complianceInfo?.legalEntityName || tenant.name || "Aruka Med Pharmaceuticals Private Limited";
  const addr = tenant.complianceInfo?.warehouseAddress || defaultFallbackTenant.complianceInfo.warehouseAddress;
  const phone = tenant.commercialSettings?.centralHelplinePhone || "+915120000000";
  const email = tenant.commercialSettings?.orderDeskEmail || "orders@arukamed.com";
  const website = tenant.customDomain ? `https://${tenant.customDomain}` : `https://${tenant.slug}.com`;

  const licenses = (tenant.complianceInfo?.drugLicences || [])
    .map((l: any) => `${l.label}: ${l.number}`)
    .join(" | ");

  const combinedNote = `Corporate Headquarters & Distribution Hub | GSTIN: ${tenant.complianceInfo?.gstin || ""} | ${licenses} | Cold Chain Monitored (2°C - 8°C)`;

  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    foldLine(`N:;${escapeVCardValue(legalName)};;;`),
    foldLine(`FN:${escapeVCardValue(legalName)}`),
    foldLine(`ORG:${escapeVCardValue(legalName)}`),
    foldLine("TITLE:Licensed Wholesale Medicine Distributor & Cold Chain Pharma Logistics"),
    foldLine(`TEL;TYPE=WORK,VOICE:${phone}`),
    foldLine(`TEL;TYPE=WORK,VOICE,WHATSAPP:${phone}`),
    foldLine(`EMAIL;TYPE=WORK,INTERNET:${email}`),
    foldLine(
      `ADR;TYPE=WORK:;;${escapeVCardValue(addr.line1)};${escapeVCardValue(addr.city)};${escapeVCardValue(
        addr.state
      )};${escapeVCardValue(addr.pincode)};${escapeVCardValue(addr.country)}`
    ),
    foldLine(`URL:${website}`),
    foldLine(`NOTE:${escapeVCardValue(combinedNote)}`),
    linesRev(),
    "END:VCARD",
  ];

  function linesRev() {
    return `REV:${new Date().toISOString()}`;
  }

  const vcfString = lines.join("\r\n") + "\r\n";

  return new Response(vcfString, {
    status: 200,
    headers: {
      "Content-Type": "text/vcard; charset=utf-8",
      "Content-Disposition": `attachment; filename="${tenant.slug || "arukamed"}-corporate.vcf"`,
      "Cache-Control": "no-cache",
    },
  });
}
