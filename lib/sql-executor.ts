import pool from "@/lib/db";

const MAX_LIMIT = 500;
const MAX_MS = 10_000;

function normalizeSql(raw: string): string {
  return raw.trim().replace(/\s+/g, " ");
}

function firstDisallowedKeyword(sql: string): string | null {
  // Match whole keywords only (avoid false positives on substrings).
  // Disallowing these even inside CTEs.
  const m = sql.match(/\b(insert|update|delete|drop|alter|create|truncate|grant|revoke|set|call)\b/i);
  return m?.[1]?.toLowerCase() ?? null;
}

function enforceSelectOnly(sql: string) {
  const s = sql.trim().toLowerCase();
  if (s.startsWith("select ")) return;
  if (s.startsWith("with ")) return; // allow CTEs
  throw new Error("Only SELECT queries are allowed.");
}

function enforceSingleStatement(sql: string) {
  // No multi-statement; allow a single trailing semicolon.
  const stripped = sql.trim().replace(/;$/, "");
  if (stripped.includes(";")) throw new Error("Multiple statements are not allowed.");
  // Disallow SQL comments.
  if (/(--|\/\*|\*\/)/.test(stripped)) throw new Error("Comments are not allowed.");
}

function enforceLimit(sql: string): string {
  const stripped = sql.trim().replace(/;$/, "");
  const lower = stripped.toLowerCase();

  const limitMatch = lower.match(/\blimit\s+(\d+)\b/);
  if (!limitMatch) return `${stripped} LIMIT ${MAX_LIMIT}`;

  const n = Number(limitMatch[1]);
  if (!Number.isFinite(n) || n <= 0) return `${stripped} LIMIT ${MAX_LIMIT}`;
  if (n > MAX_LIMIT) return stripped.replace(/\blimit\s+\d+\b/i, `LIMIT ${MAX_LIMIT}`);
  return stripped;
}

export function validateAndPrepareSql(rawSql: string): string {
  const normalized = normalizeSql(rawSql);
  enforceSingleStatement(normalized);
  enforceSelectOnly(normalized);
  const bad = firstDisallowedKeyword(normalized);
  if (bad) throw new Error(`Query contains a disallowed keyword: ${bad}`);
  return enforceLimit(normalized);
}

export async function executeSelect(sql: string): Promise<Record<string, unknown>[]> {
  const prepared = validateAndPrepareSql(sql);
  const [rows] = await pool.query({
    sql: prepared,
    timeout: MAX_MS,
  } as any);
  return rows as Record<string, unknown>[];
}

export function inferResultShape(sql: string, rows: Record<string, unknown>[]) {
  const columns = rows.length > 0 ? Object.keys(rows[0]) : [];

  // Metric: single row, single primitive value.
  if (rows.length === 1 && columns.length === 1) {
    const v = rows[0][columns[0]];
    if (typeof v === "number" || typeof v === "string") {
      return { kind: "metric" as const, metric: { label: columns[0], value: v } };
    }
  }

  // Bar chart: detect datetime-like x key + numeric y key.
  const timeKeys = ["created_at", "reg_date", "last_login", "date", "day", "month"];
  const xKey = columns.find((c) => timeKeys.includes(c.toLowerCase()));
  const yKey = columns.find((c) => typeof rows[0]?.[c] === "number");
  if (xKey && yKey && rows.length >= 2 && rows.length <= 50) {
    return { kind: "bar" as const, chart: { xKey, yKey, data: rows } };
  }

  // Table.
  return { kind: "table" as const, table: { columns, rows } };
}

