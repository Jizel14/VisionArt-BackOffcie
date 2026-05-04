#!/usr/bin/env node
/**
 * Deletes expired refresh token rows (expires_at < NOW()).
 *
 * Usage:
 *   node scripts/cleanup-expired-refresh-tokens.js
 */
const mysql = require("mysql2/promise");

async function main() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "visionart",
    waitForConnections: true,
    connectionLimit: 4,
  });

  const [result] = await pool.query(
    "DELETE FROM refresh_tokens WHERE expires_at < NOW()"
  );
  await pool.end();
  console.log(
    JSON.stringify(
      { deleted: result.affectedRows ?? null, timestamp: new Date().toISOString() },
      null,
      2
    )
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

