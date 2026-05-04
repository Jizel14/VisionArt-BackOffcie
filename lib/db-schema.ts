import pool from "@/lib/db";

type ColumnRow = {
  table_name: string;
  column_name: string;
  ordinal_position: number;
};

let cachedSchema: string | null = null;
let cachedAt = 0;

const CACHE_MS = 60_000; // 1 minute
const MAX_CHARS = 20_000; // allow full schema (20+ tables) for tinyllama

export async function getDatabaseSchemaSummary(): Promise<string> {
  const now = Date.now();
  if (cachedSchema && now - cachedAt < CACHE_MS) return cachedSchema;

  const [rows] = await pool.query(
    `
    SELECT table_name, column_name, ordinal_position
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
    ORDER BY table_name, ordinal_position
    `
  );

  const cols = rows as ColumnRow[];
  const byTable = new Map<string, string[]>();
  for (const r of cols) {
    if (!byTable.has(r.table_name)) byTable.set(r.table_name, []);
    byTable.get(r.table_name)!.push(r.column_name);
  }

  const parts: string[] = [];
  for (const [table, columns] of byTable.entries()) {
    parts.push(`${table}(${columns.join(",")})`);
  }

  let schema = `Database schema (${byTable.size} tables): ${parts.join("; ")}.`;
  if (schema.length > MAX_CHARS) {
    schema = schema.slice(0, MAX_CHARS) + "… (truncated)";
  }

  cachedSchema = schema;
  cachedAt = now;
  return schema;
}

