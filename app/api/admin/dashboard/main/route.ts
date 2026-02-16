import { NextResponse } from "next/server";
import pool from "@/lib/db";
import type { RowDataPacket } from "mysql2";

export async function GET() {
  try {
    // Real data — users
    const [[{ totalUsers }]] = await pool.query<RowDataPacket[]>(
      "SELECT COUNT(*) AS totalUsers FROM users"
    );

    const today = new Date().toISOString().slice(0, 10);
    const [[{ newUsersToday }]] = await pool.query<RowDataPacket[]>(
      "SELECT COUNT(*) AS newUsersToday FROM users WHERE DATE(created_at) = ?",
      [today]
    );

    const [[{ activeUsers24h }]] = await pool.query<RowDataPacket[]>(
      "SELECT COUNT(*) AS activeUsers24h FROM users WHERE updated_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)"
    );

    // Mock data for the rest
    return NextResponse.json({
      totalUsers: Number(totalUsers),
      newUsersToday: Number(newUsersToday),
      activeUsers24h: Number(activeUsers24h),
      totalGenerations: 12847,
      newGenerationsToday: 234,
      revenue: 28450,
      revenueGrowth: 12.5,
      conversionRate: 3.8,
      avgGenerationTime: 4.2,
    });
  } catch (err) {
    console.error("Dashboard main error:", err);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
