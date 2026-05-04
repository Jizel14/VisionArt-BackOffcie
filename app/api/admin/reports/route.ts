import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { normalizeDbUuid } from "@/lib/db-uuid";
import type { RowDataPacket } from "mysql2";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const pageSize = Math.min(
      50,
      Math.max(1, parseInt(searchParams.get("pageSize") || "15", 10))
    );
    const type = searchParams.get("type") || "";
    const status = searchParams.get("status") || "";
    const search = (searchParams.get("search") || "").trim();

    let where = "1=1";
    const params: (string | number)[] = [];

    if (type) {
      where += " AND r.type = ?";
      params.push(type);
    }
    if (status) {
      where += " AND r.status = ?";
      params.push(status);
    }
    if (search) {
      where += " AND (r.subject LIKE ? OR r.description LIKE ? OR u.name LIKE ? OR u.email LIKE ?)";
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    const [[{ total }]] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS total FROM reports r LEFT JOIN users u ON r.user_id = u.id WHERE ${where}`,
      params
    );

    const totalCount = Number(total);
    const totalPages = Math.ceil(totalCount / pageSize);
    const offset = (page - 1) * pageSize;

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT r.id, r.type, r.target_id, r.subject, r.description, r.image_url,
              r.status, r.admin_note, r.created_at, r.updated_at,
              u.id AS user_id, u.name AS user_name, u.email AS user_email
       FROM reports r
       LEFT JOIN users u ON r.user_id = u.id
       WHERE ${where}
       ORDER BY r.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, pageSize, offset]
    );

    const items = (rows as Record<string, unknown>[]).map((r) => ({
      id: normalizeDbUuid(r.id) || r.id,
      type: r.type,
      targetId: (() => {
        const t = normalizeDbUuid(r.target_id);
        return t || null;
      })(),
      subject: r.subject,
      description: r.description,
      imageUrl: r.image_url,
      status: r.status,
      adminNote: r.admin_note,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      user: r.user_id
        ? {
            id: normalizeDbUuid(r.user_id) || r.user_id,
            name: r.user_name,
            email: r.user_email,
          }
        : null,
    }));

    return NextResponse.json({
      items,
      total: totalCount,
      page,
      pageSize,
      totalPages,
    });
  } catch (err) {
    console.error("Reports list error:", err);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
