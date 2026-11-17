import { NextResponse, NextRequest } from "next/server";
import { getPengumumanById, updatePengumuman, deletePengumuman } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth-server";

type RouteContext = { params: Promise<{ id: string }> };

function getErrorMessage(error: unknown, fallback: string) {
  if (typeof error !== "object" || error === null) return fallback;
  const maybeMessage = (error as { message?: unknown }).message;
  return typeof maybeMessage === "string" && maybeMessage ? maybeMessage : fallback;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params = await context.params;
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid pengumuman ID" }, { status: 400 });
    }

    const pengumuman = await getPengumumanById(id);
    if (!pengumuman) {
      return NextResponse.json({ error: "Pengumuman not found" }, { status: 404 });
    }

    // Access control - user must be able to see this announcement
    if (pengumuman.target_role !== "semua" && pengumuman.target_role !== session.role) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ pengumuman });
  } catch (error: unknown) {
    console.error("GET /api/pengumuman/[id] error", error);
    return NextResponse.json({ error: getErrorMessage(error, "Failed to fetch pengumuman") }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params = await context.params;
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid pengumuman ID" }, { status: 400 });
    }

    // Only admin can update pengumuman
    if (session.role !== "admin") {
      return NextResponse.json({ error: "Forbidden - only admin can update pengumuman" }, { status: 403 });
    }

    const pengumuman = await getPengumumanById(id);
    if (!pengumuman) {
      return NextResponse.json({ error: "Pengumuman not found" }, { status: 404 });
    }

    const body = (await request.json()) as Record<string, unknown>;
    const updates: Record<string, unknown> = {};

    // Allowed fields to update
    const allowedFields = ["title", "content", "publish_date", "target_role"];

    for (const field of allowedFields) {
      if (field in body) {
        // Validate target_role enum
        if (field === "target_role") {
          const validTargetRoles = ["admin", "musyrif", "anggota", "semua"];
          const targetRoleValue = String(body[field] || "");
          if (!validTargetRoles.includes(targetRoleValue)) {
            return NextResponse.json(
              { error: `Invalid target_role. Valid roles: ${validTargetRoles.join(", ")}` },
              { status: 400 }
            );
          }
        }
        updates[field] = body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const updatedPengumuman = await updatePengumuman(id, updates);
    return NextResponse.json({ pengumuman: updatedPengumuman });
  } catch (error: unknown) {
    console.error("PUT /api/pengumuman/[id] error", error);
    return NextResponse.json({ error: getErrorMessage(error, "Failed to update pengumuman") }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params = await context.params;
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid pengumuman ID" }, { status: 400 });
    }

    // Only admin can delete pengumuman
    if (session.role !== "admin") {
      return NextResponse.json({ error: "Forbidden - only admin can delete pengumuman" }, { status: 403 });
    }

    const pengumuman = await getPengumumanById(id);
    if (!pengumuman) {
      return NextResponse.json({ error: "Pengumuman not found" }, { status: 404 });
    }

    await deletePengumuman(id);
    return NextResponse.json({ message: "Pengumuman deleted successfully" });
  } catch (error: unknown) {
    console.error("DELETE /api/pengumuman/[id] error", error);
    return NextResponse.json({ error: getErrorMessage(error, "Failed to delete pengumuman") }, { status: 500 });
  }
}
