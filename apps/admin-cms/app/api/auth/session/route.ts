import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth-session";

export async function GET(req: NextRequest) {
  const session = getSessionFromRequest(req);
  return NextResponse.json({
    authenticated: !!session,
    session: session || null,
  });
}
