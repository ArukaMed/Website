import { z } from "zod";
import { TenantThemeConfigSchema } from "./theme";
import { TenantComplianceInfoSchema } from "./compliance";
import { TenantCommercialSettingsSchema } from "./commercial";

export const TenantFeatureFlagsSchema = z.object({
  enableCatalogDownload: z.boolean().default(true),
  enableVCardSave: z.boolean().default(true),
  enableLeadCaptureForm: z.boolean().default(true),
  enablePoUploadEmail: z.boolean().default(true),
  enableCreditApplicationModal: z.boolean().default(true),
  enableLiveColdRoomTrace: z.boolean().default(true),
});

export const TenantStatusEnum = z.enum(["ACTIVE", "SUSPENDED", "PENDING_ONBOARDING"]);

export const TenantWebsiteContentSchema = z.object({
  heroHeadline: z.string().default("Reliable Wholesale Pharmaceutical Supply for Pharmacies, Hospitals & Institutions"),
  heroSubheadline: z.string().default("Licensed B2B distributor supplying genuine branded & generic medicines, critical care injectables, and cold-chain biologics with guaranteed 24-48 hour regional dispatch."),
  statActiveSkus: z.string().default("5,000+"),
  statBatchTraceability: z.string().default("99.8%"),
  statColdChainSla: z.string().default("2°C - 8°C"),
  statDispatchTime: z.string().default("24-48 Hr"),
  whyPrincipalSourcing: z.string().default("100% genuine inventory received directly from authorized pharmaceutical manufacturers, preventing spurious supplies and counterfeit lots."),
  whyColdStorage: z.string().default("Dedicated 2°C to 8°C cold rooms with automated multi-generator failovers for biologics, insulins, and critical vaccines."),
  whyTradeCredit: z.string().default("Automated GST-compliant invoicing, batch expiry tracking, and flexible 15-to-30 day trade credit for verified hospitals and clinics."),
});

export const TenantSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(2),
  slug: z.string().regex(/^[a-z0-9-]+$/, "Slug must only contain lowercase alphanumeric characters and hyphens"),
  customDomain: z.string().nullable().optional(),
  logoUrlLight: z.string().min(1),
  logoUrlDark: z.string().nullable().optional(),
  markUrl: z.string().nullable().optional(),
  faviconUrl: z.string().nullable().optional(),
  status: TenantStatusEnum.default("ACTIVE"),
  themeConfig: TenantThemeConfigSchema,
  complianceInfo: TenantComplianceInfoSchema,
  commercialSettings: TenantCommercialSettingsSchema,
  featureFlags: TenantFeatureFlagsSchema,
  websiteContent: TenantWebsiteContentSchema.optional(),
  createdAt: z.string().or(z.date()).optional(),
  updatedAt: z.string().or(z.date()).optional(),
});

export type TenantWebsiteContent = z.infer<typeof TenantWebsiteContentSchema>;
export type TenantFeatureFlags = z.infer<typeof TenantFeatureFlagsSchema>;
export type TenantStatus = z.infer<typeof TenantStatusEnum>;
export type Tenant = z.infer<typeof TenantSchema>;
