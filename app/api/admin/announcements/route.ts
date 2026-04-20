import { NextResponse } from "next/server";
import pool from "@/lib/db";

// GET — return the current active announcement (used by mobile via backend proxy)
export async function GET() {
  try {
    const [rows] = await pool.query(
      `SELECT id, message, created_at FROM announcements WHERE is_active = 1 ORDER BY created_at DESC LIMIT 1`
    );
    const items = rows as { id: string; message: string; created_at: string }[];
    return NextResponse.json(items[0] ?? null);
  } catch {
    return NextResponse.json(null);
  }
}

// POST — admin sets a new active announcement (replaces current one)
export async function POST(req: Request) {
  try {
    const { message } = await req.json();
    if (!message?.trim()) {
      return NextResponse.json({ error: "Message requis" }, { status: 400 });
    }

    // Ensure table exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS announcements (
        id CHAR(36) NOT NULL DEFAULT (UUID()),
        message TEXT NOT NULL,
        is_active TINYINT(1) NOT NULL DEFAULT 1,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id)
      )
    `);

    // Deactivate all previous announcements
    await pool.query(`UPDATE announcements SET is_active = 0`);

    // Insert new one
    await pool.query(
      `INSERT INTO announcements (message, is_active) VALUES (?, 1)`,
      [message.trim()]
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Announcement error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// DELETE — clear the active announcement
export async function DELETE() {
  try {
    await pool.query(`UPDATE announcements SET is_active = 0`);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Announcement delete error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
