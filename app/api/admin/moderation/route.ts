import { NextResponse } from "next/server";
import pool from "@/lib/db";
import type { RowDataPacket } from "mysql2";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const pageSize = Math.min(50, Math.max(1, parseInt(searchParams.get("pageSize") || "20", 10)));
    const offset = (page - 1) * pageSize;

    // Pending artworks
    const [artworkRows] = await pool.query<RowDataPacket[]>(
      `SELECT a.id, a.title AS content_text, a.description, a.image_url,
              a.moderation_status, a.moderation_reason, a.created_at,
              u.id AS user_id, u.name AS user_name, u.email AS user_email,
              'artwork' AS content_type
       FROM artworks a
       LEFT JOIN users u ON a.user_id = u.id
       WHERE a.moderation_status = 'pending_review'
       ORDER BY a.created_at DESC`
    );

    // Pending comments
    const [commentRows] = await pool.query<RowDataPacket[]>(
      `SELECT c.id, c.content AS content_text, NULL AS description, NULL AS image_url,
              c.moderation_status, c.moderation_reason, c.created_at,
              u.id AS user_id, u.name AS user_name, u.email AS user_email,
              'comment' AS content_type
       FROM artwork_comments c
       LEFT JOIN users u ON c.user_id = u.id
       WHERE c.moderation_status = 'pending_review'
       ORDER BY c.created_at DESC`
    );

    const all = [...(artworkRows as Record<string, unknown>[]), ...(commentRows as Record<string, unknown>[])]
      .sort((a, b) => new Date(b.created_at as string).getTime() - new Date(a.created_at as string).getTime());

    const total = all.length;
    const items = all.slice(offset, offset + pageSize).map((r) => ({
      id: r.id,
      contentType: r.content_type,
      contentText: r.content_text || r.description || "(no text)",
      imageUrl: r.image_url ?? null,
      moderationStatus: r.moderation_status,
      moderationReason: r.moderation_reason ?? null,
      createdAt: r.created_at,
      author: r.user_id
        ? { id: r.user_id, name: r.user_name, email: r.user_email }
        : null,
    }));

    return NextResponse.json({ items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
  } catch (err) {
    console.error("Moderation list error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
