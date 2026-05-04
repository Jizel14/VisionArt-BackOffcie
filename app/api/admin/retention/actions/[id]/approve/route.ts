import { NextResponse } from "next/server";
import pool from "@/lib/db";

/**
 * 2-token architecture friendly:
 * We only flip the action in DB to APPROVED.
 * Backend has a cron that dispatches APPROVED unsent actions.
 */
export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params;

    await pool.query(
      `UPDATE retention_actions SET status = 'APPROVED', reviewed_at = NOW() WHERE id = ?`,
      [id]
    );
    return NextResponse.json({ ok: true, queued: true });
  } catch (err) {
    console.error("Retention approve error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
