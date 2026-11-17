import { NextResponse } from "next/server";
import { getUserById, updateUser, deactivateUser } from "@/lib/db";
import { requireRole } from "@/lib/auth-server";

function getErrorCode(error: unknown) {
  if (typeof error !== "object" || error === null) return undefined;
  const maybeCode = (error as { code?: unknown }).code;
  return typeof maybeCode === "string" ? maybeCode : undefined;
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireRole("admin", request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await params;
  const numericId = Number(id);
  if (Number.isNaN(numericId) || numericId <= 0) {
    return NextResponse.json({ error: "Invalid user id" }, { status: 400 });
  }

  try {
    const user = await getUserById(numericId);
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
    return NextResponse.json({ user });
  } catch {
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireRole("admin", request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await params;
  const numericId = Number(id);
  if (Number.isNaN(numericId) || numericId <= 0) {
    return NextResponse.json({ error: "Invalid user id" }, { status: 400 });
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const allowed = ["name", "email", "role", "active"];
    const fields: Record<string, unknown> = {};
    for (const k of Object.keys(body)) {
      if (allowed.includes(k)) fields[k] = body[k];
    }

    if (Object.keys(fields).length === 0) {
      return NextResponse.json({ error: "No updatable fields provided" }, { status: 400 });
    }

    const updated = await updateUser(numericId, fields);
    if (!updated) return NextResponse.json({ error: "User not found" }, { status: 404 });
    return NextResponse.json({ user: updated });
  } catch (error: unknown) {
    if (getErrorCode(error) === "23505") {
      return NextResponse.json({ error: "Email already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireRole("admin", request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await params;
  const numericId = Number(id);
  if (Number.isNaN(numericId) || numericId <= 0) {
    return NextResponse.json({ error: "Invalid user id" }, { status: 400 });
  }

  try {
    const deactivated = await deactivateUser(numericId);
    if (!deactivated) return NextResponse.json({ error: "User not found" }, { status: 404 });
    return NextResponse.json({ user: deactivated });
  } catch {
    return NextResponse.json({ error: "Failed to deactivate user" }, { status: 500 });
  }
}
