import { NextResponse } from "next/server";
import pool from "@/lib/db";
import type { RowDataPacket } from "mysql2";

export async function GET() {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT id, email, name, created_at
       FROM users
       ORDER BY created_at DESC
       LIMIT 8`
    );
    return NextResponse.json({ users: rows });
  } catch (err) {
    console.error("Dashboard recent error:", err);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
