import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_TOKEN_KEY, verifySessionToken } from "@/lib/auth-server";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_TOKEN_KEY)?.value ?? null;
  const session = verifySessionToken(token);

  if (!session) {
    redirect("/admin/login");
  }

  return <>{children}</>;
}