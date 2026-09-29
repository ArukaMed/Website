import { z } from "zod";

// Indian GSTIN regex validation (15 alphanumeric characters: 2 state digits + 10 PAN chars + 1 entity num + Z + 1 checksum)
export const GSTINRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
export const PhoneRegex = /^\+?[0-9\s-()]{8,20}$/;

export const DrugLicenceItemSchema = z.object({
  label: z.string().min(1, "Licence label required"),
  number: z.string().min(1, "Licence number required"),
  validUntil: z.string().optional(),
});

export const WarehouseAddressSchema = z.object({
  line1: z.string().min(3, "Address line 1 required"),
  line2: z.string().optional(),
  city: z.string().min(2, "City required"),
  state: z.string().min(2, "State required"),
  pincode: z.string().min(3, "Postal/Pincode required"),
  country: z.string().default("India"),
  googleMapsEmbedUrl: z.string().url().optional().or(z.literal("")),
});

export const ColdChainCertificationSchema = z.object({
  certifier: z.string().min(2, "Certifier required"),
  certificateNumber: z.string().min(2, "Certificate number required"),
  rangeMinCelsius: z.number().default(2.0),
  rangeMaxCelsius: z.number().default(8.0),
  failoverProtocol: z.string().default("Automated dual-compressor generator backup with SMS alert"),
});

export const TenantComplianceInfoSchema = z.object({
  legalEntityName: z.string().min(2, "Legal entity name required"),
  gstin: z.string().regex(GSTINRegex, "Invalid Indian GSTIN format").or(z.string().min(5)),
  drugLicences: z.array(DrugLicenceItemSchema).min(1, "At least one wholesale drug licence required"),
  warehouseAddress: WarehouseAddressSchema,
  coldChainCertification: ColdChainCertificationSchema.optional(),
});

export type DrugLicenceItem = z.infer<typeof DrugLicenceItemSchema>;
export type WarehouseAddress = z.infer<typeof WarehouseAddressSchema>;
export type ColdChainCertification = z.infer<typeof ColdChainCertificationSchema>;
export type TenantComplianceInfo = z.infer<typeof TenantComplianceInfoSchema>;
