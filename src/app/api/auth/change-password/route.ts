import { NextResponse } from "next/server";
import crypto from "crypto";
import { getSessionFromRequest } from "@/lib/auth-server";
import { getUserByEmailAndRole, updateUser } from "@/lib/db";

function hashPassword(password: string) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

export async function PUT(request: Request) {
  const session = getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const currentPassword = String(body.currentPassword || "");
    const newPassword = String(body.newPassword || "");
    const confirmPassword = String(body.confirmPassword || "");

    if (!currentPassword || !newPassword || !confirmPassword) {
      return NextResponse.json({ error: "Current password and new password are required" }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: "New password must be at least 6 characters long" }, { status: 400 });
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json({ error: "New password and confirmation do not match" }, { status: 400 });
    }

    const user = await getUserByEmailAndRole(session.email, session.role);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const currentHash = user.password_hash ? user.password_hash : null;
    if (currentHash && currentHash !== hashPassword(currentPassword)) {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 401 });
    }

    if (!user.password_hash && session.role !== "admin") {
      const legacyDefault = {
        musyrif: "musyrif123",
        anggota: "anggota123",
      }[session.role] ?? "";

      if (currentPassword !== legacyDefault) {
        return NextResponse.json({ error: "Current password is incorrect" }, { status: 401 });
      }
    }

    const updated = await updateUser(user.id, { password_hash: hashPassword(newPassword) });
    return NextResponse.json({
      ok: true,
      user: {
        id: updated.id,
        email: updated.email,
        role: updated.role,
        name: updated.name,
      },
    });
  } catch (error) {
    console.error("Change password error:", error);
    return NextResponse.json({ error: "Failed to change password" }, { status: 500 });
  }
}
