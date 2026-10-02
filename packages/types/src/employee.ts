import { z } from "zod";
import { PhoneRegex } from "./compliance";

export const AddressSchema = z.object({
  sameAsCurrent: z.boolean().optional(),
  line1: z.string().default(""),
  line2: z.string().optional().nullable(),
  city: z.string().default(""),
  state: z.string().default(""),
  pincode: z.string().default(""),
  country: z.string().default("India"),
  proofDocumentUrl: z.string().optional().nullable(),
  proofDocumentName: z.string().optional().nullable(),
  verified: z.boolean().default(false),
});
export type Address = z.infer<typeof AddressSchema>;

export const EmergencyContactSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Contact name required"),
  relationship: z.string().min(1, "Relationship required"),
  primaryPhone: z.string().min(7, "Primary phone required"),
  secondaryPhone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  isPrimary: z.boolean().default(false),
});
export type EmergencyContact = z.infer<typeof EmergencyContactSchema>;

export const DirectManagerSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  designation: z.string().optional(),
  email: z.string().optional(),
  employeeCode: z.string().optional(),
});
export type DirectManager = z.infer<typeof DirectManagerSchema>;

export const BankAccountSchema = z.object({
  bankName: z.string().default(""),
  accountHolderName: z.string().default(""),
  accountNumber: z.string().default(""),
  routingCode: z.string().default(""), // IFSC / SWIFT
  accountType: z.enum(["Savings", "Salary", "Current"]).default("Salary"),
  cancelledChequeUrl: z.string().optional().nullable(),
  verificationStatus: z.enum(["Penny-Drop Verified", "Pending HR Review", "Unverified", "Rejected"]).default("Pending HR Review"),
  verifiedAt: z.string().optional().nullable(),
});
export type BankAccount = z.infer<typeof BankAccountSchema>;

export const SalaryStructureSchema = z.object({
  baseAnnualINR: z.number().default(0),
  monthlyGrossINR: z.number().default(0),
  variableAnnualINR: z.number().default(0),
  currency: z.string().default("INR"),
  effectiveDate: z.string().optional().nullable(),
});
export type SalaryStructure = z.infer<typeof SalaryStructureSchema>;

export const EducationRecordSchema = z.object({
  id: z.string(),
  institution: z.string().min(1, "Institution required"),
  degree: z.string().min(1, "Degree required"),
  fieldOfStudy: z.string().default(""),
  graduationYear: z.string().default(""),
  certificateUrl: z.string().optional().nullable(),
});
export type EducationRecord = z.infer<typeof EducationRecordSchema>;

export const PriorEmploymentSchema = z.object({
  id: z.string(),
  company: z.string().min(1, "Company required"),
  designation: z.string().min(1, "Designation required"),
  startDate: z.string().default(""),
  endDate: z.string().default(""),
  relievingLetterUrl: z.string().optional().nullable(),
  experienceLetterUrl: z.string().optional().nullable(),
});
export type PriorEmployment = z.infer<typeof PriorEmploymentSchema>;

export const DependentSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Dependent name required"),
  relationship: z.string().min(1, "Relationship required"),
  dateOfBirth: z.string().optional().nullable(),
  nomineeAllocationPercent: z.number().min(0).max(100).default(50),
  benefitType: z.string().default("Group Medical Cover & Gratuity"),
});
export type Dependent = z.infer<typeof DependentSchema>;

export const AssetRecordSchema = z.object({
  id: z.string(),
  assetName: z.string().min(1, "Asset name required"),
  category: z.enum(["Laptop", "Monitor", "Security Badge", "Mobile Device", "Access Key", "Vehicle", "Other"]).default("Laptop"),
  serialNumber: z.string().min(1, "Serial number required"),
  assignedDate: z.string().default(""),
  status: z.enum(["Assigned & Active", "In Maintenance", "Returned"]).default("Assigned & Active"),
});
export type AssetRecord = z.infer<typeof AssetRecordSchema>;

