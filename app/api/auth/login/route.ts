import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import pool from "@/lib/db";
import {
  generateAccessToken,
  generateFamilyId,
  generateRefreshToken,
  hashRefreshToken,
} from "@/lib/auth/token.service";
import { storeRefreshToken } from "@/lib/auth/refresh-token.db";
import { SecurityLogger } from "@/lib/auth/security-logger";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      req.headers.get("x-real-ip");
    const userAgent = req.headers.get("user-agent");

    const [rows] = await pool.query(
      `SELECT id, email, password_hash, is_admin
       FROM users
       WHERE email = ?
       LIMIT 1`,
      [String(email).toLowerCase()]
    );

    const admin = (rows as any[])[0];
    if (!admin) {
      SecurityLogger.loginFailure({
        email: String(email),
        ip: ip ?? null,
        reason: "INVALID_CREDENTIALS",
      });
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    if (!admin.is_admin) {
      SecurityLogger.loginFailure({
        email: String(email),
        ip: ip ?? null,
        reason: "NOT_ADMIN",
      });
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const ok = await bcrypt.compare(String(password), String(admin.password_hash));
    if (!ok) {
      SecurityLogger.loginFailure({
        email: String(email),
        ip: ip ?? null,
        reason: "INVALID_CREDENTIALS",
      });
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const role = "admin";
    const permissions = ["*"];
    const accessTokenExpiry = Number(process.env.ACCESS_TOKEN_EXPIRY ?? 900);
    const accessToken = await generateAccessToken({
      adminId: String(admin.id),
      email: String(admin.email),
      role,
      permissions,
    });

    const rawRefreshToken = generateRefreshToken();
    const familyId = generateFamilyId();
    const tokenHash = hashRefreshToken(rawRefreshToken);

    await storeRefreshToken({
      tokenHash,
      adminId: String(admin.id),
      familyId,
      deviceInfo: userAgent ?? null,
      ipAddress: ip ?? null,
    });

    SecurityLogger.loginSuccess({
      adminId: String(admin.id),
      ip: ip ?? null,
      userAgent: userAgent ?? null,
    });

    const secure = process.env.NODE_ENV === "production";
    const sameSite = process.env.NODE_ENV === "production" ? "strict" : "lax";
    const maxAge = 7 * 24 * 60 * 60;

    const res = NextResponse.json(
      {
        accessToken,
        expiresIn: accessTokenExpiry,
        admin: { id: String(admin.id), email: String(admin.email), role },
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
          "Content-Type": "application/json",
        },
      }
    );

    res.cookies.set("refresh_token", rawRefreshToken, {
      httpOnly: true,
      secure,
      sameSite,
      path: "/api/auth",
      maxAge,
    });

    return res;
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
