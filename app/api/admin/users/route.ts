import { NextResponse } from "next/server";
import pool from "@/lib/db";
import type { RowDataPacket } from "mysql2";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const pageSize = Math.min(50, Math.max(1, parseInt(searchParams.get("pageSize") || "15", 10)));
    const search = (searchParams.get("search") || "").trim();
    const isAdmin = searchParams.get("isAdmin") || "";
    const sort = searchParams.get("sort") || "created_at";
    const dir = searchParams.get("dir") === "asc" ? "ASC" : "DESC";

    const allowedSort = ["name", "email", "created_at", "updated_at", "followers_count", "public_generations_count"];
    const sortCol = allowedSort.includes(sort) ? sort : "created_at";

    let where = "1=1";
    const params: (string | number)[] = [];

    if (search) {
      where += " AND (name LIKE ? OR email LIKE ?)";
      params.push(`%${search}%`, `%${search}%`);
    }
    if (isAdmin === "true") {
      where += " AND is_admin = 1";
    } else if (isAdmin === "false") {
      where += " AND is_admin = 0";
    }

    const [[{ total }]] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS total FROM users WHERE ${where}`, params
    );

    const totalCount = Number(total);
    const totalPages = Math.ceil(totalCount / pageSize);
    const offset = (page - 1) * pageSize;

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT id, email, name, bio, avatar_url, phoneNumber, website,
              followers_count, following_count, public_generations_count,
              is_verified, is_private_account, is_admin, created_at, updated_at
       FROM users
       WHERE ${where}
       ORDER BY ${sortCol} ${dir}
       LIMIT ? OFFSET ?`,
      [...params, pageSize, offset]
    );

    return NextResponse.json({ items: rows, total: totalCount, page, pageSize, totalPages });
  } catch (err) {
    console.error("Users list error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
