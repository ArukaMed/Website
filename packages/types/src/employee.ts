import { z } from "zod";
import { PhoneRegex } from "./compliance";

export const EmployeeSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  slug: z.string().regex(/^[a-z0-9-]+$/, "Slug must only contain lowercase alphanumeric characters and hyphens"),
  firstName: z.string().min(1, "First name required"),
  lastName: z.string().min(1, "Last name required"),
  avatarUrl: z.string().nullable().optional(),
  designation: z.string().min(1, "Designation required"),
  division: z.string().nullable().optional(),
  territoryRegion: z.string().min(1, "Territory required"),
  phoneNumber: z.string().regex(PhoneRegex, "Invalid phone number"),
  whatsappNumber: z.string().regex(PhoneRegex, "Invalid WhatsApp number"),
  email: z.string().email(),
  linkedinUrl: z.string().url().nullable().optional().or(z.literal("")),
  officeExtension: z.string().nullable().optional(),
  customWhatsappTemplate: z.string().nullable().optional(),
  customRateCardUrl: z.string().url().nullable().optional().or(z.literal("")),
  isActive: z.boolean().default(true),
  scanCount: z.number().int().default(0),
  vcardDownloads: z.number().int().default(0),
  whatsappClicks: z.number().int().default(0),
  createdAt: z.string().or(z.date()).optional(),
  updatedAt: z.string().or(z.date()).optional(),
});

export const CreateEmployeeInputSchema = EmployeeSchema.omit({
  id: true,
  scanCount: true,
  vcardDownloads: true,
  whatsappClicks: true,
  createdAt: true,
  updatedAt: true,
});

export type Employee = z.infer<typeof EmployeeSchema>;
export type CreateEmployeeInput = z.infer<typeof CreateEmployeeInputSchema>;
