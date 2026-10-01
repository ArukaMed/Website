import { NextResponse } from "next/server";
import { OPS_SESSION_COOKIE_NAME } from "@aegis/auth";

export const dynamic = "force-dynamic";

export async function POST() {
  const response = NextResponse.json({ success: true, message: "Logged out successfully" });
  response.cookies.delete(OPS_SESSION_COOKIE_NAME);
  return response;
}
