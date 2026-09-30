import { NextRequest, NextResponse } from "next/server";

export const config = {
  matcher: [
    "/((?!api/|_next/|_static/|assets/|[\\w-]+\\.\\w+).*)",
  ],
};

export async function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const hostname = req.headers.get("host")?.toLowerCase() || "";
  const pathname = url.pathname;

  // Set essential security headers on request
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("X-Content-Type-Options", "nosniff");
  requestHeaders.set("X-Frame-Options", "SAMEORIGIN");
  requestHeaders.set("Referrer-Policy", "strict-origin-when-cross-origin");

  // Route: /c/:slug -> Visiting Card
  if (pathname.startsWith("/c/")) {
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  // Rewrite root or custom domain to marketing home
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}
