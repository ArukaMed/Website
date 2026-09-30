import { NextRequest, NextResponse } from "next/server";
import { DEMO_ACCOUNTS, encodeSession, SESSION_COOKIE_NAME } from "@/lib/auth-session";
import { UserRole, type UserRoleType, type UserSession } from "@aegis/types";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, role, fullName } = body;

    // Check if matching predefined demo account
    const matchedDemo = DEMO_ACCOUNTS.find(
      (a) => a.email.toLowerCase() === (email || "").toLowerCase().trim()
    );

    let assignedRole: UserRoleType = UserRole.BRAND_ADMIN;
    let assignedName = "Vikram Malhotra";
    let assignedEmail = "admin@arukamed.com";
    const assignedTenant = "arukamed";

    if (matchedDemo) {
      assignedRole = matchedDemo.role;
      assignedName = matchedDemo.fullName;
      assignedEmail = matchedDemo.email;
    } else if (role && Object.values(UserRole).includes(role)) {
      assignedRole = role as UserRoleType;
      assignedName = fullName?.trim() || email?.split("@")[0] || "Admin User";
      assignedEmail = email?.trim() || "admin@arukamed.com";
    }

    const session: UserSession = {
      userId: `usr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      email: assignedEmail,
      fullName: assignedName,
      tenantSlug: assignedTenant,
      role: assignedRole,
    };

    const token = encodeSession(session);

    const response = NextResponse.json({
      success: true,
      message: `Signed in as ${session.fullName} (${session.role})`,
      session,
      token,
    });

    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: token,
      httpOnly: false, // accessible to client for fast state hydrate
      path: "/",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (err: any) {
    return NextResponse.json({ message: err?.message || "Sign-in failed" }, { status: 400 });
  }
}
