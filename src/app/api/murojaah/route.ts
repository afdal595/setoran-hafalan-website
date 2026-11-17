import { NextResponse, NextRequest } from "next/server";
import { getMurojaah, createMurojaah } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth-server";

type MurojaahFilters = {
  anggotaId?: number;
  musyrifId?: number;
  userId?: number;
  userRole?: string;
};

function getErrorMessage(error: unknown, fallback: string) {
  if (typeof error !== "object" || error === null) return fallback;
  const maybeMessage = (error as { message?: unknown }).message;
  return typeof maybeMessage === "string" && maybeMessage ? maybeMessage : fallback;
}

export async function GET(request: NextRequest) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const anggotaId = searchParams.get("anggota_id") ? parseInt(searchParams.get("anggota_id")!) : undefined;
    const musyrifId = searchParams.get("musyrif_id") ? parseInt(searchParams.get("musyrif_id")!) : undefined;

    // Access control based on role
    let filters: MurojaahFilters = { userRole: session.role, userId: session.id };

    if (session.role === "admin") {
      // Admin can see all, optionally filtered by query params
      filters = {};
      if (anggotaId) filters.anggotaId = anggotaId;
      if (musyrifId) filters.musyrifId = musyrifId;
    } else if (session.role === "musyrif") {
      // Musyrif can see murojaah for their anggota
      filters.musyrifId = session.id;
      if (anggotaId) filters.anggotaId = anggotaId;
    } else if (session.role === "anggota") {
      // Anggota can only see their own murojaah
      filters.anggotaId = session.id;
    }

    const murojaah = await getMurojaah(filters);
    return NextResponse.json({ murojaah });
  } catch (error: unknown) {
    console.error("GET /api/murojaah error", error);
    return NextResponse.json({ error: getErrorMessage(error, "Failed to fetch murojaah") }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admin and musyrif can create murojaah
    if (session.role !== "admin" && session.role !== "musyrif") {
      return NextResponse.json({ error: "Forbidden - only admin and musyrif can create murojaah" }, { status: 403 });
    }

    const body = (await request.json()) as Record<string, unknown>;
    const anggota_id = Number(body.anggota_id);
    const musyrif_id = Number(body.musyrif_id);
    const target_halaman = Number(body.target_halaman);
    const tanggal_target = String(body.tanggal_target || "");
    const tanggal_realisasi = body.tanggal_realisasi ? String(body.tanggal_realisasi) : null;
    const status = body.status ? String(body.status) : "";
    const catatan = String(body.catatan || "");

    // Validate required fields
    if (!anggota_id || !musyrif_id || !target_halaman || !tanggal_target) {
      return NextResponse.json(
        {
          error: "Missing required fields: anggota_id, musyrif_id, target_halaman, tanggal_target",
        },
        { status: 400 }
      );
    }

    // Validate status enum
    const validStatuses = ["belum", "proses", "tuntas"];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Valid statuses: ${validStatuses.join(", ")}` },
        { status: 400 }
      );
    }

    // Musyrif can only create murojaah for themselves
    if (session.role === "musyrif" && musyrif_id !== session.id) {
      return NextResponse.json({ error: "Forbidden - musyrif can only create murojaah for themselves" }, { status: 403 });
    }

    const murojaah = await createMurojaah({
      anggotaId: anggota_id,
      musyrifId: musyrif_id,
      targetHalaman: target_halaman,
      tanggalTarget: tanggal_target,
      tanggalRealisasi: tanggal_realisasi || null,
      status: status || "belum",
      catatan: catatan || "",
    });

    return NextResponse.json({ murojaah }, { status: 201 });
  } catch (error: unknown) {
    console.error("POST /api/murojaah error", error);
    return NextResponse.json({ error: getErrorMessage(error, "Failed to create murojaah") }, { status: 500 });
  }
}
