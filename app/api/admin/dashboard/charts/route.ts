import { NextResponse } from "next/server";
import pool from "@/lib/db";
import type { RowDataPacket } from "mysql2";
import {
  mockGenerationsPerDay,
  mockStyleDistribution,
  mockRevenueData,
} from "@/lib/mock-data";

export async function GET() {
  try {
    // Real: user growth over 30 days
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT DATE(created_at) AS date, COUNT(*) AS count
       FROM users
       WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
       GROUP BY DATE(created_at)
       ORDER BY date ASC`
    );

    // Fill in missing days
    const userGrowth: { date: string; count: number }[] = [];
    const map = new Map(
      (rows as { date: string; count: number }[]).map((r) => [
        new Date(r.date).toISOString().slice(0, 10),
        Number(r.count),
      ])
    );
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      userGrowth.push({ date: key, count: map.get(key) || 0 });
    }

    return NextResponse.json({
      userGrowth,
      generationsPerDay: mockGenerationsPerDay,
      styleDistribution: mockStyleDistribution,
      revenueData: mockRevenueData,
    });
  } catch (err) {
    console.error("Dashboard charts error:", err);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
