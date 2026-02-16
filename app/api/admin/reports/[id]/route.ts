import { NextResponse } from "next/server";
import pool from "@/lib/db";
import type { RowDataPacket } from "mysql2";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { status, adminNote } = await req.json();

    const allowed = ["pending", "reviewing", "resolved", "dismissed"];
    if (!allowed.includes(status)) {
      return NextResponse.json(
        { error: "Statut invalide" },
        { status: 400 }
      );
    }

    await pool.query(
      `UPDATE reports SET status = ?, admin_note = ?, updated_at = NOW() WHERE id = ?`,
      [status, adminNote || null, id]
    );

    // Return updated report
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT r.*, u.name AS user_name, u.email AS user_email
       FROM reports r LEFT JOIN users u ON r.user_id = u.id WHERE r.id = ?`,
      [id]
    );

    if (!rows.length) {
      return NextResponse.json(
        { error: "Signalement introuvable" },
        { status: 404 }
      );
    }

    return NextResponse.json(rows[0]);
  } catch (err) {
    console.error("Report update error:", err);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
