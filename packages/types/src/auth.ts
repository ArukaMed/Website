import { z } from "zod";

export const UserRole = {
  FOUNDER: "FOUNDER",
  SUPER_ADMIN: "SUPER_ADMIN",
  BRAND_ADMIN: "BRAND_ADMIN",
  OPS_MANAGER: "OPS_MANAGER",
  SALES_REP: "SALES_REP",
  // ISO/IEC 27001 Formal Roles
  R_EMP: "R_EMP", // Standard Employee (Individual Contributor - Self Scope)
  R_MGR: "R_MGR", // Line Manager / Team Lead (Direct Reports Scope)
  R_SRM: "R_SRM", // Senior Management / C-Suite / VP (Department / BU Aggregate)
  R_HRO: "R_HRO", // HR Operations Analyst (Legal Entity - Maker)
  R_PAY: "R_PAY", // Payroll Administrator (Legal Entity - Checker)
  R_HRP: "R_HRP", // HR Business Partner (Assigned Business Unit)
  R_SYS: "R_SYS", // System / Identity Administrator (System Level, Zero-knowledge)
  R_AUD: "R_AUD", // Compliance & ISO Auditor (Global Read-Only System Metadata & Logs)
} as const;

export type UserRoleType = (typeof UserRole)[keyof typeof UserRole];

export const UserRoleSchema = z.enum([
  "FOUNDER",
  "SUPER_ADMIN",
  "BRAND_ADMIN",
  "OPS_MANAGER",
  "SALES_REP",
  "R_EMP",
  "R_MGR",
  "R_SRM",
  "R_HRO",
  "R_PAY",
  "R_HRP",
  "R_SYS",
  "R_AUD",
]);

export interface ISORoleDefinition {
  code: UserRoleType;
  title: string;
  hierarchyType: string;
  defaultScope: "Self" | "DirectReports" | "DepartmentAggregate" | "LegalEntity" | "BusinessUnit" | "SystemLevel" | "GlobalReadOnly" | "FullExecutive";
  sodConstraints: string;
  canEditHR: boolean;
  canDisbursePayroll: boolean;
  canViewMaskedStatutory: boolean;
  canAccessAuditLogs: boolean;
}

