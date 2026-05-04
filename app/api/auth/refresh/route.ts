import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  generateAccessToken,
  generateRefreshToken,
  hashRefreshToken,
} from "@/lib/auth/token.service";
import pool from "@/lib/db";
import {
  findRefreshToken,
  markTokenAsUsed,
  revokeFamily,
  storeRefreshToken,
} from "@/lib/auth/refresh-token.db";
import { SecurityLogger } from "@/lib/auth/security-logger";

function isExpired(expiresAt: string) {
  const exp = new Date(expiresAt).getTime();
  return Number.isFinite(exp) && exp < Date.now();
}

async function latestFamilyUpdatedAt(familyId: string): Promise<Date | null> {
  const [rows] = await pool.query(
    `SELECT updated_at
     FROM refresh_tokens
     WHERE family_id = ?
     ORDER BY id DESC
     LIMIT 1`,
    [familyId]
  );
  const r = (rows as any[])[0];
  if (!r?.updated_at) return null;
  const d = new Date(r.updated_at);
  return Number.isFinite(d.getTime()) ? d : null;
}

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const raw = cookieStore.get("refresh_token")?.value || null;

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip");

  if (!raw) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tokenHash = hashRefreshToken(raw);
  const row = await findRefreshToken(tokenHash);
  if (!row) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (row.is_revoked) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (isExpired(row.expires_at)) {
    return NextResponse.json({ error: "Session expired" }, { status: 401 });
  }

  if (row.is_used) {
    // Grace window: if the family rotated very recently, this is likely a
    // duplicate refresh call (page-load race), not theft.
    const last = await latestFamilyUpdatedAt(row.family_id);
    if (last && Date.now() - last.getTime() < 5000) {
      return NextResponse.json(
        { error: "Token already used", code: "TOKEN_ROTATED" },
        { status: 401 }
      );
    }

    await revokeFamily(row.family_id);
    SecurityLogger.tokenReuseDetected({
      adminId: row.admin_id,
      familyId: row.family_id,
      ip: ip ?? null,
    });
    return NextResponse.json(
      { error: "Session invalidated — suspicious activity detected" },
      { status: 401 }
    );
  }

  // Mark used BEFORE issuing new tokens.
  await markTokenAsUsed(tokenHash);

  const [adminRows] = await pool.query(
    `SELECT id, email, is_admin
     FROM users
     WHERE id = ?
     LIMIT 1`,
    [row.admin_id]
  );
  const admin = (adminRows as any[])[0];
  if (!admin || !admin.is_admin) {
    await revokeFamily(row.family_id);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = "admin";
  const permissions = ["*"];
  const accessToken = await generateAccessToken({
    adminId: String(admin.id),
    email: String(admin.email),
    role,
    permissions,
  });

  const newRaw = generateRefreshToken();
  const newHash = hashRefreshToken(newRaw);
  await storeRefreshToken({
    tokenHash: newHash,
    adminId: row.admin_id,
    familyId: row.family_id,
    deviceInfo: req.headers.get("user-agent"),
    ipAddress: ip ?? null,
  });

  SecurityLogger.tokenRefresh({
    adminId: row.admin_id,
    familyId: row.family_id,
    ip: ip ?? null,
  });

  const secure = process.env.NODE_ENV === "production";
  const sameSite = process.env.NODE_ENV === "production" ? "strict" : "lax";
  const maxAge = 7 * 24 * 60 * 60;
  const expiresIn = Number(process.env.ACCESS_TOKEN_EXPIRY ?? 900);
  const res = NextResponse.json({ accessToken, expiresIn });

  res.cookies.set("refresh_token", newRaw, {
    httpOnly: true,
    secure,
    sameSite,
    path: "/api/auth",
    maxAge,
  });
  return res;
}