export const EmployeeDocumentSchema = z.object({
  id: z.string(),
  title: z.string().min(1, "Document title required"),
  category: z.enum([
    "Identity Proof",
    "Address Proof",
    "Statutory Tax",
    "Banking Document",
    "Education Certificate",
    "Prior Employment",
    "Employment Contract",
    "Other"
  ]).default("Other"),
  fileName: z.string(),
  fileUrl: z.string(),
  fileSize: z.string().optional(),
  uploadedAt: z.string(),
  status: z.enum(["Verified", "Pending Review", "Rejected"]).default("Pending Review"),
});
export type EmployeeDocument = z.infer<typeof EmployeeDocumentSchema>;

export const RevisionHistoryEntrySchema = z.object({
  id: z.string(),
  timestamp: z.string(),
  editorName: z.string(),
  editorRole: z.string(),
  category: z.string(),
  field: z.string(),
  oldValue: z.string(),
  newValue: z.string(),
  requiresApproval: z.boolean().default(false),
  status: z.enum(["Approved", "Pending HR Review", "Rejected", "Effective Next Payroll"]).default("Approved"),
});
export type RevisionHistoryEntry = z.infer<typeof RevisionHistoryEntrySchema>;

// Full Multi-purpose Employee Schema for Internal HR, Payroll, Compliance & Operations
export const EmployeeSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  slug: z.string().regex(/^[a-z0-9-]+$/, "Slug must only contain lowercase alphanumeric characters and hyphens"),
  
  // 1. Primary Identity
  employeeCode: z.string().default("EMP-10001"),
  firstName: z.string().min(1, "First name required"),
  lastName: z.string().min(1, "Last name required"),
  preferredName: z.string().nullable().optional(),
  pronouns: z.string().nullable().optional(),
  dateOfBirth: z.string().nullable().optional(),
  gender: z.string().nullable().optional(),
  maritalStatus: z.string().nullable().optional(),
  nationality: z.string().default("Indian"),
  avatarUrl: z.string().nullable().optional(),
  bio: z.string().nullable().optional(),
  skills: z.array(z.string()).default([]),
  languages: z.array(z.string()).default(["English", "Hindi"]),

  // 2. Contact & Addresses
  phoneNumber: z.string().regex(PhoneRegex, "Invalid phone number"),
  whatsappNumber: z.string().regex(PhoneRegex, "Invalid WhatsApp number"),
  email: z.string().email(),
  personalEmail: z.string().email().nullable().optional().or(z.literal("")),
  personalPhone: z.string().nullable().optional().or(z.literal("")),
  alternatePhone: z.string().nullable().optional().or(z.literal("")),
  officeExtension: z.string().nullable().optional(),
  currentAddress: AddressSchema.nullable().optional(),
  permanentAddress: AddressSchema.nullable().optional(),

  // 3. Emergency Contacts (min 2 recommended)
  emergencyContacts: z.array(EmergencyContactSchema).default([]),

  // 4. Job & Org
  designation: z.string().min(1, "Designation required"),
  department: z.string().default("Wholesale Operations"),
  division: z.string().nullable().optional(),
  territoryRegion: z.string().min(1, "Territory required"),
  directManager: DirectManagerSchema.nullable().optional(),
  employmentType: z.enum(["Full-time (Perm)", "Full-time (Contract)", "Part-time", "Intern"]).default("Full-time (Perm)"),
  employmentStatus: z.enum(["Active", "Probation", "Notice Period", "On Leave", "Deactivated"]).default("Active"),
  joiningDate: z.string().default("2023-01-15"),
  confirmationDate: z.string().nullable().optional(),
  workLocation: z.string().default("Kanpur Central Hub, India"),
  shiftSchedule: z.string().default("Standard Shift (09:30 AM - 06:30 PM IST)"),
  timezone: z.string().default("Asia/Kolkata"),
  workFromHomePolicy: z.string().default("On-Site Hub (5 Days/Week)"),
  noticePeriodDays: z.number().default(60),
  bandGrade: z.string().default("L3 - Specialist"),
  costCenter: z.string().default("CC-OPS-NORTH"),

  // 5. Statutory & Tax
  panNumber: z.string().nullable().optional(),
  aadhaarNumber: z.string().nullable().optional(),
  providentFundUan: z.string().nullable().optional(),
  esicNumber: z.string().nullable().optional(),
  taxRegime: z.enum(["New Tax Regime (115BAC)", "Old Tax Regime"]).default("New Tax Regime (115BAC)"),
  statutoryStatus: z.enum(["Verified", "Pending HR Review", "Action Required"]).default("Pending HR Review"),

  // 6. Financial & Banking
  bankAccount: BankAccountSchema.nullable().optional(),
  salaryStructure: SalaryStructureSchema.nullable().optional(),
  payrollFreezeNotice: z.string().nullable().optional(),

  // 7. Education & Prior Employment
  education: z.array(EducationRecordSchema).default([]),
  priorEmployment: z.array(PriorEmploymentSchema).default([]),

  // 8. Dependents & Beneficiaries
  dependents: z.array(DependentSchema).default([]),

  // 9. Hardware & IT Assets
  assignedAssets: z.array(AssetRecordSchema).default([]),

  // 10. Documents Repository
  documents: z.array(EmployeeDocumentSchema).default([]),

  // 11. Audit Footprint & Revision History
  revisionHistory: z.array(RevisionHistoryEntrySchema).default([]),

  // 12. QR-Card Public Profile Specific Overrides & Counters
  linkedinUrl: z.string().url().nullable().optional().or(z.literal("")),
  customWhatsappTemplate: z.string().nullable().optional(),
  customRateCardUrl: z.string().url().nullable().optional().or(z.literal("")),
  isActive: z.boolean().default(true),
  scanCount: z.number().int().default(0),
  vcardDownloads: z.number().int().default(0),
  whatsappClicks: z.number().int().default(0),

  createdAt: z.string().or(z.date()).optional(),
  updatedAt: z.string().or(z.date()).optional(),
});

