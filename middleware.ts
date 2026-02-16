import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const COOKIE_NAME = "bo_token";
const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || "backoffice-super-secret"
);

const protectedPaths = [
  "/dashboard",
  "/users",
  "/artworks",
  "/reports",
  "/analytics",
  "/settings",
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // only protect admin paths
  const isProtected = protectedPaths.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
  if (!isProtected) return NextResponse.next();

  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  try {
    await jwtVerify(token, secret);
    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL("/login", req.url));
  }
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/users/:path*",
    "/artworks/:path*",
    "/reports/:path*",
    "/analytics/:path*",
    "/settings/:path*",
  ],
};
