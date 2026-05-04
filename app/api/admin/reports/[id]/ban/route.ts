import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { extractUuidsFromText, normalizeDbUuid } from "@/lib/db-uuid";
import type { RowDataPacket } from "mysql2";

const ALLOWED_MINUTES = new Set([1, 5, 10]);

function uuidToHex32(uuid: string): string | null {
  const h = uuid.replace(/-/g, "").toLowerCase();
  return /^[0-9a-f]{32}$/.test(h) ? h : null;
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const minutes = Number(body.minutes);
    if (!ALLOWED_MINUTES.has(minutes)) {
      return NextResponse.json(
        { error: "Durée invalide (1, 5 ou 10 minutes)" },
        { status: 400 }
      );
    }

    /** Optional: admin forces the account UUID (when target_id is stale / wrong DB). */
    const forcedRaw =
      typeof body.banUserId === "string" ? normalizeDbUuid(body.banUserId) : "";

    const [repRows] = await pool.query<RowDataPacket[]>(
      `SELECT id, type, target_id, subject, description FROM reports WHERE id = ?`,
      [id]
    );
    if (!repRows.length) {
      return NextResponse.json(
        { error: "Signalement introuvable" },
        { status: 404 }
      );
    }
    const report = repRows[0] as {
      type: string;
      target_id: unknown;
      subject: string | null;
      description: string | null;
    };

    let userIdToBan: string | null = null;

    if (forcedRaw) {
      const [forcedRows] = await pool.query<RowDataPacket[]>(
        `SELECT id FROM users WHERE LOWER(TRIM(CAST(id AS CHAR(64)))) = LOWER(?) LIMIT 1`,
        [forcedRaw]
      );
      if (!forcedRows.length) {
        const hex = uuidToHex32(forcedRaw);
        if (hex) {
          const [binUsers] = await pool.query<RowDataPacket[]>(
            `SELECT id FROM users WHERE id = UNHEX(?) LIMIT 1`,
            [hex]
          );
          if (binUsers.length) {
            userIdToBan = normalizeDbUuid((binUsers[0] as { id: unknown }).id);
          }
        }
      } else {
        userIdToBan = normalizeDbUuid((forcedRows[0] as { id: unknown }).id);
      }
      if (!userIdToBan) {
        return NextResponse.json(
          { error: "banUserId : aucun utilisateur avec cet ID." },
          { status: 400 }
        );
      }
    }

    const rtype = String(report.type ?? "")
      .toLowerCase()
      .trim();

    const findUserByTargetId = async (tid: string): Promise<string | null> => {
      const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT id FROM users WHERE LOWER(TRIM(CAST(id AS CHAR(64)))) = LOWER(TRIM(?)) LIMIT 1`,
        [tid]
      );
      if (rows.length) {
        return normalizeDbUuid((rows[0] as { id: unknown }).id);
      }
      const hex = uuidToHex32(tid);
      if (hex) {
        const [binRows] = await pool.query<RowDataPacket[]>(
          `SELECT id FROM users WHERE id = UNHEX(?) LIMIT 1`,
          [hex]
        );
        if (binRows.length) {
          return normalizeDbUuid((binRows[0] as { id: unknown }).id);
        }
      }
      return null;
    };

    const findArtworkAuthor = async (tid: string): Promise<string | null> => {
      const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT user_id FROM artworks WHERE LOWER(TRIM(CAST(id AS CHAR(64)))) = LOWER(TRIM(?)) LIMIT 1`,
        [tid]
      );
      if (rows.length) {
        return normalizeDbUuid((rows[0] as { user_id: unknown }).user_id);
      }
      const hex = uuidToHex32(tid);
      if (hex) {
        const [binRows] = await pool.query<RowDataPacket[]>(
          `SELECT user_id FROM artworks WHERE id = UNHEX(?) LIMIT 1`,
          [hex]
        );
        if (binRows.length) {
          return normalizeDbUuid((binRows[0] as { user_id: unknown }).user_id);
        }
      }
      return null;
    };

    /** Listing id or linked artwork_id → seller (marketplace). */
    const findMarketplaceSeller = async (tid: string): Promise<string | null> => {
      try {
        const [rows] = await pool.query<RowDataPacket[]>(
          `SELECT seller_id FROM marketplace_listings
           WHERE LOWER(TRIM(CAST(id AS CHAR(64)))) = LOWER(TRIM(?))
              OR LOWER(TRIM(CAST(artwork_id AS CHAR(64)))) = LOWER(TRIM(?))
           LIMIT 1`,
          [tid, tid]
        );
        if (rows.length) {
          return normalizeDbUuid((rows[0] as { seller_id: unknown }).seller_id);
        }
        const hex = uuidToHex32(tid);
        if (hex) {
          const [binRows] = await pool.query<RowDataPacket[]>(
            `SELECT seller_id FROM marketplace_listings
             WHERE id = UNHEX(?) OR artwork_id = UNHEX(?)
             LIMIT 1`,
            [hex, hex]
          );
          if (binRows.length) {
            return normalizeDbUuid((binRows[0] as { seller_id: unknown }).seller_id);
          }
        }
      } catch {
        /* table missing in older schemas */
      }
      return null;
    };

    const resolveOne = async (tid: string): Promise<string | null> => {
      if (!tid) return null;
      if (rtype === "user") {
        return (
          (await findUserByTargetId(tid)) ??
          (await findArtworkAuthor(tid)) ??
          (await findMarketplaceSeller(tid))
        );
      }
      if (rtype === "artwork") {
        return (
          (await findArtworkAuthor(tid)) ??
          (await findUserByTargetId(tid)) ??
          (await findMarketplaceSeller(tid))
        );
      }
      return (
        (await findUserByTargetId(tid)) ??
        (await findArtworkAuthor(tid)) ??
        (await findMarketplaceSeller(tid))
      );
    };

    if (!userIdToBan) {
      const candidates: string[] = [];
      const primary = normalizeDbUuid(report.target_id);
      if (primary) candidates.push(primary);
      for (const u of extractUuidsFromText(report.subject, report.description)) {
        const n = u.trim();
        if (n && !candidates.some((c) => c.toLowerCase() === n.toLowerCase())) {
          candidates.push(n);
        }
      }

      if (candidates.length === 0) {
        return NextResponse.json(
          {
            error:
              "Ce signalement n’a pas d’ID cible (target_id). Utilisez le champ « UUID utilisateur » dans le dashboard ou vérifiez que l’API et le backoffice pointent vers la même base MySQL.",
          },
          { status: 400 }
        );
      }

      for (const c of candidates) {
        userIdToBan = await resolveOne(c);
        if (userIdToBan) break;
      }
    }

    if (!userIdToBan) {
      return NextResponse.json(
        {
          error:
            "Cible introuvable : cet UUID n’existe pas en users / artworks / listings sur la base du backoffice (œuvre supprimée après signalement, ou mauvaise base MySQL vs l’API). Renseignez l’UUID du compte dans le champ prévu ou vérifiez DB_HOST / DB_NAME.",
          triedTargets: candidatesFromReport(report),
        },
        { status: 400 }
      );
    }

    const [urows] = await pool.query<RowDataPacket[]>(
      `SELECT id FROM users WHERE LOWER(TRIM(CAST(id AS CHAR(64)))) = LOWER(?) LIMIT 1`,
      [userIdToBan]
    );
    let canonicalUserId = urows.length
      ? normalizeDbUuid((urows[0] as { id: unknown }).id)
      : null;
    if (!canonicalUserId) {
      const hex = uuidToHex32(userIdToBan);
      if (hex) {
        const [binU] = await pool.query<RowDataPacket[]>(
          `SELECT id FROM users WHERE id = UNHEX(?) LIMIT 1`,
          [hex]
        );
        if (binU.length) {
          canonicalUserId = normalizeDbUuid((binU[0] as { id: unknown }).id);
        }
      }
    }
    if (!canonicalUserId) {
      return NextResponse.json(
        { error: "Utilisateur introuvable" },
        { status: 404 }
      );
    }

    await pool.query(
      `UPDATE users SET banned_until = DATE_ADD(
        GREATEST(NOW(), COALESCE(banned_until, '1970-01-01 00:00:00')),
        INTERVAL ? MINUTE
      ), updated_at = NOW() WHERE id = ?`,
      [minutes, canonicalUserId]
    );

    const [updated] = await pool.query<RowDataPacket[]>(
      `SELECT id, email, name, banned_until FROM users WHERE id = ?`,
      [canonicalUserId]
    );

    return NextResponse.json({
      success: true,
      bannedUserId: canonicalUserId,
      minutes,
      user: updated[0],
    });
  } catch (err) {
    console.error("Ban from report error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

function candidatesFromReport(report: {
  target_id: unknown;
  subject: string | null;
  description: string | null;
}): string[] {
  const candidates: string[] = [];
  const primary = normalizeDbUuid(report.target_id);
  if (primary) candidates.push(primary);
  for (const u of extractUuidsFromText(report.subject, report.description)) {
    if (!candidates.some((c) => c.toLowerCase() === u.toLowerCase())) {
      candidates.push(u);
    }
  }
  return candidates;
}
