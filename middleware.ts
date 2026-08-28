import { type NextRequest, NextResponse } from "next/server";
import { sanitizeNext } from "@/lib/auth-errors";

export function middleware(req: NextRequest) {
  const hasSession =
    req.cookies.has("better-auth.session_token") ||
    req.cookies.has("__Secure-better-auth.session_token");

  if (hasSession) return NextResponse.next();

  const { pathname, search } = req.nextUrl;
  const isProtected =
    pathname.startsWith("/dashboard") || pathname.startsWith("/app");
  if (!isProtected) return NextResponse.next();

  const raw = `${pathname}${search}`;
  const safe = sanitizeNext(raw) ?? pathname;
  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.search = `?next=${encodeURIComponent(safe)}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/dashboard/:path*", "/app/:path*"],
};
