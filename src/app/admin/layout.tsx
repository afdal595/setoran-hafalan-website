"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (pathname === "/admin/login") {
      return;
    }

    let cancelled = false;

    fetch("/api/admin/me", { credentials: "same-origin" })
      .then((response) => {
        if (cancelled) {
          return;
        }

        if (!response.ok || response.status === 401) {
          router.replace("/admin/login");
        }
      })
      .catch(() => {
        if (!cancelled) {
          router.replace("/admin/login");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [pathname, router]);

  return <>{children}</>;
}
