import { NextResponse } from "next/server";
import pool from "@/lib/db";
import type { RowDataPacket } from "mysql2";

export async function GET() {
  try {
    const [userRows] = await pool.query<RowDataPacket[]>(
      `SELECT DATE(created_at) AS date, COUNT(*) AS count
       FROM users
       WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
       GROUP BY DATE(created_at)
       ORDER BY date ASC`
    );
    const userMap = new Map(
      (userRows as { date: string; count: number }[]).map((r) => [
        new Date(r.date).toISOString().slice(0, 10), Number(r.count),
      ])
    );
    const userGrowth: { date: string; count: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      userGrowth.push({ date: key, count: userMap.get(key) || 0 });
    }

    const [genRows] = await pool.query<RowDataPacket[]>(
      `SELECT DATE(created_at) AS date, COUNT(*) AS count
       FROM artworks
       WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
       GROUP BY DATE(created_at)
       ORDER BY date ASC`
    );
    const genMap = new Map(
      (genRows as { date: string; count: number }[]).map((r) => [
        new Date(r.date).toISOString().slice(0, 10), Number(r.count),
      ])
    );
    const generationsPerDay: { date: string; count: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      generationsPerDay.push({ date: key, count: genMap.get(key) || 0 });
    }

    // Artwork breakdown: public vs private vs NSFW
    const [visRows] = await pool.query<RowDataPacket[]>(
      `SELECT
         SUM(is_public = 1 AND is_nsfw = 0) AS public_count,
         SUM(is_public = 0) AS private_count,
         SUM(is_nsfw = 1) AS nsfw_count
       FROM artworks`
    );
    const vis = visRows[0] as Record<string, unknown>;
    const styleDistribution = [
      { name: "Public", value: Number(vis.public_count) || 0 },
      { name: "Privé", value: Number(vis.private_count) || 0 },
      { name: "NSFW", value: Number(vis.nsfw_count) || 0 },
    ].filter((s) => s.value > 0);

    return NextResponse.json({ userGrowth, generationsPerDay, styleDistribution });
  } catch (err) {
    console.error("Dashboard charts error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