// Secure Scoped Public Profile (Only non-sensitive data for QR visiting card and vCard)
export const PublicEmployeeProfileSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  slug: z.string(),
  employeeCode: z.string().optional(),
  firstName: z.string(),
  lastName: z.string(),
  preferredName: z.string().nullable().optional(),
  avatarUrl: z.string().nullable().optional(),
  designation: z.string(),
  division: z.string().nullable().optional(),
  territoryRegion: z.string(),
  phoneNumber: z.string(),
  whatsappNumber: z.string(),
  email: z.string(),
  linkedinUrl: z.string().nullable().optional(),
  officeExtension: z.string().nullable().optional(),
  customWhatsappTemplate: z.string().nullable().optional(),
  customRateCardUrl: z.string().nullable().optional(),
  isActive: z.boolean(),
  scanCount: z.number().int(),
  vcardDownloads: z.number().int(),
  whatsappClicks: z.number().int(),
  createdAt: z.string().or(z.date()).optional(),
  updatedAt: z.string().or(z.date()).optional(),
});

export type Employee = z.infer<typeof EmployeeSchema>;
export type PublicEmployeeProfile = z.infer<typeof PublicEmployeeProfileSchema>;

export const CreateEmployeeInputSchema = EmployeeSchema.omit({
  id: true,
  scanCount: true,
  vcardDownloads: true,
  whatsappClicks: true,
  createdAt: true,
  updatedAt: true,
});
export type CreateEmployeeInput = z.infer<typeof CreateEmployeeInputSchema>;

// Helper to sanitize an employee record down to strictly its public profile
export function sanitizePublicEmployee(emp: Employee): PublicEmployeeProfile {
  return {
    id: emp.id,
    tenantId: emp.tenantId,
    slug: emp.slug,
    employeeCode: emp.employeeCode,
    firstName: emp.firstName,
    lastName: emp.lastName,
    preferredName: emp.preferredName,
    avatarUrl: emp.avatarUrl,
    designation: emp.designation,
    division: emp.division,
    territoryRegion: emp.territoryRegion,
    phoneNumber: emp.phoneNumber,
    whatsappNumber: emp.whatsappNumber,
    email: emp.email,
    linkedinUrl: emp.linkedinUrl,
    officeExtension: emp.officeExtension,
    customWhatsappTemplate: emp.customWhatsappTemplate,
    customRateCardUrl: emp.customRateCardUrl,
    isActive: emp.isActive,
    scanCount: emp.scanCount,
    vcardDownloads: emp.vcardDownloads,
    whatsappClicks: emp.whatsappClicks,
    createdAt: emp.createdAt,
    updatedAt: emp.updatedAt,
  };
}
