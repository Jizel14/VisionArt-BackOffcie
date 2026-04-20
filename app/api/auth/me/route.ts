import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { cookies } from "next/headers";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const cookieStore = await cookies();
  const token = cookieStore.get("bo_token")?.value || "";
  return NextResponse.json({ email: session.email, role: session.role, token });
}
