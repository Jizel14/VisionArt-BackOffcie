import { NextResponse } from "next/server";
import pool from "@/lib/db";
import type { RowDataPacket } from "mysql2";

export async function GET() {
  try {
    const today = new Date().toISOString().slice(0, 10);

    const [[{ totalUsers }]] = await pool.query<RowDataPacket[]>(
      "SELECT COUNT(*) AS totalUsers FROM users"
    );
    const [[{ newUsersToday }]] = await pool.query<RowDataPacket[]>(
      "SELECT COUNT(*) AS newUsersToday FROM users WHERE DATE(created_at) = ?", [today]
    );
    const [[{ activeUsers24h }]] = await pool.query<RowDataPacket[]>(
      "SELECT COUNT(*) AS activeUsers24h FROM users WHERE updated_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)"
    );
    const [[{ totalGenerations }]] = await pool.query<RowDataPacket[]>(
      "SELECT COUNT(*) AS totalGenerations FROM artworks"
    );
    const [[{ newGenerationsToday }]] = await pool.query<RowDataPacket[]>(
      "SELECT COUNT(*) AS newGenerationsToday FROM artworks WHERE DATE(created_at) = ?", [today]
    );
    const [[{ pendingReports }]] = await pool.query<RowDataPacket[]>(
      "SELECT COUNT(*) AS pendingReports FROM reports WHERE status = 'pending'"
    );
    const [[{ pendingModeration }]] = await pool.query<RowDataPacket[]>(
      "SELECT (SELECT COUNT(*) FROM artworks WHERE moderation_status = 'pending_review') + (SELECT COUNT(*) FROM artwork_comments WHERE moderation_status = 'pending_review') AS pendingModeration"
    );

    return NextResponse.json({
      totalUsers: Number(totalUsers),
      newUsersToday: Number(newUsersToday),
      activeUsers24h: Number(activeUsers24h),
      totalGenerations: Number(totalGenerations),
      newGenerationsToday: Number(newGenerationsToday),
      pendingReports: Number(pendingReports),
      pendingModeration: Number(pendingModeration),
    });
  } catch (err) {
    console.error("Dashboard main error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
