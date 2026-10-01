import {
  SESSION_COOKIE_NAME,
  AUTHORIZED_ACCOUNTS,
  createSignedSessionToken,
  verifySignedSessionToken,
  type AuthorizedAccount,
} from "@aegis/auth";
import type { UserSession } from "@aegis/types";

export { SESSION_COOKIE_NAME, AUTHORIZED_ACCOUNTS };
export type { AuthorizedAccount };

export function encodeSession(session: UserSession): string {
  return createSignedSessionToken(session);
}

export function decodeSession(token: string): UserSession | null {
  return verifySignedSessionToken(token);
}
