export interface LeadNotificationPayload {
  toEmail: string;
  tenantName: string;
  sourceType: "WEBSITE_INQUIRY" | "VISITING_CARD_CREDIT";
  institutionName: string;
  businessType: string;
  contactName: string;
  phone: string;
  email?: string | null;
  drugLicence?: string | null;
  categoryOrVolume?: string | null;
  sourceUrl: string;
  employeeName?: string | null;
}

/**
 * Dispatch real-time lead alert via Resend REST API.
 * Uses native fetch with zero external npm dependencies.
 */
export async function sendLeadAlertEmail(payload: LeadNotificationPayload): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return false;
  }

  const subject =
    payload.sourceType === "VISITING_CARD_CREDIT"
      ? `🚨 [Credit Request] ${payload.institutionName} via ${payload.employeeName || "Digital Card"}`
      : `📦 [Wholesale RFQ] New Lead from ${payload.institutionName}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #16253F; border: 1px solid #E2E8F0; border-radius: 12px; overflow: hidden;">
      <div style="background-color: #0E2444; color: #ffffff; padding: 20px 24px;">
        <h2 style="margin: 0; font-size: 20px; font-weight: 700; color: #E3B15F;">${payload.tenantName} Trade Desk</h2>
        <p style="margin: 4px 0 0; font-size: 13px; color: #CBD5E1;">New Wholesale Commercial Inquiry Received</p>
      </div>

      <div style="padding: 24px;">
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr>
            <td style="padding: 8px 0; color: #64748B; width: 140px;">Institution / Firm:</td>
            <td style="padding: 8px 0; font-weight: bold; color: #0F172A;">${payload.institutionName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748B;">Business Type:</td>
            <td style="padding: 8px 0; font-weight: 600;">${payload.businessType}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748B;">Contact Person:</td>
            <td style="padding: 8px 0;">${payload.contactName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748B;">Phone:</td>
            <td style="padding: 8px 0; font-family: monospace; font-size: 15px; font-weight: bold; color: #0284C7;">
              <a href="tel:${payload.phone}" style="color: #0284C7; text-decoration: none;">${payload.phone}</a>
            </td>
          </tr>
          ${
            payload.email
              ? `<tr><td style="padding: 8px 0; color: #64748B;">Email:</td><td style="padding: 8px 0;"><a href="mailto:${payload.email}">${payload.email}</a></td></tr>`
              : ""
          }
          ${
            payload.drugLicence
              ? `<tr><td style="padding: 8px 0; color: #64748B;">Drug Licence:</td><td style="padding: 8px 0; font-family: monospace;">${payload.drugLicence}</td></tr>`
              : ""
          }
          ${
            payload.categoryOrVolume
              ? `<tr><td style="padding: 8px 0; color: #64748B;">Requirement / Note:</td><td style="padding: 8px 0;">${payload.categoryOrVolume}</td></tr>`
              : ""
          }
          ${
            payload.employeeName
              ? `<tr><td style="padding: 8px 0; color: #64748B;">Sales Rep Attribution:</td><td style="padding: 8px 0; font-weight: 600; color: #1B3F75;">${payload.employeeName}</td></tr>`
              : ""
          }
          <tr>
            <td style="padding: 8px 0; color: #64748B;">Source URL:</td>
            <td style="padding: 8px 0; font-size: 12px; color: #64748B;">${payload.sourceUrl}</td>
          </tr>
        </table>
      </div>

      <div style="background-color: #F8FAFC; padding: 14px 24px; border-top: 1px solid #E2E8F0; font-size: 12px; color: #94A3B8; text-align: center;">
        Sent automatically by ${payload.tenantName} B2B Wholesale Portal & Digital Visiting Card Engine
      </div>
    </div>
  `;

  try {
    const fromAddress = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `${payload.tenantName} Alerts <${fromAddress}>`,
        to: [payload.toEmail],
        subject,
        html,
      }),
    });

    return res.ok;
  } catch {
    return false;
  }
}
