import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  jsonb,
  pgEnum,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import type {
  TenantThemeConfig,
  TenantComplianceInfo,
  TenantCommercialSettings,
  TenantFeatureFlags,
  TenantWebsiteContent,
} from "@aegis/types";
import { employees } from "./employees";
import { leadInquiries } from "./leads";
import { memberships } from "./rbac";

export const tenantStatusEnum = pgEnum("tenant_status", ["ACTIVE", "SUSPENDED", "PENDING_ONBOARDING"]);

export const tenants = pgTable(
  "tenants",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 100 }).notNull(),
    customDomain: varchar("custom_domain", { length: 255 }),
    logoUrlLight: text("logo_url_light").notNull(),
    logoUrlDark: text("logo_url_dark"),
    markUrl: text("mark_url"),
    faviconUrl: text("favicon_url"),
    status: tenantStatusEnum("status").default("ACTIVE").notNull(),

    // Strict JSONB schemas backed by Zod validated TypeScript interfaces
    themeConfig: jsonb("theme_config").$type<TenantThemeConfig>().notNull(),
    complianceInfo: jsonb("compliance_info").$type<TenantComplianceInfo>().notNull(),
    commercialSettings: jsonb("commercial_settings").$type<TenantCommercialSettings>().notNull(),
    featureFlags: jsonb("feature_flags").$type<TenantFeatureFlags>().notNull(),
    websiteContent: jsonb("website_content").$type<TenantWebsiteContent>(),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("tenants_slug_uidx").on(table.slug),
    uniqueIndex("tenants_domain_uidx").on(table.customDomain),
    index("tenants_status_idx").on(table.status),
  ]
);

export const tenantsRelations = relations(tenants, ({ many }) => ({
  employees: many(employees),
  leadInquiries: many(leadInquiries),
  memberships: many(memberships),
}));

export type TenantRecord = typeof tenants.$inferSelect;
export type NewTenantRecord = typeof tenants.$inferInsert;
