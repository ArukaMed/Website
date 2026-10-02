import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  integer,
  timestamp,
  jsonb,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import type {
  Address,
  EmergencyContact,
  DirectManager,
  BankAccount,
  SalaryStructure,
  EducationRecord,
  PriorEmployment,
  Dependent,
  AssetRecord,
  EmployeeDocument,
  RevisionHistoryEntry,
} from "@aegis/types";
import { tenants } from "./tenants";
import { leadInquiries } from "./leads";

export const employees = pgTable(
  "employees",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .references(() => tenants.id, { onDelete: "cascade" })
      .notNull(),
    slug: varchar("slug", { length: 120 }).notNull(),

    // 1. Primary Identity
    employeeCode: varchar("employee_code", { length: 50 }).default("EMP-10001"),
    firstName: varchar("first_name", { length: 100 }).notNull(),
    lastName: varchar("last_name", { length: 100 }).notNull(),
    preferredName: varchar("preferred_name", { length: 100 }),
    pronouns: varchar("pronouns", { length: 50 }),
    dateOfBirth: varchar("date_of_birth", { length: 30 }),
    gender: varchar("gender", { length: 50 }),
    maritalStatus: varchar("marital_status", { length: 50 }),
    nationality: varchar("nationality", { length: 100 }).default("Indian"),
    avatarUrl: text("avatar_url"),
    bio: text("bio"),
    skills: jsonb("skills").$type<string[]>().default([]),
    languages: jsonb("languages").$type<string[]>().default(["English", "Hindi"]),

    // 2. Contact & Address
    phoneNumber: varchar("phone_number", { length: 30 }).notNull(),
    whatsappNumber: varchar("whatsapp_number", { length: 30 }).notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    personalEmail: varchar("personal_email", { length: 255 }),
    personalPhone: varchar("personal_phone", { length: 30 }),
    alternatePhone: varchar("alternate_phone", { length: 30 }),
    officeExtension: varchar("office_extension", { length: 20 }),
    currentAddress: jsonb("current_address").$type<Address>(),
    permanentAddress: jsonb("permanent_address").$type<Address>(),

    // 3. Emergency Contacts
    emergencyContacts: jsonb("emergency_contacts").$type<EmergencyContact[]>().default([]),

    // 4. Job & Org
    designation: varchar("designation", { length: 255 }).notNull(),
    department: varchar("department", { length: 150 }).default("Wholesale Operations"),
    division: varchar("division", { length: 150 }),
    territoryRegion: varchar("territory_region", { length: 150 }).notNull(),
    directManager: jsonb("direct_manager").$type<DirectManager>(),
    employmentType: varchar("employment_type", { length: 50 }).default("Full-time (Perm)"),
    employmentStatus: varchar("employment_status", { length: 50 }).default("Active"),
    joiningDate: varchar("joining_date", { length: 30 }).default("2023-01-15"),
    confirmationDate: varchar("confirmation_date", { length: 30 }),
    workLocation: varchar("work_location", { length: 150 }).default("Kanpur Central Hub, India"),
    shiftSchedule: varchar("shift_schedule", { length: 150 }).default("Standard Shift (09:30 AM - 06:30 PM IST)"),
    timezone: varchar("timezone", { length: 100 }).default("Asia/Kolkata"),
    workFromHomePolicy: varchar("wfh_policy", { length: 150 }).default("On-Site Hub (5 Days/Week)"),
    noticePeriodDays: integer("notice_period_days").default(60),
    bandGrade: varchar("band_grade", { length: 50 }).default("L3 - Specialist"),
    costCenter: varchar("cost_center", { length: 50 }).default("CC-OPS-NORTH"),

    // 5. Statutory & Tax
    panNumber: varchar("pan_number", { length: 30 }),
    aadhaarNumber: varchar("aadhaar_number", { length: 30 }),
    providentFundUan: varchar("provident_fund_uan", { length: 30 }),
    esicNumber: varchar("esic_number", { length: 30 }),
    taxRegime: varchar("tax_regime", { length: 50 }).default("New Tax Regime (115BAC)"),
    statutoryStatus: varchar("statutory_status", { length: 50 }).default("Pending HR Review"),

    // 6. Financial & Banking
    bankAccount: jsonb("bank_account").$type<BankAccount>(),
    salaryStructure: jsonb("salary_structure").$type<SalaryStructure>(),
    payrollFreezeNotice: text("payroll_freeze_notice"),

    // 7. Education & Prior Employment
    education: jsonb("education").$type<EducationRecord[]>().default([]),
    priorEmployment: jsonb("prior_employment").$type<PriorEmployment[]>().default([]),

    // 8. Dependents & Beneficiaries
    dependents: jsonb("dependents").$type<Dependent[]>().default([]),

    // 9. Hardware & IT Assets
    assignedAssets: jsonb("assigned_assets").$type<AssetRecord[]>().default([]),

    // 10. Documents Repository
    documents: jsonb("documents").$type<EmployeeDocument[]>().default([]),

    // 11. Revision History & Audit Trail
    revisionHistory: jsonb("revision_history").$type<RevisionHistoryEntry[]>().default([]),

    // 12. Public Visiting Card Overrides
    linkedinUrl: text("linkedin_url"),
    customWhatsappTemplate: text("custom_whatsapp_template"),
    customRateCardUrl: text("custom_rate_card_url"),

    isActive: boolean("is_active").default(true).notNull(),

    // Performance & Analytics Counters
    scanCount: integer("scan_count").default(0).notNull(),
    vcardDownloads: integer("vcard_downloads").default(0).notNull(),
    whatsappClicks: integer("whatsapp_clicks").default(0).notNull(),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("employees_tenant_slug_uidx").on(table.tenantId, table.slug),
    index("employees_tenant_active_idx").on(table.tenantId, table.isActive),
    index("employees_phone_idx").on(table.phoneNumber),
    index("employees_code_idx").on(table.employeeCode),
  ]
);

export const employeesRelations = relations(employees, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [employees.tenantId],
    references: [tenants.id],
  }),
  leads: many(leadInquiries),
}));

export type EmployeeRecord = typeof employees.$inferSelect;
export type NewEmployeeRecord = typeof employees.$inferInsert;
