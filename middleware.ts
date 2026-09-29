import { NextRequest, NextResponse } from "next/server";

// Simple HTTP Basic Auth gate for the whole dashboard. Credentials are set as
// SITE_USERNAME / SITE_PASSWORD in Vercel's Environment Variables — nothing
// is hardcoded here. If those aren't configured, the site stays open rather
// than locking everyone out by accident.
export function middleware(req: NextRequest) {
  const expectedUser = process.env.SITE_USERNAME;
  const expectedPass = process.env.SITE_PASSWORD;

  if (!expectedUser || !expectedPass) {
    return NextResponse.next();
  }

  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Basic ")) {
    try {
      const decoded = atob(authHeader.slice(6));
      const separatorIndex = decoded.indexOf(":");
      const user = decoded.slice(0, separatorIndex);
      const pass = decoded.slice(separatorIndex + 1);
      if (user === expectedUser && pass === expectedPass) {
        return NextResponse.next();
      }
    } catch {
      // fall through to challenge
    }
  }

  return new NextResponse("Authentication required.", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="NPX Amazon Control Center"' },
  });
}

export const config = {
  matcher: "/:path*",
};
