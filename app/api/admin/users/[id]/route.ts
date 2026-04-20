import { NextResponse } from "next/server";
import pool from "@/lib/db";
import type { RowDataPacket } from "mysql2";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT id, email, name, bio, avatar_url, phoneNumber, website,
              followers_count, following_count, public_generations_count,
              is_verified, is_private_account, is_admin, created_at, updated_at
       FROM users WHERE id = ?`,
      [id]
    );
    if (!rows.length) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
    return NextResponse.json(rows[0]);
  } catch (err) {
    console.error("User detail error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
