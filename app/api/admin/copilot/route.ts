import { NextResponse } from "next/server";
import { ollamaGenerateSql } from "@/lib/ollama-client";
import { extractSQL } from "@/lib/sql-extractor";
import { executeSelect, inferResultShape, validateAndPrepareSql } from "@/lib/sql-executor";

function isSqlSyntaxError(e: unknown) {
  // mysql2 errors usually include these fields
  const any = e as any;
  return (
    any?.code === "ER_PARSE_ERROR" ||
    any?.sqlState === "42000" ||
    (typeof any?.message === "string" && any.message.toLowerCase().includes("sql syntax"))
  );
}

function isUnknownColumnError(e: unknown) {
  const any = e as any;
  return any?.code === "ER_BAD_FIELD_ERROR" || any?.errno === 1054;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { question?: string };
    const question = (body?.question || "").trim();
    if (!question) {
      return NextResponse.json({ error: "Missing question" }, { status: 400 });
    }

    let rawResponse1 = await ollamaGenerateSql({ question });
    console.log("[COPILOT] question:", question);
    console.log("[COPILOT] ollama raw:", rawResponse1);

    let sqlRaw = extractSQL(rawResponse1);
    console.log("[COPILOT] extracted sql:", sqlRaw);

    // If extraction failed, retry once asking the model to output ONLY SQL
    if (!sqlRaw) {
      console.log("[COPILOT] no SQL extracted, retrying...");
      rawResponse1 = await ollamaGenerateSql({
        question,
        previousOutput: rawResponse1,
        previousError: "Your previous response did not contain a valid SQL query. Output ONLY a single SELECT statement, no prose, no explanation.",
      });
      console.log("[COPILOT] retry raw:", rawResponse1);
      sqlRaw = extractSQL(rawResponse1);
      console.log("[COPILOT] retry extracted sql:", sqlRaw);
    }

    const lower = sqlRaw.trim().toLowerCase();
    if (!(lower.startsWith("select ") || lower.startsWith("with "))) {
      return NextResponse.json(
        {
          error: "Le modèle n'a pas généré de requête SELECT valide. Reformule ta question plus précisément.",
          raw: rawResponse1,
        },
        { status: 422 }
      );
    }

    let sql = validateAndPrepareSql(sqlRaw);
    console.log("[COPILOT] prepared sql:", sql);

    let rows: Record<string, unknown>[];
    try {
      rows = await executeSelect(sql);
    } catch (e) {
      // One retry on syntax/unknown-column error: ask model to correct.
      if (!isSqlSyntaxError(e) && !isUnknownColumnError(e)) throw e;

      const rawResponse2 = await ollamaGenerateSql({
        question,
        previousOutput: rawResponse1,
        previousError: e instanceof Error ? e.message : String(e),
      });
      console.log("[COPILOT] retry raw:", rawResponse2);

      sqlRaw = extractSQL(rawResponse2);
      console.log("[COPILOT] retry extracted sql:", sqlRaw);

      sql = validateAndPrepareSql(sqlRaw);
      console.log("[COPILOT] retry prepared sql:", sql);
      rows = await executeSelect(sql);
    }

    const shape = inferResultShape(sql, rows);

    return NextResponse.json({
      sql,
      ...shape,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Server error";
    console.error("[COPILOT] error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

