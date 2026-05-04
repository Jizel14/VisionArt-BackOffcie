import { NextResponse } from "next/server";
import pool from "@/lib/db";
import type { RowDataPacket } from "mysql2";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(200, Math.max(1, parseInt(searchParams.get("limit") || "50", 10)));

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT a.id, a.user_id, a.segment, a.channel, a.payload, a.context,
              a.promo_code, a.created_at, a.requires_review, a.status,
              u.email AS user_email, u.name AS user_name
       FROM retention_actions a
       LEFT JOIN users u ON u.id = a.user_id
       WHERE a.status = 'PENDING'
       ORDER BY a.created_at DESC
       LIMIT ?`,
      [limit]
    );

    return NextResponse.json({
      items: rows.map((r) => ({
        id: String(r.id),
        userId: r.user_id,
        userEmail: r.user_email,
        userName: r.user_name,
        segment: r.segment,
        channel: r.channel,
        payload: typeof r.payload === "string" ? JSON.parse(r.payload) : r.payload,
        context: typeof r.context === "string" ? JSON.parse(r.context) : r.context,
        promoCode: r.promo_code,
        createdAt: r.created_at,
        requiresReview: !!r.requires_review,
      })),
    });
  } catch (err) {
    console.error("Retention pending error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
