import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET() {
  try {
    const start = Date.now();
    await pool.query("SELECT 1");
    const latency = Date.now() - start;
    return NextResponse.json({
      status: "connected",
      latency: `${latency}ms`,
      database: process.env.DB_NAME || "visionart",
      host: process.env.DB_HOST || "localhost",
    });
  } catch (err) {
    return NextResponse.json(
      {
        status: "disconnected",
        error: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
