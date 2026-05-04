/**
 * Extract a single SELECT/WITH SQL statement from an LLM response.
 * Returns "" if no valid SQL statement is found - caller must handle this.
 */
export function extractSQL(raw: string): string {
  let text = (raw || "").trim();
  if (!text) return "";

  text = text.replace(/^```(?:sql)?\s*/i, "").replace(/```\s*$/i, "").trim();

  const candidates: string[] = [];

  const codeFenceMatch = text.match(/```(?:sql)?\s*([\s\S]*?)```/i);
  if (codeFenceMatch?.[1]) candidates.push(codeFenceMatch[1].trim());

  const dquoted = text.match(/"((?:SELECT|WITH)\b[^"]+)"/i);
  if (dquoted?.[1]) candidates.push(dquoted[1].trim());

  const squoted = text.match(/'((?:SELECT|WITH)\b[^']+)'/i);
  if (squoted?.[1]) candidates.push(squoted[1].trim());

  candidates.push(text);

  for (const candidate of candidates) {
    const sql = extractFromText(candidate);
    if (isValidSqlShape(sql)) return sql;
  }

  return "";
}

function extractFromText(text: string): string {
  const match = text.match(/\b(SELECT|WITH)\b[\s\S]+/i);
  if (!match) return "";

  let sql = match[0];

  const semiIdx = sql.indexOf(";");
  if (semiIdx !== -1) sql = sql.slice(0, semiIdx);

  const lines = sql.split("\n");
  const cleaned: string[] = [];
  for (const line of lines) {
    const t = line.trim();
    if (!t) {
      if (cleaned.length > 0) break;
      continue;
    }
    if (/^(--|\/\/|#)/.test(t)) continue;
    if (cleaned.length > 0 && /^(The|This|Here|Note|Example|Explanation|Answer|To answer|For example)\b/i.test(t)) {
      break;
    }
    cleaned.push(t);
  }

  return cleaned.join(" ").replace(/\s+/g, " ").trim();
}

function isValidSqlShape(sql: string): boolean {
  if (!sql) return false;
  if (!/^(SELECT|WITH)\b/i.test(sql)) return false;
  if (!/\bFROM\b/i.test(sql) && !/\bSELECT\s+\d/i.test(sql)) {
    if (!/^SELECT\s+(COUNT|SUM|AVG|MIN|MAX|NOW|CURDATE|VERSION)\s*\(/i.test(sql)) return false;
  }
  if (sql.length < 10) return false;
  if (sql.length > 2000) return false;
  return true;
}
