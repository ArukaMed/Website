import { UserRole, type UserRoleType, type UserSession } from "@aegis/types";

export const SESSION_COOKIE_NAME = "aegis_session";

export interface DemoUser {
  email: string;
  fullName: string;
  role: UserRoleType;
  tenantSlug: string;
  description: string;
}

export const DEMO_ACCOUNTS: DemoUser[] = [
  {
    email: "admin@arukamed.com",
    fullName: "Vikram Malhotra",
    role: UserRole.BRAND_ADMIN,
    tenantSlug: "arukamed",
    description: "Brand Admin — Full access to edit corporate details, website CMS, QR settings & employees",
  },
  {
    email: "superadmin@aegis.com",
    fullName: "System Overseer",
    role: UserRole.SUPER_ADMIN,
    tenantSlug: "arukamed",
    description: "Super Admin — Cross-tenant governance, system configurations & unrestricted permissions",
  },
  {
    email: "ops@arukamed.com",
    fullName: "Pooja Deshmukh",
    role: UserRole.OPS_MANAGER,
    tenantSlug: "arukamed",
    description: "Operations Manager — Employee card status & lead tracking; read-only corporate settings",
  },
  {
    email: "amit.sharma@arukamed.com",
    fullName: "Amit Sharma",
    role: UserRole.SALES_REP,
    tenantSlug: "arukamed",
    description: "Sales Representative — View personal visiting card preview, QR code & rep-assigned leads",
  },
];

export function encodeSession(session: UserSession): string {
  const jsonStr = JSON.stringify(session);
  if (typeof window !== "undefined") {
    return btoa(unescape(encodeURIComponent(jsonStr)));
  }
  return Buffer.from(jsonStr, "utf-8").toString("base64url");
}

export function decodeSession(token: string): UserSession | null {
  try {
    let jsonStr: string;
    if (typeof window !== "undefined") {
      jsonStr = decodeURIComponent(escape(atob(token)));
    } else {
      jsonStr = Buffer.from(token, "base64url").toString("utf-8");
    }
    const data = JSON.parse(jsonStr) as UserSession;
    if (data && data.email && data.role) {
      return data;
    }
    return null;
  } catch {
    return null;
  }
}
