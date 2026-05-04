import { NextResponse } from "next/server";
import pool from "@/lib/db";
import type { RowDataPacket } from "mysql2";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") || "30", 10)));
    const segment = searchParams.get("segment") || "";
    const status = searchParams.get("status") || "";

    const where: string[] = ["1=1"];
    const params: (string | number)[] = [];
    if (segment) {
      where.push("a.segment = ?");
      params.push(segment);
    }
    if (status) {
      where.push("a.status = ?");
      params.push(status);
    }

    const [[{ total }]] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS total FROM retention_actions a WHERE ${where.join(" AND ")}`,
      params
    );

    const totalCount = Number(total);
    const offset = (page - 1) * pageSize;

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT a.id, a.user_id, a.segment, a.channel, a.status, a.payload,
              a.promo_code, a.requires_review, a.sent_at, a.created_at,
              u.email AS user_email, u.name AS user_name,
              (SELECT COUNT(*) FROM retention_events e
                 WHERE e.action_id = a.id AND e.type = 'OPENED') AS opens,
              (SELECT COUNT(*) FROM retention_events e
                 WHERE e.action_id = a.id AND e.type = 'CLICKED') AS clicks,
              (SELECT COUNT(*) FROM retention_events e
                 WHERE e.action_id = a.id AND e.type = 'CONVERTED') AS conversions
       FROM retention_actions a
       LEFT JOIN users u ON u.id = a.user_id
       WHERE ${where.join(" AND ")}
       ORDER BY a.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, pageSize, offset]
    );

    return NextResponse.json({
      items: rows.map((r) => ({
        id: String(r.id),
        userId: r.user_id,
        userEmail: r.user_email,
        userName: r.user_name,
        segment: r.segment,
        channel: r.channel,
        status: r.status,
        payload: typeof r.payload === "string" ? JSON.parse(r.payload) : r.payload,
        promoCode: r.promo_code,
        requiresReview: !!r.requires_review,
        sentAt: r.sent_at,
        createdAt: r.created_at,
        opens: Number(r.opens),
        clicks: Number(r.clicks),
        conversions: Number(r.conversions),
      })),
      total: totalCount,
      page,
      pageSize,
      totalPages: Math.ceil(totalCount / pageSize),
    });
  } catch (err) {
    console.error("Retention history error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
