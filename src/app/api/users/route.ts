import { NextResponse } from "next/server";
import { getUsers, createUser } from "@/lib/db";
import { requireRole, getSessionFromRequest } from "@/lib/auth-server";

function getErrorCode(error: unknown) {
  if (typeof error !== "object" || error === null) return undefined;
  const maybeCode = (error as { code?: unknown }).code;
  return typeof maybeCode === "string" ? maybeCode : undefined;
}

function getErrorMessage(error: unknown, fallback: string) {
  if (typeof error !== "object" || error === null) return fallback;
  const maybeMessage = (error as { message?: unknown }).message;
  return typeof maybeMessage === "string" && maybeMessage ? maybeMessage : fallback;
}

export async function GET(request: Request) {
  // Allow all authenticated users (admin, musyrif, anggota) to fetch user list
  const session = getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const users = await getUsers();
    return NextResponse.json({ users });
  } catch (error: unknown) {
    console.error("GET /api/users error", error);
    return NextResponse.json({ error: getErrorMessage(error, "Database connection failed") }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = requireRole("admin", request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const name = String(body.name || "").trim();
    const email = String(body.email || "").trim();
    const role = String(body.role || "").trim();
    const active = typeof body.active === "boolean" ? body.active : true;

    if (!name || !email || !role) {
      return NextResponse.json({ error: "Missing required fields: name, email, role" }, { status: 400 });
    }

    const validRoles = ["admin", "musyrif", "anggota"];
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: `Invalid role. Valid roles: ${validRoles.join(", ")}` }, { status: 400 });
    }

    const user = await createUser({ name, email, role, active });
    return NextResponse.json({ user }, { status: 201 });
  } catch (error: unknown) {
    if (getErrorCode(error) === "23505") {
      // unique_violation
      return NextResponse.json({ error: "Email already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }
}
