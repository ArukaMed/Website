import { pgTable, uuid, varchar, text, timestamp, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { tenants } from "./tenants";
import { employees } from "./employees";

export const leadInquiries = pgTable(
  "lead_inquiries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .references(() => tenants.id, { onDelete: "cascade" })
      .notNull(),
    employeeId: uuid("employee_id").references(() => employees.id, { onDelete: "set null" }),
    institutionName: varchar("institution_name", { length: 255 }).notNull(),
    businessType: varchar("business_type", { length: 100 }).notNull(),
    contactName: varchar("contact_name", { length: 150 }).notNull(),
    phone: varchar("phone", { length: 30 }).notNull(),
    email: varchar("email", { length: 255 }),
    drugLicenceNumber: varchar("drug_licence_number", { length: 100 }),
    gstin: varchar("gstin", { length: 20 }),
    requirementCategory: varchar("requirement_category", { length: 150 }),
    estimatedMonthlyVolume: varchar("estimated_monthly_volume", { length: 100 }),
    sourceUrl: text("source_url").notNull(),
    userAgent: text("user_agent"),
    ipAddress: varchar("ip_address", { length: 45 }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("leads_tenant_created_idx").on(table.tenantId, table.createdAt),
    index("leads_employee_idx").on(table.employeeId),
  ]
);

export const leadInquiriesRelations = relations(leadInquiries, ({ one }) => ({
  tenant: one(tenants, { fields: [leadInquiries.tenantId], references: [tenants.id] }),
  employee: one(employees, { fields: [leadInquiries.employeeId], references: [employees.id] }),
}));

export type LeadInquiryRecord = typeof leadInquiries.$inferSelect;
export type NewLeadInquiryRecord = typeof leadInquiries.$inferInsert;
