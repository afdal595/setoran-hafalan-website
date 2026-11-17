
import { NextResponse } from "next/server";
import crypto from "crypto";
import { getDefaultPasswordHash, getUserByEmailAndRole } from "@/lib/db";

const LEGACY_DEFAULT_PASSWORDS: Record<string, string> = {
  musyrif: "musyrif123",
  anggota: "anggota123",
};

const SESSION_SECRET = process.env.AUTH_SECRET || "ldk-dev-secret";

function createSignedSessionToken(user: { id: number; email: string; role: string; name: string }) {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
    exp: Date.now() + 8 * 60 * 60 * 1000,
  };

  const token = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto.createHmac("sha256", SESSION_SECRET).update(token).digest("base64url");
  return `${token}.${signature}`;
}

function hashPassword(password: string) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

async function passwordMatchesUser(user: { password_hash?: string | null }, password: string, role: string) {
  const submittedHash = hashPassword(password);

  if (user?.password_hash) {
    return user.password_hash === submittedHash;
  }

  if (role === "admin") {
    return false;
  }

  const configuredDefaultHash = await getDefaultPasswordHash(role);
  if (configuredDefaultHash) {
    return configuredDefaultHash === submittedHash;
  }

  return LEGACY_DEFAULT_PASSWORDS[role] === password;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const role = String(body?.role || "").toLowerCase();
    const email = String(body?.email || "").trim().toLowerCase();
    const password = String(body?.password || "");

    if (!role || !email || !password) {
      return NextResponse.json({ error: "Role, email, and password are required" }, { status: 400 });
    }

    const user = await getUserByEmailAndRole(email, role);
    if (!user || !user.active) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const isPasswordValid = await passwordMatchesUser(user, password, role);
    if (!isPasswordValid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const token = createSignedSessionToken({
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    const response = NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        active: user.active,
      },
      token,
    });

    response.cookies.set("session_token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 8,
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Failed to login" }, { status: 500 });
  }
}
