import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyAccessToken } from "@/lib/auth/token.service";
import { verifyLegacyHs256 } from "@/lib/auth/legacy-hs256";
import { SecurityLogger } from "@/lib/auth/security-logger";

const PUBLIC_PATHS = [
  "/login",
  "/api/auth/login",
  "/api/auth/refresh",
  "/api/auth/logout",
];

export async function middleware(req: NextRequest) {
  const isPublic = PUBLIC_PATHS.some(
    (path) =>
      req.nextUrl.pathname === path ||
      req.nextUrl.pathname.startsWith("/_next") ||
      req.nextUrl.pathname.startsWith("/favicon")
  );

  if (isPublic) return NextResponse.next();

  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.replace("Bearer ", "");

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip");

  const migrationMode = String(process.env.MIGRATION_MODE || "false") === "true";

  // Verify new ES256 token first.
  const payload = token ? await verifyAccessToken(token) : null;
  if (payload) {
    const headers = new Headers(req.headers);
    headers.set("x-admin-id", String(payload.adminId));
    headers.set("x-admin-role", payload.role);
    return NextResponse.next({ request: { headers } });
  }

  // Migration mode: accept legacy HS256 access token format as well.
  if (migrationMode && token) {
    const legacy = await verifyLegacyHs256(token);
    if (legacy) {
      const headers = new Headers(req.headers);
      headers.set("x-admin-id", "");
      headers.set("x-admin-role", legacy.role);
      return NextResponse.next({ request: { headers } });
    }
  }

  SecurityLogger.invalidTokenAttempt({ ip: ip ?? null, path: req.nextUrl.pathname });

  return NextResponse.json(
    { error: "Unauthorized", code: "INVALID_TOKEN" },
    { status: 401 }
  );
}

export const config = {
  // Protect API routes at the edge. Page navigations don't include Authorization headers,
  // so page protection is handled client-side (initAuth -> refresh -> redirect).
  matcher: ["/api/:path*"],
};
