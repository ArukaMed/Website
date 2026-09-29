import { z } from "zod";

export const UserRole = {
  SUPER_ADMIN: "SUPER_ADMIN",
  BRAND_ADMIN: "BRAND_ADMIN",
  OPS_MANAGER: "OPS_MANAGER",
  SALES_REP: "SALES_REP",
} as const;

export type UserRoleType = (typeof UserRole)[keyof typeof UserRole];

export const UserRoleSchema = z.enum(["SUPER_ADMIN", "BRAND_ADMIN", "OPS_MANAGER", "SALES_REP"]);

export interface UserSession {
  userId: string;
  email: string;
  fullName: string;
  tenantId?: string;
  tenantSlug?: string;
  role: UserRoleType;
}
