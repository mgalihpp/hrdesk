import { type NextRequest, NextResponse } from "next/server";
import { sanitizeNext } from "@/lib/auth-errors";
import { checkRateLimit } from "@/lib/rate-limit";

export function proxy(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  const isApi =
    pathname.startsWith("/api/trpc") || pathname.startsWith("/api/auth");
  if (isApi) {
    const forwarded = req.headers.get("x-forwarded-for");
    const ip =
      forwarded?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown";
    const key = `ip:${ip}`;
    const result = checkRateLimit(key, 20, 60_000);
    if (!result.allowed) {
      const retryAfter = Math.max(
        1,
        Math.ceil((result.resetAt - Date.now()) / 1000),
      );
      return new NextResponse(JSON.stringify({ error: "Too many requests" }), {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": String(retryAfter),
        },
      });
    }
  }

  const hasSession =
    req.cookies.has("better-auth.session_token") ||
    req.cookies.has("__Secure-better-auth.session_token");

  if (hasSession) return NextResponse.next();

  const { pathname: path, search } = req.nextUrl;
  const isProtected = path.startsWith("/dashboard") || path.startsWith("/app");
  if (!isProtected) return NextResponse.next();

  const raw = `${path}${search}`;
  const safe = sanitizeNext(raw) ?? path;
  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.search = `?next=${encodeURIComponent(safe)}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/app/:path*",
    "/api/trpc/:path*",
    "/api/auth/:path*",
  ],
};
