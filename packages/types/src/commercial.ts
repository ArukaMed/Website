import { z } from "zod";

export const TenantCommercialSettingsSchema = z.object({
  catalogPdfUrl: z.string().url().or(z.literal("")),
  catalogSizeLabel: z.string().default("2.4 MB"),
  catalogUpdatedDate: z.string().default("October 2026"),
  orderDeskEmail: z.string().email(),
  creditDeskEmail: z.string().email(),
  centralHelplinePhone: z.string().min(5),
  minimumOrderValueINR: z.number().nonnegative().default(10000),
  creditTermsSummary: z.string().default("30-day net terms available upon Form 20B/21B verification"),
  defaultWhatsappTemplate: z
    .string()
    .default("Hello {name}, I scanned your {company} card. I would like to inquire about wholesale medicine procurement."),
});

export type TenantCommercialSettings = z.infer<typeof TenantCommercialSettingsSchema>;
