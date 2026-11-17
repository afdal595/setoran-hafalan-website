import { NextResponse } from "next/server";
import crypto from "crypto";
import { requireRole } from "@/lib/auth-server";
import { setDefaultPasswordHash } from "@/lib/db";

const validRoles = ["musyrif", "anggota"] as const;

function hashPassword(password: string) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

export async function PUT(request: Request) {
  const auth = requireRole("admin", request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const role = String(body.role || "").trim().toLowerCase();
    const password = String(body.password || "").trim();

    if (!validRoles.includes(role as (typeof validRoles)[number])) {
      return NextResponse.json({ error: "Invalid role. Only musyrif and anggota can use default passwords." }, { status: 400 });
    }

    if (!password || password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters long" }, { status: 400 });
    }

    const passwordHash = hashPassword(password);
    const saved = await setDefaultPasswordHash(role, passwordHash);

    return NextResponse.json({
      ok: true,
      role,
      updatedAt: saved?.updated_at ?? null,
      message: "Default password updated successfully",
    });
  } catch (error) {
    console.error("Update default password error:", error);
    return NextResponse.json({ error: "Failed to update default password" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const auth = requireRole("admin", request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  return NextResponse.json({
    roles: validRoles,
    message: "Admin-only default password management endpoint for musyrif and anggota",
  });
}
