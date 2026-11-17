import { NextResponse, NextRequest } from "next/server";
import { getMurojaahById, updateMurojaah, deleteMurojaah } from "@/lib/db";
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
      return NextResponse.json({ error: "Invalid murojaah ID" }, { status: 400 });
    }

    const murojaah = await getMurojaahById(id);
    if (!murojaah) {
      return NextResponse.json({ error: "Murojaah not found" }, { status: 404 });
    }

    // Access control
    if (session.role === "anggota" && murojaah.anggota_id !== session.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (session.role === "musyrif" && murojaah.musyrif_id !== session.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ murojaah });
  } catch (error: unknown) {
    console.error("GET /api/murojaah/[id] error", error);
    return NextResponse.json({ error: getErrorMessage(error, "Failed to fetch murojaah") }, { status: 500 });
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
      return NextResponse.json({ error: "Invalid murojaah ID" }, { status: 400 });
    }

    const murojaah = await getMurojaahById(id);
    if (!murojaah) {
      return NextResponse.json({ error: "Murojaah not found" }, { status: 404 });
    }

    // Only admin and musyrif can update
    if (session.role !== "admin" && session.role !== "musyrif") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Musyrif can only update their own murojaah
    if (session.role === "musyrif" && murojaah.musyrif_id !== session.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = (await request.json()) as Record<string, unknown>;
    const updates: Record<string, unknown> = {};

    // Allowed fields to update
    const allowedFields = [
      "target_halaman",
      "tanggal_target",
      "tanggal_realisasi",
      "status",
      "catatan",
    ];

    for (const field of allowedFields) {
      if (field in body) {
        // Validate status enum
        if (field === "status") {
          const validStatuses = ["belum", "proses", "tuntas"];
          const statusValue = String(body[field] || "");
          if (!validStatuses.includes(statusValue)) {
            return NextResponse.json(
              { error: `Invalid status. Valid statuses: ${validStatuses.join(", ")}` },
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

    const updatedMurojaah = await updateMurojaah(id, updates);
    return NextResponse.json({ murojaah: updatedMurojaah });
  } catch (error: unknown) {
    console.error("PUT /api/murojaah/[id] error", error);
    return NextResponse.json({ error: getErrorMessage(error, "Failed to update murojaah") }, { status: 500 });
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
      return NextResponse.json({ error: "Invalid murojaah ID" }, { status: 400 });
    }

    const murojaah = await getMurojaahById(id);
    if (!murojaah) {
      return NextResponse.json({ error: "Murojaah not found" }, { status: 404 });
    }

    // Only admin and musyrif can delete
    if (session.role !== "admin" && session.role !== "musyrif") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Musyrif can only delete their own murojaah
    if (session.role === "musyrif" && murojaah.musyrif_id !== session.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await deleteMurojaah(id);
    return NextResponse.json({ message: "Murojaah deleted successfully" });
  } catch (error: unknown) {
    console.error("DELETE /api/murojaah/[id] error", error);
    return NextResponse.json({ error: getErrorMessage(error, "Failed to delete murojaah") }, { status: 500 });
  }
}
