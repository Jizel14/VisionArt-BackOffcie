import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { hashRefreshToken } from "@/lib/auth/token.service";
import { findRefreshToken, revokeFamily } from "@/lib/auth/refresh-token.db";
import { SecurityLogger } from "@/lib/auth/security-logger";

export async function POST() {
  const cookieStore = await cookies();
  const raw = cookieStore.get("refresh_token")?.value || null;

  let adminId: string | null = null;
  let familyId: string | null = null;

  if (raw) {
    const hash = hashRefreshToken(raw);
    const row = await findRefreshToken(hash);
    if (row) {
      adminId = row.admin_id;
      familyId = row.family_id;
      await revokeFamily(row.family_id);
    }
  }

  SecurityLogger.logout({ adminId, familyId });

  const res = NextResponse.json({ message: "Logged out successfully" });
  res.cookies.set("refresh_token", "", {
    httpOnly: true,
    maxAge: 0,
    path: "/api/auth",
  });
  return res;
}
