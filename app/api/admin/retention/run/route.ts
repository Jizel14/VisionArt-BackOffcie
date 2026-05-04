import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as { dryRun?: boolean };

    // 2-token architecture friendly:
    // Backoffice enqueues a manual run in DB (status=QUEUED).
    // Backend cron will claim and execute it (no service-to-service token).
    await pool.query(
      `INSERT INTO retention_runs (started_at, status, summary)
       VALUES (NOW(), 'QUEUED', JSON_OBJECT('trigger','backoffice-run','dryRun', ?))`,
      [!!body.dryRun],
    );

    return NextResponse.json({ ok: true, queued: true });
  } catch (err) {
    console.error("Retention run error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

