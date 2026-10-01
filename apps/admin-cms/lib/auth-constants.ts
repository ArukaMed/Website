import {
  SESSION_COOKIE_NAME,
  AUTHORIZED_ACCOUNTS,
  createSignedSessionToken,
  verifySignedSessionToken,
  type AuthorizedAccount,
} from "@aegis/auth";
import type { UserRoleType, UserSession } from "@aegis/types";

export { SESSION_COOKIE_NAME, AUTHORIZED_ACCOUNTS };
export type { AuthorizedAccount };

export interface DemoUser {
  email: string;
  fullName: string;
  role: UserRoleType;
  tenantSlug: string;
  description: string;
  plainPasswordHint?: string;
}

export const DEMO_ACCOUNTS: DemoUser[] = AUTHORIZED_ACCOUNTS.map((a) => ({
  email: a.email,
  fullName: a.fullName,
  role: a.role,
  tenantSlug: a.tenantSlug,
  description: a.description,
  plainPasswordHint: a.plainPasswordHint,
}));

export function encodeSession(session: UserSession): string {
  return createSignedSessionToken(session);
}

export function decodeSession(token: string): UserSession | null {
  return verifySignedSessionToken(token);
}

