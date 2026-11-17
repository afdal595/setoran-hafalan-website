import { NextResponse } from "next/server";
import { getUsers } from "@/lib/db";
import { requireRole } from "@/lib/auth-server";

export async function GET(request: Request) {
  const auth = requireRole("admin", request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const users = await getUsers();
    return NextResponse.json({ users });
  } catch (error) {
    console.error("GET /api/admin/users error", error);
    return NextResponse.json({ error: "Failed to fetch admin users" }, { status: 500 });
  }
}
