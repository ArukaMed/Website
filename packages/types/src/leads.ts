import { z } from "zod";
import { GSTINRegex, PhoneRegex } from "./compliance";

export const LeadInquiryInputSchema = z.object({
  tenantId: z.string().uuid().optional(),
  tenantSlug: z.string().optional(),
  employeeId: z.string().uuid().nullable().optional(),
  employeeSlug: z.string().nullable().optional(),
  institutionName: z.string().min(2, "Institution or business name required").max(200),
  businessType: z.string().min(2, "Business type required"),
  contactName: z.string().min(2, "Contact person name required").max(100),
  phone: z.string().regex(PhoneRegex, "Enter valid mobile or WhatsApp number"),
  email: z.string().email().optional().or(z.literal("")),
  drugLicenceNumber: z.string().max(100).optional().or(z.literal("")),
  gstin: z.string().regex(GSTINRegex, "Invalid GSTIN").optional().or(z.literal("")),
  requirementCategory: z.string().max(150).optional().or(z.literal("")),
  estimatedMonthlyVolume: z.string().max(100).optional().or(z.literal("")),
  sourceUrl: z.string().url().or(z.string().min(1)),
  // Security honeypot field - must be empty in legitimate submissions
  website_hp: z.string().max(0, "Bot detected").optional().or(z.literal("")),
});

export type LeadInquiryInput = z.infer<typeof LeadInquiryInputSchema>;

export interface LeadRecord extends Omit<LeadInquiryInput, "website_hp"> {
  id: string;
  createdAt: string;
  userAgent?: string;
  ipAddress?: string;
}
