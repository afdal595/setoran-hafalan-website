import { NextResponse, NextRequest } from "next/server";
import { getSetoran, createSetoran } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth-server";

type SetoranFilters = {
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
    let filters: SetoranFilters = { userRole: session.role, userId: session.id };

    if (session.role === "admin") {
      // Admin can see all, optionally filtered by query params
      filters = {};
      if (anggotaId) filters.anggotaId = anggotaId;
      if (musyrifId) filters.musyrifId = musyrifId;
    } else if (session.role === "musyrif") {
      // Musyrif can see setoran for their anggota
      filters.musyrifId = session.id;
      if (anggotaId) filters.anggotaId = anggotaId;
    } else if (session.role === "anggota") {
      // Anggota can only see their own setoran
      filters.anggotaId = session.id;
    }

    const setoran = await getSetoran(filters);
    return NextResponse.json({ setoran });
  } catch (error: unknown) {
    console.error("GET /api/setoran error", error);
    return NextResponse.json({ error: getErrorMessage(error, "Failed to fetch setoran") }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admin and musyrif can create setoran
    if (session.role !== "admin" && session.role !== "musyrif") {
      return NextResponse.json({ error: "Forbidden - only admin and musyrif can create setoran" }, { status: 403 });
    }

    const body = (await request.json()) as Record<string, unknown>;
    const anggota_id = Number(body.anggota_id);
    const musyrif_id = Number(body.musyrif_id);
    const target_date = String(body.target_date || "");
    const halaman_awal = Number(body.halaman_awal);
    const halaman_akhir = Number(body.halaman_akhir);
    const nilai_tajwid = Number(body.nilai_tajwid ?? 0);
    const nilai_kelancaran = Number(body.nilai_kelancaran ?? 0);
    const nilai_makhraj = Number(body.nilai_makhraj ?? 0);
    const feedback = String(body.feedback || "");

    // Validate required fields
    if (!anggota_id || !musyrif_id || !target_date || Number.isNaN(halaman_awal) || Number.isNaN(halaman_akhir)) {
      return NextResponse.json(
        {
          error: "Missing required fields: anggota_id, musyrif_id, target_date, halaman_awal, halaman_akhir",
        },
        { status: 400 }
      );
    }

    // Musyrif can only create setoran for themselves
    if (session.role === "musyrif" && musyrif_id !== session.id) {
      return NextResponse.json({ error: "Forbidden - musyrif can only create setoran for themselves" }, { status: 403 });
    }

    const setoran = await createSetoran({
      anggotaId: anggota_id,
      musyrifId: musyrif_id,
      targetDate: target_date,
      halamanAwal: halaman_awal,
      halamanAkhir: halaman_akhir,
      nilaiTajwid: nilai_tajwid || 0,
      nilaiKelancaran: nilai_kelancaran || 0,
      nilaiMakhraj: nilai_makhraj || 0,
      feedback: feedback || "",
    });

    return NextResponse.json({ setoran }, { status: 201 });
  } catch (error: unknown) {
    console.error("POST /api/setoran error", error);
    return NextResponse.json({ error: getErrorMessage(error, "Failed to create setoran") }, { status: 500 });
  }
}
