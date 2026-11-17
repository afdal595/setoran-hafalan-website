import { NextResponse, NextRequest } from "next/server";
import { getSetoranById, updateSetoran, deleteSetoran } from "@/lib/db";
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
      return NextResponse.json({ error: "Invalid setoran ID" }, { status: 400 });
    }

    const setoran = await getSetoranById(id);
    if (!setoran) {
      return NextResponse.json({ error: "Setoran not found" }, { status: 404 });
    }

    // Access control
    if (session.role === "anggota" && setoran.anggota_id !== session.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (session.role === "musyrif" && setoran.musyrif_id !== session.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ setoran });
  } catch (error: unknown) {
    console.error("GET /api/setoran/[id] error", error);
    return NextResponse.json({ error: getErrorMessage(error, "Failed to fetch setoran") }, { status: 500 });
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
      return NextResponse.json({ error: "Invalid setoran ID" }, { status: 400 });
    }

    const setoran = await getSetoranById(id);
    if (!setoran) {
      return NextResponse.json({ error: "Setoran not found" }, { status: 404 });
    }

    // Only admin and musyrif can update
    if (session.role !== "admin" && session.role !== "musyrif") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Musyrif can only update their own setoran
    if (session.role === "musyrif" && setoran.musyrif_id !== session.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = (await request.json()) as Record<string, unknown>;
    const updates: Record<string, unknown> = {};

    // Map snake_case to camelCase for database
    const allowedFields = [
      "halaman_awal",
      "halaman_akhir",
      "nilai_tajwid",
      "nilai_kelancaran",
      "nilai_makhraj",
      "feedback",
    ];

    for (const field of allowedFields) {
      if (field in body) {
        updates[field] = body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const updatedSetoran = await updateSetoran(id, updates);
    return NextResponse.json({ setoran: updatedSetoran });
  } catch (error: unknown) {
    console.error("PUT /api/setoran/[id] error", error);
    return NextResponse.json({ error: getErrorMessage(error, "Failed to update setoran") }, { status: 500 });
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
      return NextResponse.json({ error: "Invalid setoran ID" }, { status: 400 });
    }

    const setoran = await getSetoranById(id);
    if (!setoran) {
      return NextResponse.json({ error: "Setoran not found" }, { status: 404 });
    }

    // Only admin and musyrif can delete
    if (session.role !== "admin" && session.role !== "musyrif") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Musyrif can only delete their own setoran
    if (session.role === "musyrif" && setoran.musyrif_id !== session.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await deleteSetoran(id);
    return NextResponse.json({ message: "Setoran deleted successfully" });
  } catch (error: unknown) {
    console.error("DELETE /api/setoran/[id] error", error);
    return NextResponse.json({ error: getErrorMessage(error, "Failed to delete setoran") }, { status: 500 });
  }
}
