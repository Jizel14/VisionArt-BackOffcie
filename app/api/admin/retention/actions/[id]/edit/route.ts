import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await ctx.params;
    const body = (await req.json()) as {
      subject?: string;
      body?: string;
      cta_label?: string;
    };

    // Update only provided fields inside the JSON payload
    const sets: string[] = [];
    const params: (string | number | null)[] = [];

    if (typeof body.subject === "string") {
      sets.push("payload = JSON_SET(payload, '$.subject', ?)");
      params.push(body.subject.slice(0, 120));
    }
    if (typeof body.body === "string") {
      sets.push("payload = JSON_SET(payload, '$.body', ?)");
      params.push(body.body.slice(0, 600));
    }
    if (typeof body.cta_label === "string") {
      sets.push("payload = JSON_SET(payload, '$.cta_label', ?)");
      params.push(body.cta_label.slice(0, 40));
    }

    if (sets.length === 0) {
      return NextResponse.json({ error: "Aucun champ à modifier" }, { status: 400 });
    }

    params.push(id);

    await pool.query(
      `UPDATE retention_actions
       SET ${sets.join(", ")},
           reviewed_at = NOW()
       WHERE id = ?`,
      params,
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Retention edit error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

