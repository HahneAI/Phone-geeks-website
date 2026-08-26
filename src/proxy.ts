import { NextResponse, type NextRequest } from "next/server";
import {
  MANAGEMENT_COOKIE_NAME,
  verifySessionToken,
} from "@/lib/management-auth";

/**
 * Gates every /management route behind the shared password from
 * `MANAGEMENT_PASSWORD` (see src/lib/management-auth.ts and TODO.md §6).
 * The login page itself is excluded via the matcher below so it doesn't
 * redirect to itself.
 */
export async function proxy(request: NextRequest) {
  if (request.nextUrl.pathname === "/management/login") {
    return NextResponse.next();
  }

  const token = request.cookies.get(MANAGEMENT_COOKIE_NAME)?.value;
  const authed = await verifySessionToken(token);

  if (!authed) {
    const loginUrl = new URL("/management/login", request.url);
    loginUrl.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/management", "/management/:path*"],
};
