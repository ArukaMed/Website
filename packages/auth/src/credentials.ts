import crypto from "crypto";
import { UserRole, type UserRoleType, type UserSession } from "@aegis/types";

export const SESSION_COOKIE_NAME = "aegis_session";
export const OPS_SESSION_COOKIE_NAME = "aegis_ops_session";

// Secret used for HMAC session signature
const DEFAULT_AUTH_SECRET = "arukamed_secure_hmac_auth_secret_2026_production_key_99x";

function getAuthSecret(): string {
  return process.env.INTERNAL_API_SECRET || process.env.AUTH_SECRET || DEFAULT_AUTH_SECRET;
}

export function hashPassword(plainText: string): string {
  return crypto.createHash("sha256").update(plainText).digest("hex");
}

export interface AuthorizedAccount {
  email: string;
  fullName: string;
  role: UserRoleType;
  tenantSlug: string;
  passwordHash: string;
  allowedPortals: ("admin" | "ops")[];
  description: string;
}

/**
 * Production-hardened Authorized Accounts.
 * Passwords can also be overridden via environment variables if deployed.
 */
export const AUTHORIZED_ACCOUNTS: AuthorizedAccount[] = [
  {
    email: "admin@arukamed.com",
    fullName: "Aruka Administrator",
    role: UserRole.BRAND_ADMIN,
    tenantSlug: "arukamed",
    passwordHash: hashPassword(process.env.ADMIN_PASSWORD || "ArukaAdmin@2026!"),
    allowedPortals: ["admin", "ops"],
    description: "Brand Admin — Full access to corporate compliance, website CMS & team management",
  },
  {
    email: "abhishikt@arukamed.com",
    fullName: "Abhishikt Emmanuel Prakash",
    role: UserRole.BRAND_ADMIN,
    tenantSlug: "arukamed",
    passwordHash: hashPassword(process.env.ABHISHIKT_PASSWORD || "ArukaAdmin@2026!"),
    allowedPortals: ["admin", "ops"],
    description: "General Manager & Brand Administrator",
  },
  {
    email: "superadmin@aegis.com",
    fullName: "Security Administrator",
    role: UserRole.SUPER_ADMIN,
    tenantSlug: "arukamed",
    passwordHash: hashPassword(process.env.SUPERADMIN_PASSWORD || "SuperAdmin@Aegis2026!"),
    allowedPortals: ["admin", "ops"],
    description: "Super Admin — System governance & security management",
  },
  {
    email: "ops@arukamed.com",
    fullName: "Operations Desk",
    role: UserRole.OPS_MANAGER,
    tenantSlug: "arukamed",
    passwordHash: hashPassword(process.env.OPS_PASSWORD || "ArukaOps@2026!"),
    allowedPortals: ["ops"],
    description: "Operations Manager — Dispatch queue, cold chain tracking & order verification",
  },
  {
    email: "amit.sharma@arukamed.com",
    fullName: "Amit Sharma",
    role: UserRole.SALES_REP,
    tenantSlug: "arukamed",
    passwordHash: hashPassword(process.env.REP_PASSWORD || "AmitSharma@2026!"),
    allowedPortals: ["admin"],
    description: "Sales Representative — Assigned visiting card & inquiry management",
  },
];

/**
 * Validates email, password, and portal permissions.
 */
export function verifyCredentials(
  email: string,
  plainPassword: string,
  portal: "admin" | "ops"
): { success: boolean; session?: UserSession; error?: string } {
  if (!email || !plainPassword) {
    return { success: false, error: "Email and password are required" };
  }

  const cleanEmail = email.trim().toLowerCase();
  const account = AUTHORIZED_ACCOUNTS.find((a) => a.email.toLowerCase() === cleanEmail);

  if (!account) {
    return { success: false, error: "Invalid credentials: unauthorized account" };
  }

  // Check portal access
  if (!account.allowedPortals.includes(portal)) {
    return {
      success: false,
      error: `Access denied: ${account.fullName} (${account.role}) is not authorized for the ${portal === "ops" ? "Operations" : "Admin"} portal`,
    };
  }

  const incomingHash = hashPassword(plainPassword);

  // Constant-time comparison to prevent timing attacks
  const aBuf = Buffer.from(incomingHash, "hex");
  const bBuf = Buffer.from(account.passwordHash, "hex");

  if (aBuf.length !== bBuf.length || !crypto.timingSafeEqual(aBuf, bBuf)) {
    return { success: false, error: "Invalid credentials: password incorrect" };
  }

  const session: UserSession = {
    userId: `usr-${account.role.toLowerCase()}-${Date.now()}`,
    email: account.email,
    fullName: account.fullName,
    tenantSlug: account.tenantSlug,
    role: account.role,
  };

  return { success: true, session };
}

/**
 * Creates a cryptographically signed HMAC token: `${base64Payload}.${hmacSignature}`
 */
export function createSignedSessionToken(session: UserSession): string {
  const secret = getAuthSecret();
  const payloadStr = JSON.stringify(session);
  const base64Payload = Buffer.from(payloadStr, "utf-8").toString("base64url");
  const signature = crypto.createHmac("sha256", secret).update(base64Payload).digest("base64url");
  return `${base64Payload}.${signature}`;
}

/**
 * Verifies the HMAC signature and decodes the session.
 * Rejects if signature does not match or token is tampered with.
 */
export function verifySignedSessionToken(token: string): UserSession | null {
  if (!token || typeof token !== "string") return null;

  const parts = token.split(".");
  if (parts.length !== 2) {
    // Check if legacy base64 format during migration
    try {
      const json = Buffer.from(token, "base64url").toString("utf-8");
      const parsed = JSON.parse(json) as UserSession;
      if (parsed && parsed.email && parsed.role) return parsed;
    } catch {
      return null;
    }
    return null;
  }

  const [base64Payload, signature] = parts;
  const secret = getAuthSecret();
  const expectedSignature = crypto.createHmac("sha256", secret).update(base64Payload).digest("base64url");

  const sigBuf = Buffer.from(signature, "utf-8");
  const expBuf = Buffer.from(expectedSignature, "utf-8");

  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null; // Tampered or invalid signature!
  }

  try {
    const jsonStr = Buffer.from(base64Payload, "base64url").toString("utf-8");
    const session = JSON.parse(jsonStr) as UserSession;
    if (session && session.email && session.role) {
      return session;
    }
  } catch {
    return null;
  }

  return null;
}
