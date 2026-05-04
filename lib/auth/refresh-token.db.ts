import pool from "@/lib/db";

export type RefreshTokenRow = {
  id: number;
  token_hash: string;
  admin_id: string;
  family_id: string;
  device_info: string | null;
  ip_address: string | null;
  is_used: number; // mysql boolean is 0/1
  is_revoked: number;
  expires_at: string; // DATETIME
  created_at: string;
};

function timingSafeEqualHex(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "hex");
  const bufB = Buffer.from(b, "hex");
  if (bufA.length !== bufB.length) return false;
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const c = require("crypto") as typeof import("crypto");
  return c.timingSafeEqual(bufA, bufB);
}

export async function storeRefreshToken(params: {
  tokenHash: string;
  adminId: string;
  familyId: string;
  deviceInfo: string | null;
  ipAddress: string | null;
}): Promise<void> {
  const days = Number(process.env.REFRESH_TOKEN_EXPIRY_DAYS ?? 7);
  await pool.query(
    `INSERT INTO refresh_tokens
      (token_hash, admin_id, family_id, device_info, ip_address, expires_at)
     VALUES (?, ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL ? DAY))`,
    [
      params.tokenHash,
      params.adminId,
      params.familyId,
      params.deviceInfo,
      params.ipAddress,
      days,
    ]
  );
}

export async function findRefreshToken(
  tokenHash: string
): Promise<RefreshTokenRow | null> {
  const [rows] = await pool.query(
    `SELECT *
     FROM refresh_tokens
     WHERE token_hash = ? AND is_revoked = false
     LIMIT 1`,
    [tokenHash]
  );

  const r = (rows as RefreshTokenRow[])[0];
  if (!r) return null;

  // Constant-time compare (defense in depth; SQL equality already matched).
  if (!timingSafeEqualHex(r.token_hash, tokenHash)) return null;

  return r;
}

export async function markTokenAsUsed(tokenHash: string): Promise<void> {
  await pool.query(`UPDATE refresh_tokens SET is_used = true WHERE token_hash = ?`, [
    tokenHash,
  ]);
}

export async function revokeFamily(familyId: string): Promise<void> {
  await pool.query(
    `UPDATE refresh_tokens SET is_revoked = true WHERE family_id = ?`,
    [familyId]
  );
}

export async function deleteExpiredTokens(): Promise<number> {
  const [result] = await pool.query(
    `DELETE FROM refresh_tokens WHERE expires_at < NOW()`
  );
  // mysql2 OkPacket affectedRows
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (result as any).affectedRows ?? 0;
}

