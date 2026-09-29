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
  createdAt: z.string().or(z.date()).optional(),
  updatedAt: z.string().or(z.date()).optional(),
});

export type TenantFeatureFlags = z.infer<typeof TenantFeatureFlagsSchema>;
export type TenantStatus = z.infer<typeof TenantStatusEnum>;
export type Tenant = z.infer<typeof TenantSchema>;
