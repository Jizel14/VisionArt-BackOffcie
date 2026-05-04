import { NextResponse } from "next/server";
import pool from "@/lib/db";
import type { RowDataPacket } from "mysql2";

const PRO_MONTHLY_EUR = Number(process.env.PRO_MONTHLY_EUR ?? 9.99);

export async function GET() {
  try {
    const [[{ actions7 }]] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS actions7 FROM retention_actions WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)`
    );
    const [[{ actions30 }]] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS actions30 FROM retention_actions WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)`
    );
    const [[{ pending }]] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS pending FROM retention_actions WHERE status = 'PENDING'`
    );
    const [[{ opened }]] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS opened FROM retention_events WHERE type = 'OPENED' AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)`
    );
    const [[{ clicked }]] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS clicked FROM retention_events WHERE type = 'CLICKED' AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)`
    );
    const [[{ converted }]] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS converted FROM retention_events WHERE type = 'CONVERTED' AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)`
    );
    const [[{ savedEur }]] = await pool.query<RowDataPacket[]>(
      `SELECT COALESCE(SUM(CAST(JSON_UNQUOTE(JSON_EXTRACT(metadata, '$.savedEur')) AS DECIMAL(10,2))), 0) AS savedEur
       FROM retention_events
       WHERE type = 'CONVERTED'
         AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)`
    );

    const [segments] = await pool.query<RowDataPacket[]>(
      `SELECT segment, COUNT(*) AS count
       FROM retention_actions
       WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
       GROUP BY segment
       ORDER BY count DESC`
    );

    const [byDay] = await pool.query<RowDataPacket[]>(
      `SELECT DATE(created_at) AS d, COUNT(*) AS c
       FROM retention_actions
       WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
       GROUP BY DATE(created_at)
       ORDER BY d ASC`
    );

    const a30 = Number(actions30) || 0;

    return NextResponse.json({
      actionsLast7d: Number(actions7),
      actionsLast30d: a30,
      pendingReview: Number(pending),
      openRate30d: a30 > 0 ? Number(opened) / a30 : 0,
      clickRate30d: a30 > 0 ? Number(clicked) / a30 : 0,
      conversionRate30d: a30 > 0 ? Number(converted) / a30 : 0,
      revenueSavedEur30d:
        Number(savedEur) > 0 ? Number(savedEur) : Number(converted) * PRO_MONTHLY_EUR,
      segmentsLast7d: segments.map((s) => ({
        segment: String(s.segment),
        count: Number(s.count),
      })),
      timeseries: byDay.map((r) => ({
        date: String(r.d),
        count: Number(r.c),
      })),
    });
  } catch (err) {
    console.error("Retention KPIs error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
