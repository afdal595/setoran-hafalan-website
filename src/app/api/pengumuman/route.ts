import { NextResponse, NextRequest } from "next/server";
import { getPengumuman, createPengumuman } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth-server";

type PengumumanFilters = {
  userRole: string;
  userId: number;
  targetRole?: string;
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
    const targetRole = searchParams.get("target_role") || undefined;

    // Filter based on user role
    const filters: PengumumanFilters = { userRole: session.role, userId: session.id };
    if (targetRole) {
      filters.targetRole = targetRole;
    }

    const pengumuman = await getPengumuman(filters);
    return NextResponse.json({ pengumuman });
  } catch (error: unknown) {
    console.error("GET /api/pengumuman error", error);
    return NextResponse.json({ error: getErrorMessage(error, "Failed to fetch pengumuman") }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admin can create pengumuman
    if (session.role !== "admin") {
      return NextResponse.json({ error: "Forbidden - only admin can create pengumuman" }, { status: 403 });
    }

    const body = (await request.json()) as Record<string, unknown>;
    const title = String(body.title || "").trim();
    const content = String(body.content || "").trim();
    const publish_date = String(body.publish_date || "").trim();
    const target_role = body.target_role ? String(body.target_role) : "";

    // Validate required fields
    if (!title || !content || !publish_date) {
      return NextResponse.json(
        { error: "Missing required fields: title, content, publish_date" },
        { status: 400 }
      );
    }

    // Validate target_role enum
    const validTargetRoles = ["admin", "musyrif", "anggota", "semua"];
    if (target_role && !validTargetRoles.includes(target_role)) {
      return NextResponse.json(
        { error: `Invalid target_role. Valid roles: ${validTargetRoles.join(", ")}` },
        { status: 400 }
      );
    }

    const pengumuman = await createPengumuman({
      adminId: session.id,
      title,
      content,
      publishDate: publish_date,
      targetRole: target_role || "semua",
    });

    return NextResponse.json({ pengumuman }, { status: 201 });
  } catch (error: unknown) {
    console.error("POST /api/pengumuman error", error);
    return NextResponse.json({ error: getErrorMessage(error, "Failed to create pengumuman") }, { status: 500 });
  }
}
