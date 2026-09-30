import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import type { UserSession } from "@aegis/types";
import { SESSION_COOKIE_NAME, decodeSession } from "./auth-constants";

export * from "./auth-constants";

export function getSessionFromRequest(req: NextRequest): UserSession | null {
  // Check cookie first
  const cookie = req.cookies.get(SESSION_COOKIE_NAME);
  if (cookie?.value) {
    const s = decodeSession(cookie.value);
    if (s) return s;
  }

  // Check Authorization Bearer header
  const authHeader = req.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const s = decodeSession(authHeader.substring(7));
    if (s) return s;
  }

  return null;
}

export async function getServerSession(): Promise<UserSession | null> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(SESSION_COOKIE_NAME);
  if (cookie?.value) {
    return decodeSession(cookie.value);
  }
  return null;
}
