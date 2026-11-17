import { NextResponse, NextRequest } from "next/server";
import { getLevelHafalan, getUserProgress, getAllProgress } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth-server";

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
    const type = searchParams.get("type") || "personal"; // personal, all, levels

    if (type === "levels") {
      // Get available levels (public data)
      const levels = await getLevelHafalan();
      return NextResponse.json({ levels });
    } else if (type === "all") {
      // Get all progress (admin only)
      if (session.role !== "admin") {
        return NextResponse.json({ error: "Forbidden - only admin can view all progress" }, { status: 403 });
      }
      const progress = await getAllProgress();
      return NextResponse.json({ progress });
    } else {
      // Get personal progress
      if (session.role !== "anggota") {
        return NextResponse.json({ error: "Forbidden - only anggota can view personal progress" }, { status: 403 });
      }
      const progress = await getUserProgress(session.id);
      return NextResponse.json({ progress });
    }
  } catch (error: unknown) {
    console.error("GET /api/progress error", error);
    return NextResponse.json({ error: getErrorMessage(error, "Failed to fetch progress") }, { status: 500 });
  }
}
