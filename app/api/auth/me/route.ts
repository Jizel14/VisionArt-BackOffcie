import { NextResponse } from "next/server";
import { headers } from "next/headers";
import pool from "@/lib/db";
import { verifyAccessToken } from "@/lib/auth/token.service";

export async function GET() {
  const h = await headers();
  const value = h.get("authorization") || "";
  const token = value.startsWith("Bearer ") ? value.slice("Bearer ".length) : "";
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const payload = await verifyAccessToken(token);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [rows] = await pool.query(
    `SELECT id, email, is_admin
     FROM users
     WHERE id = ?
     LIMIT 1`,
    [payload.adminId]
  );

  const admin = (rows as any[])[0];
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!admin.is_admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  return NextResponse.json({
    id: String(admin.id),
    email: String(admin.email),
    role: "admin",
    permissions: payload.permissions,
  });
}
