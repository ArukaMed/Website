import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  integer,
  timestamp,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
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
    firstName: varchar("first_name", { length: 100 }).notNull(),
    lastName: varchar("last_name", { length: 100 }).notNull(),
    avatarUrl: text("avatar_url"),
    designation: varchar("designation", { length: 255 }).notNull(),
    division: varchar("division", { length: 150 }),
    territoryRegion: varchar("territory_region", { length: 150 }).notNull(),

    // Contact endpoints
    phoneNumber: varchar("phone_number", { length: 30 }).notNull(),
    whatsappNumber: varchar("whatsapp_number", { length: 30 }).notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    linkedinUrl: text("linkedin_url"),
    officeExtension: varchar("office_extension", { length: 20 }),

    // White-label Overrides
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
