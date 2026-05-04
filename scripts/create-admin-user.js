#!/usr/bin/env node
/**
 * Create an admin user in the shared `users` table for backoffice login.
 *
 * Uses:
 *  - DB_* env vars (same as backoffice)
 *  - ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME (optional)
 *
 * Example:
 *   ADMIN_EMAIL=admin@visionart.app ADMIN_PASSWORD='Admin123!' ADMIN_NAME='Backoffice Admin' \
 *   node backoffice/scripts/create-admin-user.js
 */
const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

function required(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

function optional(name, fallback) {
  return process.env[name] ?? fallback;
}

async function main() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "visionart",
    waitForConnections: true,
    connectionLimit: 2,
  });

  const email = required("ADMIN_EMAIL").toLowerCase();
  const password = required("ADMIN_PASSWORD");
  const name = optional("ADMIN_NAME", "Backoffice Admin");

  const passwordHash = await bcrypt.hash(password, 10);
  const id = crypto.randomUUID();

  // Discover which columns exist so we can insert safely across schema variants.
  const [cols] = await pool.query(
    `
    SELECT COLUMN_NAME
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users'
    `
  );
  const existing = new Set(cols.map((r) => r.COLUMN_NAME));

  // Core fields
  const fields = [];
  const values = [];

  function add(col, val) {
    if (!existing.has(col)) return;
    fields.push(col);
    values.push(val);
  }

  add("id", id);
  add("email", email);
  add("password_hash", passwordHash);
  add("name", name);
  add("is_admin", 1);

  // Optional fields (only if they exist)
  add("bio", null);
  add("avatar_url", null);
  add("phoneNumber", null);
  add("website", null);
  add("followers_count", 0);
  add("following_count", 0);
  add("public_generations_count", 0);
  add("is_verified", 1);
  add("is_private_account", 0);

  // Timestamps if present and not auto-managed
  const now = new Date();
  add("created_at", now);
  add("updated_at", now);

  // Basic safety checks
  if (!existing.has("email")) throw new Error("users.email column not found");
  if (!existing.has("password_hash")) throw new Error("users.password_hash column not found");
  if (!existing.has("is_admin")) throw new Error("users.is_admin column not found");

  // If user already exists, just flip admin flag (and optionally reset password).
  const [existingRows] = await pool.query(
    "SELECT id, email, is_admin FROM users WHERE email = ? LIMIT 1",
    [email]
  );
  const current = existingRows[0];

  if (current) {
    await pool.query("UPDATE users SET is_admin = 1 WHERE email = ?", [email]);
    // Only reset password if column exists.
    if (existing.has("password_hash")) {
      await pool.query("UPDATE users SET password_hash = ? WHERE email = ?", [
        passwordHash,
        email,
      ]);
    }
    await pool.end();
    console.log(
      JSON.stringify(
        {
          action: "updated_existing_user",
          id: String(current.id),
          email,
          is_admin: 1,
        },
        null,
        2
      )
    );
    return;
  }

  const placeholders = fields.map(() => "?").join(", ");
  const sql = `INSERT INTO users (${fields.join(", ")}) VALUES (${placeholders})`;
  await pool.query(sql, values);
  await pool.end();

  console.log(
    JSON.stringify(
      {
        action: "created_user",
        id,
        email,
        is_admin: 1,
      },
      null,
      2
    )
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

