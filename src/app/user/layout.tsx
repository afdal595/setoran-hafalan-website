import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { SESSION_TOKEN_KEY, verifySessionToken } from "@/lib/auth-server";

export default async function UserLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_TOKEN_KEY)?.value ?? null;
  const session = verifySessionToken(token);

  if (!session) {
    redirect("/admin/login");
  }

  if (session.role !== "anggota") {
    redirect("/admin/login");
  }

  return <>{children}</>;
}