export const ISO_ROLE_DEFINITIONS: Record<string, ISORoleDefinition> = {
  FOUNDER: {
    code: UserRole.FOUNDER,
    title: "Founder / Executive Director",
    hierarchyType: "Executive",
    defaultScope: "FullExecutive",
    sodConstraints: "High-privilege executive override; all mutations tracked in tamper-proof audit trail",
    canEditHR: true,
    canDisbursePayroll: true,
    canViewMaskedStatutory: true,
    canAccessAuditLogs: true,
  },
  SUPER_ADMIN: {
    code: UserRole.SUPER_ADMIN,
    title: "System & Security Administrator",
    hierarchyType: "Technical Administrator",
    defaultScope: "SystemLevel",
    sodConstraints: "Zero-knowledge over cleartext salaries/PII; administers tenancy, keys & users",
    canEditHR: true,
    canDisbursePayroll: false,
    canViewMaskedStatutory: false,
    canAccessAuditLogs: true,
  },
  BRAND_ADMIN: {
    code: UserRole.BRAND_ADMIN,
    title: "Brand & Commercial Administrator",
    hierarchyType: "Operational Administrator",
    defaultScope: "LegalEntity",
    sodConstraints: "Administers corporate profile, team records, catalog, and website CMS",
    canEditHR: true,
    canDisbursePayroll: false,
    canViewMaskedStatutory: true,
    canAccessAuditLogs: true,
  },
  R_EMP: {
    code: UserRole.R_EMP,
    title: "Standard Employee (R-EMP)",
    hierarchyType: "Individual Contributor",
    defaultScope: "Self",
    sodConstraints: "Cannot hold administrative or HR roles simultaneously; self-service only",
    canEditHR: false,
    canDisbursePayroll: false,
    canViewMaskedStatutory: false,
    canAccessAuditLogs: false,
  },
  R_MGR: {
    code: UserRole.R_MGR,
    title: "Line Manager / Team Lead (R-MGR)",
    hierarchyType: "People Manager",
    defaultScope: "DirectReports",
    sodConstraints: "Cannot approve own compensation or promotion; line scope over direct reports only",
    canEditHR: false,
    canDisbursePayroll: false,
    canViewMaskedStatutory: false,
    canAccessAuditLogs: false,
  },
  R_SRM: {
    code: UserRole.R_SRM,
    title: "Senior Management / VP (R-SRM)",
    hierarchyType: "Executive Management",
    defaultScope: "DepartmentAggregate",
    sodConstraints: "Cannot view granular statutory/banking records; aggregated budget/headcount only",
    canEditHR: false,
    canDisbursePayroll: false,
    canViewMaskedStatutory: false,
    canAccessAuditLogs: false,
  },
  R_HRO: {
    code: UserRole.R_HRO,
    title: "HR Operations Analyst (R-HRO)",
    hierarchyType: "Operational Specialist (Maker)",
    defaultScope: "LegalEntity",
    sodConstraints: "Cannot disburse payroll or perform bank authorizations (Segregation of Duties)",
    canEditHR: true,
    canDisbursePayroll: false,
    canViewMaskedStatutory: true,
    canAccessAuditLogs: false,
  },
  R_PAY: {
    code: UserRole.R_PAY,
    title: "Payroll Administrator (R-PAY)",
    hierarchyType: "Finance / Compensation (Checker)",
    defaultScope: "LegalEntity",
    sodConstraints: "Cannot modify employee bank details directly; verifies & disburses payroll",
    canEditHR: false,
    canDisbursePayroll: true,
    canViewMaskedStatutory: true,
    canAccessAuditLogs: false,
  },
  R_HRP: {
    code: UserRole.R_HRP,
    title: "HR Business Partner (R-HRP)",
    hierarchyType: "Strategic HR",
    defaultScope: "BusinessUnit",
    sodConstraints: "Assigned business unit scope; cannot view or execute bulk payroll disbursements",
    canEditHR: true,
    canDisbursePayroll: false,
    canViewMaskedStatutory: false,
    canAccessAuditLogs: false,
  },
  R_SYS: {
    code: UserRole.R_SYS,
    title: "System / Identity Administrator (R-SYS)",
    hierarchyType: "Technical Administrator",
    defaultScope: "SystemLevel",
    sodConstraints: "Excluded from viewing salaries, appraisals, or medical records (Zero-Knowledge)",
    canEditHR: false,
    canDisbursePayroll: false,
    canViewMaskedStatutory: false,
    canAccessAuditLogs: true,
  },
  R_AUD: {
    code: UserRole.R_AUD,
    title: "Compliance & ISO Auditor (R-AUD)",
    hierarchyType: "Internal / External Audit",
    defaultScope: "GlobalReadOnly",
    sodConstraints: "Strictly zero write/execute permissions; global read-only access to logs and metadata",
    canEditHR: false,
    canDisbursePayroll: false,
    canViewMaskedStatutory: false,
    canAccessAuditLogs: true,
  },
  OPS_MANAGER: {
    code: UserRole.OPS_MANAGER,
    title: "Operations Manager",
    hierarchyType: "Operations Lead",
    defaultScope: "LegalEntity",
    sodConstraints: "Manages orders, dispatch queue, cold-chain temperature SLA",
    canEditHR: false,
    canDisbursePayroll: false,
    canViewMaskedStatutory: false,
    canAccessAuditLogs: false,
  },
  SALES_REP: {
    code: UserRole.SALES_REP,
    title: "Sales Representative",
    hierarchyType: "Field Representative",
    defaultScope: "Self",
    sodConstraints: "Personal visiting card and inquiries only",
    canEditHR: false,
    canDisbursePayroll: false,
    canViewMaskedStatutory: false,
    canAccessAuditLogs: false,
  },
};

export interface UserSession {
  userId: string;
  email: string;
  fullName: string;
  tenantId?: string;
  tenantSlug?: string;
  role: UserRoleType;
}
