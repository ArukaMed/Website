import { NextRequest, NextResponse } from "next/server";
import { verifyCredentials, createSignedSessionToken, OPS_SESSION_COOKIE_NAME } from "@aegis/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { message: "Please provide both an authorized email and password" },
        { status: 400 }
      );
    }

    const result = verifyCredentials(email, password, "ops");
    if (!result.success || !result.session) {
      return NextResponse.json(
        { message: result.error || "Invalid authorized operations credentials" },
        { status: 401 }
      );
    }

    const session = result.session;
    const token = createSignedSessionToken(session);

    const response = NextResponse.json({
      success: true,
      message: `Signed in as ${session.fullName} (${session.role})`,
      session,
      token,
    });

    response.cookies.set({
      name: OPS_SESSION_COOKIE_NAME,
      value: token,
      httpOnly: false,
      path: "/",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (err: any) {
    return NextResponse.json({ message: err?.message || "Sign-in failed" }, { status: 400 });
  }
}
