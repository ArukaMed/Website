import { NextRequest, NextResponse } from "next/server";
import { OPS_SESSION_COOKIE_NAME, verifySignedSessionToken } from "@aegis/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const cookie = req.cookies.get(OPS_SESSION_COOKIE_NAME);
  if (!cookie?.value) {
    return NextResponse.json({ authenticated: false, session: null }, { status: 401 });
  }

  const session = verifySignedSessionToken(cookie.value);
  if (!session) {
    return NextResponse.json({ authenticated: false, session: null }, { status: 401 });
  }

  return NextResponse.json({ authenticated: true, session });
}
