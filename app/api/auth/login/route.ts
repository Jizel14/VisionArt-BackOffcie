import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { signToken, COOKIE_NAME } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      return NextResponse.json(
        { error: "Admin credentials not configured" },
        { status: 500 }
      );
    }

    // simple check — env password can be plain text or bcrypt hash
    const emailMatch = email?.toLowerCase() === adminEmail.toLowerCase();
    let passwordMatch = false;

    if (adminPassword.startsWith("$2")) {
      // bcrypt hash
      passwordMatch = await bcrypt.compare(password, adminPassword);
    } else {
      passwordMatch = password === adminPassword;
    }

    if (!emailMatch || !passwordMatch) {
      return NextResponse.json(
        { error: "Identifiants invalides" },
        { status: 401 }
      );
    }

    const token = await signToken({ email: adminEmail, role: "super_admin" });

    const res = NextResponse.json({ success: true });
    res.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 8, // 8h
      path: "/",
    });

    return res;
  } catch {
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
