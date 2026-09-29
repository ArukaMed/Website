import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  pgEnum,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { tenants } from "./tenants";

export const userRoleEnum = pgEnum("user_role", [
  "SUPER_ADMIN",
  "BRAND_ADMIN",
  "OPS_MANAGER",
  "SALES_REP",
]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  authProviderId: varchar("auth_provider_id", { length: 255 }).notNull().unique(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  fullName: varchar("full_name", { length: 255 }).notNull(),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const memberships = pgTable(
  "memberships",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
    tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
    role: userRoleEnum("role").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("memberships_user_tenant_uidx").on(table.userId, table.tenantId),
    index("memberships_role_idx").on(table.role),
  ]
);

export const usersRelations = relations(users, ({ many }) => ({
  memberships: many(memberships),
}));

export const membershipsRelations = relations(memberships, ({ one }) => ({
  user: one(users, { fields: [memberships.userId], references: [users.id] }),
  tenant: one(tenants, { fields: [memberships.tenantId], references: [tenants.id] }),
}));

export type UserRecord = typeof users.$inferSelect;
export type MembershipRecord = typeof memberships.$inferSelect;
