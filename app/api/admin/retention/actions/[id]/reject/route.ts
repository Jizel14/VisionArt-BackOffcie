import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await ctx.params;
    const body = (await req.json().catch(() => ({}))) as { reason?: string };
    const reason = (body.reason || "").slice(0, 400);

    await pool.query(
      `UPDATE retention_actions
       SET status = 'REJECTED',
           reviewed_at = NOW(),
           context = JSON_SET(COALESCE(context, JSON_OBJECT()), '$.reviewReason', ?)
       WHERE id = ?`,
      [reason || null, id],
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Retention reject error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

