import { NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth-server";

export async function GET(request: Request) {
  const session = getSessionFromRequest(request);
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ user: { id: session.id, email: session.email, role: session.role, name: session.name } });
}
