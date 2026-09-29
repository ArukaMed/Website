import { pgTable, uuid, varchar, text, integer, timestamp, pgEnum, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { tenants } from "./tenants";
import { employees } from "./employees";

export const orderStatusEnum = pgEnum("order_status", [
  "SUBMITTED",
  "PO_VERIFIED",
  "COLD_CHAIN_PACKED",
  "DISPATCHED",
  "DELIVERED",
  "CANCELLED",
]);

export const wholesaleOrders = pgTable(
  "wholesale_orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .references(() => tenants.id, { onDelete: "cascade" })
      .notNull(),
    employeeId: uuid("employee_id").references(() => employees.id, { onDelete: "set null" }),
    poNumber: varchar("po_number", { length: 100 }),
    institutionName: varchar("institution_name", { length: 255 }).notNull(),
    buyerGstin: varchar("buyer_gstin", { length: 20 }),
    buyerDrugLicence: varchar("buyer_drug_licence", { length: 100 }),
    contactName: varchar("contact_name", { length: 150 }).notNull(),
    contactPhone: varchar("contact_phone", { length: 30 }).notNull(),
    contactEmail: varchar("contact_email", { length: 255 }),
    poFileUrl: text("po_file_url"),
    totalAmountINR: integer("total_amount_inr"),
    status: orderStatusEnum("status").default("SUBMITTED").notNull(),
    trackingConsignmentNumber: varchar("tracking_consignment_number", { length: 100 }),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("orders_tenant_status_idx").on(table.tenantId, table.status),
    index("orders_employee_idx").on(table.employeeId),
  ]
);

export const wholesaleOrdersRelations = relations(wholesaleOrders, ({ one }) => ({
  tenant: one(tenants, { fields: [wholesaleOrders.tenantId], references: [tenants.id] }),
  employee: one(employees, { fields: [wholesaleOrders.employeeId], references: [employees.id] }),
}));

export type WholesaleOrderRecord = typeof wholesaleOrders.$inferSelect;
export type NewWholesaleOrderRecord = typeof wholesaleOrders.$inferInsert;
