/**
 * Normalize UUID-like values from mysql2 (string, Buffer for BINARY(16), etc.).
 */
export function normalizeDbUuid(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") {
    const s = value.trim();
    return s;
  }
  if (Buffer.isBuffer(value)) {
    if (value.length === 16) {
      const h = value.toString("hex");
      return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20, 32)}`;
    }
    return value.toString("utf8").trim();
  }
  return String(value).trim();
}

const UUID_RE =
  /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi;

/** Extract UUIDs from free text (subject / description). */
export function extractUuidsFromText(...parts: (string | null | undefined)[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const p of parts) {
    if (!p) continue;
    const m = p.match(UUID_RE);
    if (!m) continue;
    for (const u of m) {
      const n = u.toLowerCase();
      if (!seen.has(n)) {
        seen.add(n);
        out.push(u);
      }
    }
  }
  return out;
}
