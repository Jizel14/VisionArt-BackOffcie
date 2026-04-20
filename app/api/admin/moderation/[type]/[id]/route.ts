import { NextResponse } from "next/server";
import pool from "@/lib/db";

type Params = Promise<{ type: string; id: string }>;

export async function PATCH(
  req: Request,
  { params }: { params: Params }
) {
  try {
    const { type, id } = await params;
    const { action } = await req.json() as { action: "approve" | "reject" };

    if (!["approve", "reject"].includes(action)) {
      return NextResponse.json({ error: "action must be 'approve' or 'reject'" }, { status: 400 });
    }

    const status = action === "approve" ? "approved" : "rejected";

    if (type === "artwork") {
      const [result] = await pool.query(
        `UPDATE artworks SET moderation_status = ?, updated_at = NOW() WHERE id = ?`,
        [status, id]
      );
      const r = result as { affectedRows: number };
      if (r.affectedRows === 0) {
        return NextResponse.json({ error: "Artwork not found" }, { status: 404 });
      }
    } else if (type === "comment") {
      const [result] = await pool.query(
        `UPDATE artwork_comments SET moderation_status = ?, updated_at = NOW() WHERE id = ?`,
        [status, id]
      );
      const r = result as { affectedRows: number };
      if (r.affectedRows === 0) {
        return NextResponse.json({ error: "Comment not found" }, { status: 404 });
      }
    } else {
      return NextResponse.json({ error: "type must be 'artwork' or 'comment'" }, { status: 400 });
    }

    return NextResponse.json({ success: true, type, id, status });
  } catch (err) {
    console.error("Moderation action error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
