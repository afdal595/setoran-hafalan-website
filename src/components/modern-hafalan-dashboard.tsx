"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { logoutAdmin } from "@/lib/auth";
import {
  levelList,
  pengumumanAwal,
  progressAwal,
  setoranAwal,
  surahList,
  type Pengumuman,
  type Setoran,
  type User,
  type UserRole,
} from "@/lib/mock-data";

type NewSetoranForm = {
  anggotaId: number;
  musyrifId: number;
  targetDate: string;
  surahAwal: number;
  surahAkhir: number;
  nilaiTajwid: number;
  nilaiKelancaran: number;
  nilaiMakhraj: number;
  feedback: string;
};

type NewPengumumanForm = {
  adminId: number;
  title: string;
  content: string;
  publishDate: string;
  targetRole: UserRole | "semua";
};

type NewUserForm = {
  name: string;
  email: string;
  role: UserRole;
};

const roleLabels: Record<UserRole, string> = {
  admin: "Admin",
  musyrif: "Musyrif",
  anggota: "Anggota",
};

const navItems = [
  { label: "Overview", href: "#overview", icon: "dashboard" },
  { label: "Jadwal", href: "#jadwal", icon: "calendar" },
  { label: "Setoran", href: "#setoran", icon: "book" },
  { label: "Daftar Setoran", href: "#daftar-setoran", icon: "table" },
  { label: "Pengumuman", href: "#pengumuman", icon: "megaphone" },
] as const;

function Icon({ name, className = "" }: { name: string; className?: string }) {
  const base = `h-5 w-5 shrink-0 ${className}`;

  switch (name) {
    case "dashboard":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={base} aria-hidden="true">
          <path d="M4 6.5A2.5 2.5 0 0 1 6.5 4H9a2 2 0 0 1 2 2v3.5a2 2 0 0 1-2 2H6.5A2.5 2.5 0 0 1 4 9.5v-3Z" stroke="currentColor" strokeWidth="1.7" />
          <path d="M13 6.5A2.5 2.5 0 0 1 15.5 4H18a2 2 0 0 1 2 2v8.5a2 2 0 0 1-2 2h-2.5A2.5 2.5 0 0 1 13 14v-7.5Z" stroke="currentColor" strokeWidth="1.7" />
          <path d="M4 14.5A2.5 2.5 0 0 1 6.5 12H9a2 2 0 0 1 2 2v3.5a2 2 0 0 1-2 2H6.5A2.5 2.5 0 0 1 4 17.5v-3Z" stroke="currentColor" strokeWidth="1.7" />
          <path d="M13 17a2 2 0 0 1 2-2h2.5A2.5 2.5 0 0 1 20 17.5V18a2 2 0 0 1-2 2h-3a2 2 0 0 1-2-2v-1Z" stroke="currentColor" strokeWidth="1.7" />
        </svg>
      );
    case "calendar":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={base} aria-hidden="true">
          <path d="M7 3v3M17 3v3M4.5 8.5h15" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          <rect x="3.5" y="5" width="17" height="15.5" rx="3" stroke="currentColor" strokeWidth="1.7" />
          <path d="M8 12h2M13 12h2M8 16h2M13 16h2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
      );
    case "book":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={base} aria-hidden="true">
          <path d="M6.5 4.5h10A2.5 2.5 0 0 1 19 7v12a2.5 2.5 0 0 0-2.5-2.5h-10A2.5 2.5 0 0 0 4 19V7a2.5 2.5 0 0 1 2.5-2.5Z" stroke="currentColor" strokeWidth="1.7" />
          <path d="M7.5 8h6M7.5 11h7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
      );
    case "loop":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={base} aria-hidden="true">
          <path d="M7 7a7.5 7.5 0 1 1 0 10" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          <path d="M7 3v4h4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "megaphone":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={base} aria-hidden="true">
          <path d="M4 12h4l9-5v10l-9-5H4v-0.5A1.5 1.5 0 0 1 5.5 10h.5" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
          <path d="M8 12v4a2 2 0 0 0 2 2h1" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
      );
    case "users":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={base} aria-hidden="true">
          <path d="M16 19v-1.5A3.5 3.5 0 0 0 12.5 14h-1A3.5 3.5 0 0 0 8 17.5V19" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          <path d="M12 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" stroke="currentColor" strokeWidth="1.7" />
          <path d="M18.5 19v-1.1a2.8 2.8 0 0 0-2.8-2.8h-.2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
      );
    case "printer":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={base} aria-hidden="true">
          <path d="M7 8V4.5h10V8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          <rect x="5" y="9" width="14" height="8" rx="2" stroke="currentColor" strokeWidth="1.7" />
          <path d="M8 14h8M8 18h8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
      );
    case "search":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={base} aria-hidden="true">
          <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.7" />
          <path d="m16 16 4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
      );
    case "bell":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={base} aria-hidden="true">
          <path d="M12 4a4 4 0 0 0-4 4v1.3c0 1.1-.3 2.1-.9 3L6 13v1h12v-1l-1.1-1.7c-.6-.9-.9-1.9-.9-3V8a4 4 0 0 0-4-4Z" stroke="currentColor" strokeWidth="1.7" />
          <path d="M10 18a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
      );
    case "logout":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={base} aria-hidden="true">
          <path d="M10 17v2.2A1.8 1.8 0 0 1 8.2 21H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h2.2A1.8 1.8 0 0 1 10 4.8V7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          <path d="M15 8l4 4-4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M19 12H9" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
      );
    default:
      return null;
  }
}

function avgScore(tajwid: number, kelancaran: number, makhraj: number) {
  return Math.round((tajwid + kelancaran + makhraj) / 3);
}

function resolveLevel(totalHalaman: number, levels: typeof levelList = levelList) {
  const sorted = [...levels].sort((a, b) => a.targetHalaman - b.targetHalaman);
  let selected = sorted[0];

  for (const level of sorted) {
    if (totalHalaman >= level.targetHalaman) {
      selected = level;
    }
  }

  return selected;
}

function persentaseLevel(totalHalaman: number, levelId: number, levels: typeof levelList = levelList) {
  const level = levels.find((item) => item.id === levelId);
  if (!level) {
    return 0;
  }

  return Math.min(100, Math.round((totalHalaman / level.targetHalaman) * 100));
}

function parseDateString(dateString: string) {
  if (!dateString) return null;

  const normalized = dateString.trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    const [year, month, day] = normalized.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(normalized)) {
    const [day, month, year] = normalized.split("/").map(Number);
    const date = new Date(year, month - 1, day);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const date = new Date(`${normalized}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatShortDate(dateString: string) {
  const date = parseDateString(dateString);
  if (!date) return "-";
  return new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short" }).format(date);
}

function formatLongDate(dateString: string) {
  const date = parseDateString(dateString);
  if (!date) return "-";
  return new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "long", year: "numeric" }).format(date);
}

function buildTrendChart(scores: number[]) {
  const width = 620;
  const height = 240;
  const padding = 26;

  if (scores.length === 0) {
    return { line: "", area: "", points: [] as Array<{ x: number; y: number }> };
  }

  const max = Math.max(100, ...scores);
  const min = Math.min(0, ...scores);
  const range = Math.max(1, max - min);
  const innerWidth = width - padding * 2;
  const innerHeight = height - padding * 2;
  const denominator = Math.max(scores.length - 1, 1);

  const points = scores.map((score, index) => {
    const x = padding + (index / denominator) * innerWidth;
    const y = height - padding - ((score - min) / range) * innerHeight;
    return { x, y };
  });

  const line = points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`).join(" ");
  const firstPoint = points[0];
  const lastPoint = points[points.length - 1];
  const area = `${line} L ${lastPoint.x.toFixed(1)} ${height - padding} L ${firstPoint.x.toFixed(1)} ${height - padding} Z`;

  return { line, area, points };
}

function toNumber(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toString(value: unknown, fallback = "") {
  if (value === null || value === undefined) return fallback;
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return fallback;
}

function toBoolean(value: unknown, fallback = false) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "1", "yes", "y"].includes(normalized)) return true;
    if (["false", "0", "no", "n"].includes(normalized)) return false;
  }
  return fallback;
}

function toUserRole(value: unknown, fallback: UserRole = "anggota"): UserRole {
  const candidate = String(value ?? "").trim().toLowerCase();
  return candidate === "admin" || candidate === "musyrif" || candidate === "anggota" ? (candidate as UserRole) : fallback;
}

function getLocalDateISO(date: Date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getTodayISO() {
  return getLocalDateISO();
}

export default function ModernHafalanDashboard() {
  const router = useRouter();
  const [isAdminState, setIsAdminState] = useState(false);
  const [activeRole, setActiveRole] = useState<UserRole>("anggota");
  const [currentRoleRaw, setCurrentRoleRaw] = useState<UserRole | null>(null);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [, setIsHydrated] = useState(false);
  const [, setDataLoaded] = useState(false);
  const [setoranItems, setSetoranItems] = useState(setoranAwal);
  const [progressItems, setProgressItems] = useState(progressAwal);
  const [pengumumanItems, setPengumumanItems] = useState(pengumumanAwal);
  const [levelItems, setLevelItems] = useState(levelList);
  const [usersState, setUsersState] = useState<User[]>([]);
  const [newUserForm, setNewUserForm] = useState<NewUserForm>({
    name: "",
    email: "",
    role: "anggota",
  });
  const [userError, setUserError] = useState<string | null>(null);
  const [setoranForm, setSetoranForm] = useState<NewSetoranForm>({
    anggotaId: 0,
    musyrifId: 0,
    targetDate: "",
    surahAwal: 1,
    surahAkhir: 1,
    nilaiTajwid: 80,
    nilaiKelancaran: 80,
    nilaiMakhraj: 80,
    feedback: "",
  });

  const [editingSetoranId, setEditingSetoranId] = useState<number | null>(null);

  const [setoranFilterDateFrom] = useState("");
  const [setoranFilterDateTo] = useState("");
  const [setoranFilterAnggota, setSetoranFilterAnggota] = useState<number>(0);
  const [setoranFilterMusyrif] = useState<number>(0);
  const [setoranFilterStatus] = useState<string>(""); // "" | "excellent" | "good" | "fair"

  const [pengumumanForm, setPengumumanForm] = useState<NewPengumumanForm>({
    adminId: 1,
    title: "",
    content: "",
    publishDate: getTodayISO(),
    targetRole: "semua",
  });
  const [editingPengumumanId, setEditingPengumumanId] = useState<number | null>(null);
  const [pengumumanError, setPengumumanError] = useState<string | null>(null);

  const todayIso = getLocalDateISO();

  const usersById = useMemo(() => new Map(usersState.map((user) => [user.id, user])), [usersState]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        // Get current user session
        const response = await fetch("/api/auth/me", { credentials: "include" });

        if (!response.ok) {
          router.replace("/admin/login");
          return;
        }

        const data = await response.json();
        const currentRole = data?.user?.role as UserRole | undefined;
        const currentUser = Number(data?.user?.id ?? 0);

        if (cancelled) {
          return;
        }

        if (currentRole !== "admin" && currentRole !== "musyrif" && currentRole !== "anggota") {
          router.replace("/admin/login");
          return;
        }

        setCurrentRoleRaw(currentRole);
        setCurrentUserId(Number.isFinite(currentUser) && currentUser > 0 ? currentUser : null);
        setIsAdminState(currentRole === "admin");
        setActiveRole(currentRole);
        setSetoranForm((previous) => ({
          ...previous,
          musyrifId: currentRole === "musyrif" && Number.isFinite(currentUser) && currentUser > 0 ? currentUser : previous.musyrifId,
        }));
        setIsHydrated(true);

        // Load data from APIs
        await Promise.all([
          // Load users
          (async () => {
            try {
              const res = await fetch("/api/users", { credentials: "include" });
              if (res.ok) {
                const json = await res.json();
                if (json && Array.isArray(json.users)) {
                  const parsedUsers = json.users.map((user: Record<string, unknown>) => ({
                    id: toNumber(user.id),
                    name: toString(user.name),
                    email: toString(user.email),
                    role: toUserRole(user.role),
                    active: toBoolean(user.active, true),
                  }));
                  if (!cancelled) setUsersState(parsedUsers as User[]);
                }
              }
            } catch (error) {
              console.error("Error loading users:", error);
            }
          })(),

          // Load setoran
          (async () => {
            try {
              setSetoranForm({ anggotaId: 0, musyrifId: 0, targetDate: "", surahAwal: 1, surahAkhir: 1, nilaiTajwid: 80, nilaiKelancaran: 80, nilaiMakhraj: 80, feedback: "" });
              const res = await fetch("/api/setoran", { credentials: "include" });
              if (res.ok) {
                const json = await res.json();
                if (json && Array.isArray(json.setoran)) {
                  if (!cancelled) {
                    // Convert API response to component format
                    const setoranData = json.setoran.map((item: Record<string, unknown>) => ({
                      id: toNumber(item.id),
                      anggotaId: toNumber(item.anggota_id),
                      musyrifId: toNumber(item.musyrif_id),
                      targetDate: toString(item.target_date).split('T')[0],  // Extract date only from ISO format
                      surahAwal: toNumber(item.halaman_awal),
                      surahAkhir: toNumber(item.halaman_akhir),
                      nilaiTajwid: toNumber(item.nilai_tajwid),
                      nilaiKelancaran: toNumber(item.nilai_kelancaran),
                      nilaiMakhraj: toNumber(item.nilai_makhraj),
                      feedback: toString(item.feedback),
                    }));
                    if (!cancelled) setSetoranItems(setoranData);
                  }
                }
              } else {
                if (!cancelled) setSetoranForm((prev) => ({ ...prev, error: "Gagal memuat data setoran" }));
              }
            } catch (error) {
              console.error("Error loading setoran:", error);
              if (!cancelled) setSetoranForm((prev) => ({ ...prev, error: "Error memuat setoran" }));
            }
          })(),

          // Load pengumuman
          (async () => {
            try {
              const res = await fetch("/api/pengumuman", { credentials: "include" });
              if (res.ok) {
                const json = await res.json();
                if (json && Array.isArray(json.pengumuman)) {
                  if (!cancelled) {
                    const pengumumanData = json.pengumuman.map((item: Record<string, unknown>) => {
                      const publishDate = toString(item.publish_date);
                      return {
                        id: toNumber(item.id),
                        adminId: toNumber(item.admin_id),
                        title: toString(item.title),
                        content: toString(item.content),
                        publishDate: publishDate.split("T")[0],
                        targetRole: (toString(item.target_role) as UserRole | "semua") ?? "semua",
                      };
                    });
                    setPengumumanItems(pengumumanData);
                  }
                }
              } else {
                if (!cancelled) setSetoranForm((prev) => ({ ...prev, error: "Gagal memuat pengumuman" }));
              }
            } catch (error) {
              console.error("Error loading pengumuman:", error);
              if (!cancelled) setSetoranForm((prev) => ({ ...prev, error: "Error memuat pengumuman" }));
            }
          })(),

          // Load level hafalan
          (async () => {
            try {
              const res = await fetch("/api/progress?type=levels", { credentials: "include" });
              if (res.ok) {
                const json = await res.json();
                if (json && Array.isArray(json.levels)) {
                  if (!cancelled) {
                    const levelData = json.levels.map((item: Record<string, unknown>) => ({
                      id: toNumber(item.id),
                      namaLevel: toString(item.nama_level),
                      targetHalaman: toNumber(item.target_halaman),
                      badge: toString(item.badge),
                    }));
                    setLevelItems(levelData);
                  }
                }
              }
            } catch (error) {
              console.error("Error loading levels:", error);
            }
          })(),
        ]);

        if (!cancelled) {
          setDataLoaded(true);
        }
      } catch (error) {
        console.error("Error in dashboard initialization:", error);
        if (!cancelled) {
          router.replace("/admin/login");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  const canEditContent = currentRoleRaw === "admin" || currentRoleRaw === "musyrif";
  const isReadonly = !canEditContent;
  const isMusyrifRole = currentRoleRaw === "musyrif";

  const canManagePengumuman = (currentRoleRaw === "admin" || currentRoleRaw === "musyrif") && activeRole !== "anggota";
  const canManageUsers = isAdminState;

  const initialPasswordForm = {
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    error: null as string | null,
    success: null as string | null,
    isSubmitting: false,
  };

  const [passwordForm, setPasswordForm] = useState(initialPasswordForm);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  async function handleTambahUser(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isReadonly || !canManageUsers) return;

    const name = newUserForm.name.trim();
    const email = newUserForm.email.trim();
    const role = newUserForm.role;

    if (!name || !email) {
      setUserError("Nama dan email harus diisi.");
      return;
    }

    try {
      const response = await fetch("/api/users", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, role, active: true }),
      });

      const json = await response.json();

      if (!response.ok) {
        setUserError(json?.error || "Gagal menambahkan pengguna.");
        return;
      }

      if (!json?.user) {
        setUserError("Respons server tidak valid.");
        return;
      }

      setUsersState((previous) => [json.user, ...previous]);
      setNewUserForm({ name: "", email: "", role: "anggota" });
    } catch {
      setUserError("Tidak dapat terhubung ke server. Coba lagi nanti.");
    }
  }

  async function handleChangePassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPasswordForm((previous) => ({ ...previous, error: null, success: null, isSubmitting: true }));

    try {
      const response = await fetch("/api/auth/change-password", {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
          confirmPassword: passwordForm.confirmPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Gagal mengubah password.");
      }

      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
        error: null,
        success: "Password berhasil diperbarui.",
        isSubmitting: false,
      });

      setTimeout(() => {
        setIsPasswordModalOpen(false);
        setPasswordForm(initialPasswordForm);
      }, 1200);
    } catch (error) {
      setPasswordForm((previous) => ({
        ...previous,
        error: error instanceof Error ? error.message : "Gagal mengubah password.",
        success: null,
        isSubmitting: false,
      }));
    }
  }

  const summary = useMemo(() => {
    const totalAnggota = usersState.filter((user) => user.role === "anggota").length;
    const totalMusyrif = usersState.filter((user) => user.role === "musyrif").length;
    const totalAdmin = usersState.filter((user) => user.role === "admin").length;
    const totalSetoran = setoranItems.length;
    const referenceNow = new Date().setHours(0, 0, 0, 0);
    const avgNilai =
      totalSetoran === 0
        ? 0
        : Math.round(
            setoranItems.reduce((accumulator, item) => accumulator + avgScore(item.nilaiTajwid, item.nilaiKelancaran, item.nilaiMakhraj), 0) /
              totalSetoran,
          );
    const avgProgress =
      progressItems.length === 0
        ? 0
        : Math.round(progressItems.reduce((accumulator, item) => accumulator + item.persentase, 0) / progressItems.length);
    const setoranPekanIni = setoranItems.filter((item) => {
      const itemDate = parseDateString(item.targetDate);
      if (!itemDate) return false;
      const diff = referenceNow - itemDate.getTime();
      return diff >= 0 && diff <= 7 * 24 * 60 * 60 * 1000;
    }).length;

    return {
      totalAnggota,
      totalMusyrif,
      totalAdmin,
      totalSetoran,
      avgNilai,
      avgProgress,
      setoranPekanIni,
    };
  }, [progressItems, setoranItems, usersState]);

  const scoreTrend = useMemo(() => {
    const sorted = [...setoranItems]
      .filter((item) => !!parseDateString(item.targetDate))
      .sort((left, right) => left.targetDate.localeCompare(right.targetDate));
    const labels = sorted.map((item) => formatShortDate(item.targetDate));
    const scores = sorted.map((item) => avgScore(item.nilaiTajwid, item.nilaiKelancaran, item.nilaiMakhraj));
    return { labels, scores, chart: buildTrendChart(scores) };
  }, [setoranItems]);

  const roleBreakdown = useMemo(() => {
    const total = usersState.length;
    return (["admin", "musyrif", "anggota"] as UserRole[]).map((role) => {
      const count = usersState.filter((user) => user.role === role).length;
      return {
        role,
        label: roleLabels[role],
        count,
        percent: total === 0 ? 0 : Math.round((count / total) * 100),
      };
    });
  }, [usersState]);

  function handleTambahSetoran(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isReadonly) return;

    const resolvedMusyrifId = isMusyrifRole && currentUserId ? currentUserId : setoranForm.musyrifId;
    const payload = {
      anggota_id: setoranForm.anggotaId,
      musyrif_id: resolvedMusyrifId,
      target_date: setoranForm.targetDate || todayIso,
      halaman_awal: setoranForm.surahAwal,
      halaman_akhir: setoranForm.surahAkhir,
      nilai_tajwid: setoranForm.nilaiTajwid,
      nilai_kelancaran: setoranForm.nilaiKelancaran,
      nilai_makhraj: setoranForm.nilaiMakhraj,
      feedback: setoranForm.feedback,
    };

    void (async () => {
      try {
        const response = await fetch("/api/setoran", {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        const json = await response.json();

        if (!response.ok) {
          alert(json?.error || "Gagal menyimpan setoran.");
          return;
        }

        const savedItem = json?.setoran as Record<string, unknown> | undefined;
        const mappedItem: Setoran = {
          id: Number(savedItem?.id ?? setoranItems.length + 1),
          anggotaId: Number(savedItem?.anggota_id ?? setoranForm.anggotaId),
          musyrifId: Number(savedItem?.musyrif_id ?? resolvedMusyrifId),
          targetDate: String(savedItem?.target_date ?? setoranForm.targetDate),
          surahAwal: Number(savedItem?.halaman_awal ?? setoranForm.surahAwal),
          surahAkhir: Number(savedItem?.halaman_akhir ?? setoranForm.surahAkhir),
          nilaiTajwid: Number(savedItem?.nilai_tajwid ?? setoranForm.nilaiTajwid),
          nilaiKelancaran: Number(savedItem?.nilai_kelancaran ?? setoranForm.nilaiKelancaran),
          nilaiMakhraj: Number(savedItem?.nilai_makhraj ?? setoranForm.nilaiMakhraj),
          feedback: String(savedItem?.feedback ?? setoranForm.feedback),
        };

        setSetoranItems((previous) => [mappedItem, ...previous]);

        const deltaHalaman = Math.max(0, setoranForm.surahAkhir - setoranForm.surahAwal + 1);
        const existing = progressItems.find((item) => item.anggotaId === setoranForm.anggotaId);

        if (!existing) {
          const level = resolveLevel(deltaHalaman, levelItems);
          setProgressItems((previous) => [
            {
              id: previous.length + 1,
              anggotaId: setoranForm.anggotaId,
              totalHalaman: deltaHalaman,
              levelId: level.id,
              persentase: persentaseLevel(deltaHalaman, level.id, levelItems),
              lastUpdated: setoranForm.targetDate,
            },
            ...previous,
          ]);
        } else {
          const newTotal = existing.totalHalaman + deltaHalaman;
          const newLevel = resolveLevel(newTotal, levelItems);
          setProgressItems((previous) =>
            previous.map((item) => {
              if (item.id !== existing.id) {
                return item;
              }

              return {
                ...item,
                totalHalaman: newTotal,
                levelId: newLevel.id,
                persentase: persentaseLevel(newTotal, newLevel.id, levelItems),
                lastUpdated: setoranForm.targetDate,
              };
            })
          );
        }

        setSetoranForm((previous) => ({
          ...previous,
          surahAwal: 1,
          surahAkhir: 1,
          nilaiTajwid: 80,
          nilaiKelancaran: 80,
          nilaiMakhraj: 80,
          feedback: "",
        }));
      } catch (error) {
        console.error("Error creating setoran:", error);
        alert("Gagal terhubung ke server saat menyimpan setoran.");
      }
    })();
  }

  function handleEditSetoran(item: Setoran) {
    if (isReadonly) return;
    setSetoranForm({
      anggotaId: item.anggotaId,
      musyrifId: item.musyrifId,
      targetDate: item.targetDate,
      surahAwal: item.surahAwal,
      surahAkhir: item.surahAkhir,
      nilaiTajwid: item.nilaiTajwid,
      nilaiKelancaran: item.nilaiKelancaran,
      nilaiMakhraj: item.nilaiMakhraj,
      feedback: item.feedback,
    });
    setEditingSetoranId(item.id);
    // Scroll to form
    setTimeout(() => {
      document.getElementById("setoran")?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  }

  function handleDeleteSetoran(id: number) {
    if (isReadonly) return;
    if (!confirm("Apakah Anda yakin ingin menghapus data setoran ini?")) {
      return;
    }

    void (async () => {
      try {
        const response = await fetch(`/api/setoran/${id}`, {
          method: "DELETE",
          credentials: "include",
        });

        const json = await response.json().catch(() => ({}));

        if (!response.ok) {
          alert(json?.error || "Gagal menghapus setoran.");
          return;
        }

        setSetoranItems((previous) => previous.filter((item) => item.id !== id));
      } catch (error) {
        console.error("Error deleting setoran:", error);
        alert("Gagal terhubung ke server saat menghapus setoran.");
      }
    })();
  }

  function handleCancelEditSetoran() {
    setEditingSetoranId(null);
    setSetoranForm((previous) => ({
      ...previous,
      surahAwal: 1,
      surahAkhir: 1,
      nilaiTajwid: 80,
      nilaiKelancaran: 80,
      nilaiMakhraj: 80,
      feedback: "",
    }));
  }

  const filteredSetoranItems = setoranItems.filter((item) => {
    if (setoranFilterDateFrom && item.targetDate < setoranFilterDateFrom) return false;
    if (setoranFilterDateTo && item.targetDate > setoranFilterDateTo) return false;
    if (setoranFilterAnggota > 0 && item.anggotaId !== setoranFilterAnggota) return false;
    if (setoranFilterMusyrif > 0 && item.musyrifId !== setoranFilterMusyrif) return false;

    if (setoranFilterStatus) {
      const avg = avgScore(item.nilaiTajwid, item.nilaiKelancaran, item.nilaiMakhraj);
      if (setoranFilterStatus === "excellent" && avg < 85) return false;
      if (setoranFilterStatus === "good" && (avg < 70 || avg >= 85)) return false;
      if (setoranFilterStatus === "fair" && avg >= 70) return false;
    }

    return true;
  });

  function handleTambahPengumuman(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isReadonly) return;

    const title = pengumumanForm.title.trim();
    const content = pengumumanForm.content.trim();
    const publishDate = pengumumanForm.publishDate;

    if (!title || !content || !publishDate) {
      setPengumumanError("Judul, isi, dan tanggal publish wajib diisi.");
      return;
    }

    const payload = {
      title,
      content,
      publish_date: publishDate,
      target_role: pengumumanForm.targetRole,
    };

    void (async () => {
      try {
        const isEditing = editingPengumumanId !== null;
        const response = await fetch(isEditing ? `/api/pengumuman/${editingPengumumanId}` : "/api/pengumuman", {
          method: isEditing ? "PUT" : "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        const json = await response.json();

        if (!response.ok) {
          setPengumumanError(json?.error || "Gagal menyimpan pengumuman.");
          return;
        }

        const savedItem = (json?.pengumuman as Record<string, unknown> | undefined) ?? {
          id: editingPengumumanId ?? Date.now(),
          admin_id: pengumumanForm.adminId,
          title,
          content,
          publish_date: publishDate,
          target_role: pengumumanForm.targetRole,
        };

        const mappedItem: Pengumuman = {
          id: Number(savedItem.id ?? editingPengumumanId ?? pengumumanItems.length + 1),
          adminId: Number(savedItem.admin_id ?? pengumumanForm.adminId),
          title: toString(savedItem.title ?? title),
          content: toString(savedItem.content ?? content),
          publishDate: toString(savedItem.publish_date ?? publishDate).split("T")[0],
          targetRole: (toString(savedItem.target_role ?? pengumumanForm.targetRole) as UserRole | "semua") ?? "semua",
        };

        if (isEditing) {
          setPengumumanItems((previous) => previous.map((item) => (item.id === mappedItem.id ? mappedItem : item)));
        } else {
          setPengumumanItems((previous) => [mappedItem, ...previous]);
        }

        setPengumumanForm((previous) => ({ ...previous, title: "", content: "", publishDate: getTodayISO(), targetRole: "semua" }));
        setEditingPengumumanId(null);
        setPengumumanError(null);
      } catch (error) {
        console.error("Error creating/updating pengumuman:", error);
        setPengumumanError("Gagal terhubung ke server saat menyimpan pengumuman.");
      }
    })();
  }

  function handleEditPengumuman(item: Pengumuman) {
    if (isReadonly) return;
    setPengumumanForm({
      adminId: item.adminId,
      title: item.title,
      content: item.content,
      publishDate: item.publishDate,
      targetRole: item.targetRole,
    });
    setEditingPengumumanId(item.id);
    setPengumumanError(null);
    setTimeout(() => {
      document.getElementById("pengumuman-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  }

  function handleDeletePengumuman(id: number) {
    if (isReadonly) return;
    if (!window.confirm("Apakah Anda yakin ingin menghapus pengumuman ini?")) {
      return;
    }

    void (async () => {
      try {
        const response = await fetch(`/api/pengumuman/${id}`, {
          method: "DELETE",
          credentials: "include",
        });

        const json = await response.json().catch(() => ({}));

        if (!response.ok) {
          alert(json?.error || "Gagal menghapus pengumuman.");
          return;
        }

        setPengumumanItems((previous) => previous.filter((item) => item.id !== id));
        if (editingPengumumanId === id) {
          setEditingPengumumanId(null);
          setPengumumanForm((previous) => ({ ...previous, title: "", content: "", publishDate: getTodayISO(), targetRole: "semua" }));
        }
      } catch (error) {
        console.error("Error deleting pengumuman:", error);
        alert("Gagal terhubung ke server saat menghapus pengumuman.");
      }
    })();
  }

  function handleCancelEditPengumuman() {
    setEditingPengumumanId(null);
    setPengumumanError(null);
    setPengumumanForm((previous) => ({ ...previous, title: "", content: "", publishDate: getTodayISO(), targetRole: "semua" }));
  }

  function formatTargetRoleLabel(targetRole: UserRole | "semua") {
    if (targetRole === "semua") return "Semua";
    if (targetRole === "admin") return "Admin";
    if (targetRole === "musyrif") return "Musyrif";
    return "Anggota";
  }

  const activeAnnouncements = useMemo(() => {
    const list = activeRole === "admin"
      ? [...pengumumanItems].sort((a, b) => b.publishDate.localeCompare(a.publishDate))
      : pengumumanItems.filter((item) => item.targetRole === "semua" || item.targetRole === activeRole);

    return list.sort((a, b) => b.publishDate.localeCompare(a.publishDate));
  }, [activeRole, pengumumanItems]);

  return (
    <div className="min-h-screen">
      <div className="mx-auto flex min-h-screen w-full max-w-[1800px] px-6">
        <aside className="sticky top-0 hidden h-screen max-h-screen w-64 shrink-0 overflow-y-auto border-r border-teal-300/20 bg-linear-to-b from-slate-950 via-cyan-950 to-slate-950/95 px-5 py-6 text-white xl:flex xl:flex-col">
          <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-5 shadow-xl shadow-slate-950/20 backdrop-blur">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-400/15 text-teal-200">
                <Icon name="dashboard" className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-semibold tracking-[0.22em] text-teal-200 uppercase">SIM Hafalan</p>
                <h1 className="font-display text-2xl">LDK Panel</h1>
              </div>
            </div>

            <div className="mt-6 space-y-1 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
              <p className="font-semibold text-white">Mode Peran</p>
              <p>{isAdminState ? `Aktif sebagai ${roleLabels[activeRole]}` : "Anda sedang berada dalam mode pengunjung."}</p>
            </div>
          </div>

          <nav className="mt-6 grid gap-2">
            {(activeRole === "anggota" ? navItems.filter((item) => item.label !== "Jadwal") : navItems).map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-cyan-100 transition hover:bg-cyan-400/10 hover:text-white"
              >
                <Icon name={item.icon} className="text-teal-300" />
                <span>{item.label}</span>
              </a>
            ))}
          </nav>

          <div className="mt-auto pt-6 space-y-3">
            {currentRoleRaw && currentRoleRaw !== "admin" ? (
              <button
                type="button"
                onClick={() => setIsPasswordModalOpen(true)}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-cyan-400/30 bg-cyan-500/10 px-4 py-3 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-500/20"
              >
                <Icon name="users" />
                Ubah Password
              </button>
            ) : null}

            {currentRoleRaw ? (
              <button
                type="button"
                onClick={() => {
                  logoutAdmin();
                  setIsAdminState(false);
                  setActiveRole("anggota");
                }}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                <Icon name="logout" />
                Logout
              </button>
            ) : null}
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b border-white/70 bg-[rgba(247,250,252,0.82)] backdrop-blur-xl">
            <div className="flex items-center gap-3 px-4 py-4 sm:px-6 lg:px-8">
              <div className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl border border-cyan-200/80 bg-cyan-50 px-4 py-3 shadow-sm">
                <Icon name="search" className="text-cyan-500" />
                <input
                  type="search"
                  className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-500"
                  placeholder="Cari jadwal, anggota, atau pengumuman"
                />
              </div>

              <div className="hidden items-center gap-3 lg:flex">
                <div className="rounded-2xl border border-cyan-200/70 bg-cyan-50 px-4 py-3 text-right shadow-sm">
                  <p className="text-[11px] font-semibold tracking-[0.16em] text-slate-500 uppercase">Hari ini</p>
                  <p className="mt-1 text-sm font-semibold text-slate-950">{formatLongDate(todayIso)}</p>
                </div>
              </div>
            </div>
          </header>

          <main className="flex-1 space-y-6 px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
            <section id="overview" className="panel overflow-hidden rounded-[2rem] border border-slate-200/80 p-6 lg:p-8">
              <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
                <div className="max-w-3xl space-y-4">
                  <div className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-4 py-2 text-xs font-semibold tracking-[0.18em] text-teal-900 uppercase">
                    Dashboard Operasional
                  </div>
                  <div className="space-y-3">
                    <h2 className="font-display text-3xl leading-tight text-slate-950 md:text-5xl">
                      Sistem Informasi Manajemen Setoran Hafalan LDK
                    </h2>
                    <p className="max-w-2xl text-sm leading-relaxed text-slate-600 md:text-base">
                      Pusat kontrol untuk jadwal setoran, input nilai, progress hafalan, murojaah, pengumuman, dan laporan.
                      Visualnya dibuat seperti dashboard admin modern dengan navigasi kiri, statistik ringkas, grafik, dan tabel data.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    {activeRole !== "anggota" ? (
                      <a href="#setoran" className="rounded-2xl bg-cyan-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-cyan-500">
                        Input Setoran
                      </a>
                    ) : null}
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:w-[560px]">
                  <StatCard label="Total Anggota" value={summary.totalAnggota} accent="teal" />
                  <StatCard label="Total Musyrif" value={summary.totalMusyrif} accent="cyan" />
                  <StatCard label="Setoran Pekan Ini" value={summary.setoranPekanIni} accent="amber" />
                  <StatCard label="Rata-Rata Nilai" value={summary.avgNilai} accent="slate" />
                </div>
              </div>
            </section>

            <section className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
              <article className="panel rounded-[2rem] p-6">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold tracking-[0.16em] text-teal-800 uppercase">Grafik Setoran</p>
                    <h3 className="font-display mt-2 text-2xl text-slate-950">Tren nilai setoran</h3>
                  </div>
                  <span className="rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-800">{scoreTrend.scores.length} data</span>
                </div>

                <div className="mt-5 rounded-[1.5rem] border border-slate-200 bg-white p-4">
                  <svg viewBox="0 0 620 240" className="h-[240px] w-full">
                    <defs>
                      <linearGradient id="trendFill" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#14b8a6" stopOpacity="0.28" />
                        <stop offset="100%" stopColor="#14b8a6" stopOpacity="0.02" />
                      </linearGradient>
                    </defs>
                    {[40, 70, 100, 130, 160, 190].map((line) => (
                      <line key={line} x1="26" x2="594" y1={line} y2={line} stroke="#e2e8f0" strokeDasharray="4 6" />
                    ))}
                    {scoreTrend.chart.area ? <path d={scoreTrend.chart.area} fill="url(#trendFill)" /> : null}
                    {scoreTrend.chart.line ? <path d={scoreTrend.chart.line} fill="none" stroke="#0f766e" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" /> : null}
                    {scoreTrend.chart.points.map((point, index) => (
                      <g key={`${point.x}-${point.y}`}>
                        <circle cx={point.x} cy={point.y} r="5.5" fill="#fff" stroke="#0f766e" strokeWidth="3" />
                        <text x={point.x} y="220" textAnchor="middle" fill="#64748b" fontSize="12">
                          {scoreTrend.labels[index]}
                        </text>
                        <text x={point.x} y={point.y - 12} textAnchor="middle" fill="#0f172a" fontSize="12" fontWeight="700">
                          {scoreTrend.scores[index]}
                        </text>
                      </g>
                    ))}
                  </svg>
                </div>
              </article>

              <article className="panel rounded-[2rem] p-6">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold tracking-[0.16em] text-teal-800 uppercase">Distribusi Role</p>
                    <h3 className="font-display mt-2 text-2xl text-slate-950">Komposisi pengguna</h3>
                  </div>
                  <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">{usersState.length} akun</span>
                </div>

                <div className="mt-5 flex items-center gap-6 rounded-[1.5rem] border border-slate-200 bg-white p-4">
                  <div className="relative flex h-44 w-44 items-center justify-center">
                    <svg viewBox="0 0 120 120" className="h-44 w-44 -rotate-90">
                      <circle cx="60" cy="60" r="42" fill="none" stroke="#e2e8f0" strokeWidth="16" />
                      {roleBreakdown.map((item, index) => {
                        const segments = roleBreakdown.map((segment) => segment.percent);
                        const offset = segments.slice(0, index).reduce((accumulator, value) => accumulator + value, 0);
                        const dasharray = `${item.percent} ${100 - item.percent}`;
                        const stroke = index === 0 ? "#14b8a6" : index === 1 ? "#0ea5e9" : "#f59e0b";
                        return (
                          <circle
                            key={item.role}
                            cx="60"
                            cy="60"
                            r="42"
                            fill="none"
                            stroke={stroke}
                            strokeWidth="16"
                            strokeDasharray={dasharray}
                            strokeDashoffset={-offset}
                            strokeLinecap="round"
                          />
                        );
                      })}
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center rounded-full bg-white/95 text-center shadow-inner">
                      <p className="text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase">Total</p>
                      <p className="font-display text-3xl text-slate-950">{usersState.length}</p>
                    </div>
                  </div>

                  <div className="flex-1 space-y-3">
                    {roleBreakdown.map((item, index) => (
                      <div key={item.role} className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span className={`h-3.5 w-3.5 rounded-full ${index === 0 ? "bg-teal-500" : index === 1 ? "bg-sky-500" : "bg-amber-500"}`} />
                          <div>
                            <p className="text-sm font-semibold text-slate-950">{item.label}</p>
                            <p className="text-xs text-slate-500">{item.percent}% dari total akun</p>
                          </div>
                        </div>
                        <p className="font-display text-2xl text-slate-950">{item.count}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </article>
            </section>

            {activeRole !== "anggota" ? (
              <section id="setoran" className="grid gap-6">
                <article className="panel mx-auto w-full max-w-[1500px] rounded-[2rem] p-6 lg:p-8">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold tracking-[0.16em] text-teal-800 uppercase">Input Setoran {editingSetoranId !== null ? "(Edit Mode)" : ""}</p>
                      <h3 className="font-display mt-2 text-2xl text-slate-950">Penilaian setelah setoran tatap muka</h3>
                    </div>
                  </div>

                  <div className="mx-auto w-full max-w-[1200px]">
                    <form onSubmit={handleTambahSetoran} data-editable="true" className={`mt-5 grid gap-4 ${isReadonly ? "opacity-50 pointer-events-none" : ""}`}>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <label className="grid gap-2 text-sm">
                          <span className="font-semibold text-slate-700">Anggota</span>
                          <select
                            className="input-field"
                            value={setoranForm.anggotaId}
                            onChange={(event) => setSetoranForm((previous) => ({ ...previous, anggotaId: Number(event.target.value) }))}
                            disabled={isReadonly}
                          >
                            <option value={0} disabled>
                              Pilih anggota
                            </option>
                            {usersState.filter((user) => user.role === "anggota").map((user) => (
                              <option key={user.id} value={user.id}>
                                {user.name}
                              </option>
                            ))}
                          </select>
                        </label>

                        {!isMusyrifRole ? (
                          <label className="grid gap-2 text-sm">
                            <span className="font-semibold text-slate-700">Musyrif</span>
                            <select
                              className="input-field"
                              value={setoranForm.musyrifId}
                              onChange={(event) => setSetoranForm((previous) => ({ ...previous, musyrifId: Number(event.target.value) }))}
                              disabled={isReadonly}
                            >
                              <option value={0} disabled>
                                Pilih musyrif
                              </option>
                              {usersState.filter((user) => user.role === "musyrif").map((user) => (
                                <option key={user.id} value={user.id}>
                                  {user.name}
                                </option>
                              ))}
                            </select>
                          </label>
                        ) : null}
                      </div>

                      <div className="grid gap-4 sm:grid-cols-3">
                        <label className="grid gap-2 text-sm">
                          <span className="font-semibold text-slate-700">Surah Awal</span>
                          <select
                            className="input-field"
                            value={setoranForm.surahAwal}
                            onChange={(event) => setSetoranForm((previous) => ({ ...previous, surahAwal: Number(event.target.value) }))}
                            disabled={isReadonly}
                          >
                            {surahList.map((surah, index) => (
                              <option key={surah} value={index + 1}>
                                {index + 1}. {surah}
                              </option>
                            ))}
                          </select>
                        </label>

                        <label className="grid gap-2 text-sm">
                          <span className="font-semibold text-slate-700">Surah Akhir</span>
                          <select
                            className="input-field"
                            value={setoranForm.surahAkhir}
                            onChange={(event) => setSetoranForm((previous) => ({ ...previous, surahAkhir: Number(event.target.value) }))}
                            disabled={isReadonly}
                          >
                            {surahList.map((surah, index) => (
                              <option key={surah} value={index + 1} disabled={index + 1 < setoranForm.surahAwal}>
                                {index + 1}. {surah}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-3">
                        <label className="grid gap-2 text-sm">
                          <span className="font-semibold text-slate-700">Tajwid</span>
                          <input
                            type="number"

                            min={0}
                            max={100}
                            className="input-field"
                            value={setoranForm.nilaiTajwid}
                            onChange={(event) => setSetoranForm((previous) => ({ ...previous, nilaiTajwid: Number(event.target.value) }))}
                            disabled={isReadonly}
                          />
                        </label>
                        <label className="grid gap-2 text-sm">
                          <span className="font-semibold text-slate-700">Kelancaran</span>
                          <input
                            type="number"
                            min={0}
                            max={100}
                            className="input-field"
                            value={setoranForm.nilaiKelancaran}
                            onChange={(event) => setSetoranForm((previous) => ({ ...previous, nilaiKelancaran: Number(event.target.value) }))}
                            disabled={isReadonly}
                          />
                        </label>
                        <label className="grid gap-2 text-sm">
                          <span className="font-semibold text-slate-700">Makhraj</span>
                          <input
                            type="number"
                            min={0}
                            max={100}
                            className="input-field"
                            value={setoranForm.nilaiMakhraj}
                            onChange={(event) => setSetoranForm((previous) => ({ ...previous, nilaiMakhraj: Number(event.target.value) }))}
                            disabled={isReadonly}
                          />
                        </label>
                      </div>

                      <label className="grid gap-2 text-sm">
                        <span className="font-semibold text-slate-700">Feedback</span>
                        <textarea
                          rows={4}
                          className="input-field"
                          value={setoranForm.feedback}
                          onChange={(event) => setSetoranForm((previous) => ({ ...previous, feedback: event.target.value }))}
                          placeholder="Catatan tajwid, kelancaran, atau target perbaikan"
                          disabled={isReadonly}
                        />
                      </label>

                      <label className="grid gap-2 text-sm sm:w-1/2">
                        <span className="font-semibold text-slate-700">Tanggal Setoran</span>
                        <input
                          type="date"
                          className="input-field"
                          value={setoranForm.targetDate || todayIso}
                          min={todayIso}
                          onChange={(event) => setSetoranForm((previous) => ({ ...previous, targetDate: event.target.value }))}
                          disabled={isReadonly}
                        />
                      </label>

                      <div className="flex gap-3">
                        <button type="submit" disabled={isReadonly} className={`flex-1 rounded-2xl bg-teal-600 px-5 py-3.5 text-sm font-semibold text-white transition ${isReadonly ? "opacity-60 cursor-not-allowed" : "hover:bg-teal-500"}`}>
                          {editingSetoranId !== null ? "Perbarui Penilaian" : "Simpan Penilaian"}
                        </button>
                        {editingSetoranId !== null && (
                          <button
                            type="button"
                            onClick={handleCancelEditSetoran}
                            disabled={isReadonly}
                            className={`rounded-2xl border border-slate-300 bg-white px-5 py-3.5 text-sm font-semibold text-slate-700 transition ${isReadonly ? "opacity-60 cursor-not-allowed" : "hover:bg-slate-50"}`}
                          >
                            Batal
                          </button>
                        )}
                      </div>
                    </form>
                  </div>
                </article>
              </section>
            ) : null}

            <section id="daftar-setoran" className="panel rounded-[2rem] p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-semibold tracking-[0.16em] text-teal-800 uppercase">Daftar Setoran</p>
                  <h3 className="font-display mt-2 text-2xl text-slate-950">Rekap lengkap data setoran</h3>
                </div>
                <span className="rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-800">{filteredSetoranItems.length} baris</span>
              </div>

              {/* Filter anggota chips */}
              <div className="mt-4">
                {/* compute unique anggota list from setoranItems */}
                {(() => {
                  const anggotaList = Array.from(
                    new Map(
                      setoranItems.map((s) => [s.anggotaId, usersById.get(s.anggotaId)?.name ?? `Anggota ${s.anggotaId}`])
                    ).entries()
                  ).map(([id, name]) => ({ id, name }));

                  return (
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setSetoranFilterAnggota(0)}
                        className={`px-3 py-1 rounded-full text-sm font-medium ${setoranFilterAnggota === 0 ? "bg-sky-600 text-white" : "bg-slate-100 text-slate-700"}`}
                      >
                        Semua
                      </button>
                      {anggotaList.map((a) => (
                        <button
                          key={a.id}
                          type="button"
                          onClick={() => setSetoranFilterAnggota((prev) => (prev === a.id ? 0 : a.id))}
                          className={`px-3 py-1 rounded-full text-sm font-medium ${setoranFilterAnggota === a.id ? "bg-sky-600 text-white" : "bg-slate-100 text-slate-700"}`}
                        >
                          {a.name}
                        </button>
                      ))}
                    </div>
                  );
                })()}
              </div>

              <div className="mt-6 overflow-x-auto rounded-[1.5rem] border border-slate-200 bg-white">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="px-4 py-3 text-left font-semibold text-slate-700">Tanggal</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700">Anggota</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700">Musyrif</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700">Surah</th>
                      <th className="px-4 py-3 text-center font-semibold text-slate-700">Rentang Surah</th>
                      <th className="px-4 py-3 text-center font-semibold text-slate-700">Tajwid</th>
                      <th className="px-4 py-3 text-center font-semibold text-slate-700">Kelancaran</th>
                      <th className="px-4 py-3 text-center font-semibold text-slate-700">Makhraj</th>
                      <th className="px-4 py-3 text-center font-semibold text-slate-700">Rata-rata</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700">Feedback</th>
                      <th className="px-4 py-3 text-center font-semibold text-slate-700">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSetoranItems.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="px-4 py-6 text-center text-slate-500">
                          Tidak ada data setoran sesuai filter.
                        </td>
                      </tr>
                    ) : (
                      [...filteredSetoranItems]
                        .sort((a, b) => b.targetDate.localeCompare(a.targetDate))
                        .map((item, index) => {
                          const anggota = usersById.get(item.anggotaId);
                          const musyrif = usersById.get(item.musyrifId);
                          const avgNilai = avgScore(item.nilaiTajwid, item.nilaiKelancaran, item.nilaiMakhraj);
                          const rowBg = index % 2 === 0 ? "bg-white" : "bg-slate-50/50";
                          const scoreColor = (score: number) => {
                            if (score >= 85) return "bg-emerald-50 text-emerald-800";
                            if (score >= 70) return "bg-cyan-50 text-cyan-800";
                            return "bg-amber-50 text-amber-800";
                          };

                          return (
                            <tr key={item.id} className={`border-b border-slate-100 ${rowBg}`}>
                              <td className="px-4 py-3 text-slate-700">{formatShortDate(item.targetDate)}</td>
                              <td className="px-4 py-3">
                                <p className="font-semibold text-slate-950">{anggota?.name ?? "Unknown"}</p>
                              </td>
                              <td className="px-4 py-3 text-slate-700">{musyrif?.name ?? "Unknown"}</td>
                              <td className="px-4 py-3 text-slate-700">{item.surahAwal === item.surahAkhir ? `${item.surahAwal}. ${surahList[item.surahAwal - 1]}` : `${item.surahAwal}-${item.surahAkhir}`}</td>
                              <td className="px-4 py-3 text-center text-slate-700">
                                <span className="rounded-lg bg-slate-100 px-2.5 py-1 font-semibold text-slate-900">
                                  {item.surahAwal}-{item.surahAkhir}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <span className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${scoreColor(item.nilaiTajwid)}`}>
                                  {item.nilaiTajwid}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <span className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${scoreColor(item.nilaiKelancaran)}`}>
                                  {item.nilaiKelancaran}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <span className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${scoreColor(item.nilaiMakhraj)}`}>
                                  {item.nilaiMakhraj}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <span className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${scoreColor(avgNilai)}`}>
                                  {avgNilai}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <p className="max-w-xs truncate text-sm text-slate-600">{item.feedback || "-"}</p>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center justify-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleEditSetoran(item)}
                                    disabled={isReadonly}
                                    className="rounded-lg bg-cyan-50 px-3 py-1.5 text-xs font-semibold text-cyan-800 transition hover:bg-cyan-100 disabled:cursor-not-allowed disabled:opacity-50"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteSetoran(item.id)}
                                    disabled={isReadonly}
                                    className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-800 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                                  >
                                    Hapus
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            {activeRole === "admin" ? (
              <section id="anggota" className="panel rounded-[2rem] p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold tracking-[0.16em] text-teal-800 uppercase">Data Anggota</p>
                    <h3 className="font-display mt-2 text-2xl text-slate-950">Tambah nama anggota atau musyrif</h3>
                  </div>
                  <span className="rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-800">{usersState.length} akun</span>
                </div>

                <form onSubmit={handleTambahUser} className="mt-6 grid gap-4">
                  <div className="grid gap-4 sm:grid-cols-3">
                    <label className="grid gap-2 text-sm">
                      <span className="font-semibold text-slate-700">Nama</span>
                      <input
                        className="input-field"
                        value={newUserForm.name}
                        onChange={(event) => setNewUserForm((previous) => ({ ...previous, name: event.target.value }))}
                        disabled={!canManageUsers}
                        required
                      />
                    </label>

                    <label className="grid gap-2 text-sm">
                      <span className="font-semibold text-slate-700">Email</span>
                      <input
                        type="email"
                        className="input-field"
                        value={newUserForm.email}
                        onChange={(event) => setNewUserForm((previous) => ({ ...previous, email: event.target.value }))}
                        disabled={!canManageUsers}
                        required
                      />
                    </label>

                    <label className="grid gap-2 text-sm">
                      <span className="font-semibold text-slate-700">Peran</span>
                      <select
                        className="input-field"
                        value={newUserForm.role}
                        onChange={(event) => setNewUserForm((previous) => ({ ...previous, role: event.target.value as UserRole }))}
                        disabled={!canManageUsers}
                      >
                        <option value="anggota">Anggota</option>
                        <option value="musyrif">Musyrif</option>
                      </select>
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={!canManageUsers}
                    className="rounded-2xl bg-emerald-700 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                  >
                    Tambah Pengguna Baru
                  </button>

                  {userError ? <p className="mt-3 text-sm text-red-700">{userError}</p> : null}

                  {!canManageUsers ? (
                    <p className="text-xs text-red-700">Login sebagai Administrator untuk dapat menambah anggota atau musyrif baru.</p>
                  ) : null}
                </form>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  {usersState.map((user) => (
                    <article key={user.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-teal-200 hover:shadow-md">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-slate-950">{user.name}</p>
                          <p className="truncate text-sm text-slate-600">{user.email}</p>
                        </div>
                        <span className="rounded-full bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">{roleLabels[user.role]}</span>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ) : null}

            <section id="pengumuman" className={`grid gap-6 ${activeRole === "anggota" ? "xl:grid-cols-[1.65fr_0.95fr]" : "xl:grid-cols-[1.3fr_1fr]"}`}>
              <article className="panel rounded-[2rem] p-6">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold tracking-[0.16em] text-teal-800 uppercase">Pengumuman</p>
                    <h3 className="font-display mt-2 text-2xl text-slate-950">Informasi aktif</h3>
                  </div>
                  <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">Mode: {roleLabels[activeRole]}</span>
                </div>

                <div className="mt-5 space-y-3">
                  {activeAnnouncements.length > 0 ? (
                    activeAnnouncements.map((item) => (
                      <article key={item.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-teal-200 hover:shadow-md">
                        <div className="flex items-center justify-between gap-3">
                          <h4 className="font-semibold text-slate-950">{item.title}</h4>
                          <span className="shrink-0 text-xs text-slate-500">{formatShortDate(item.publishDate)}</span>
                        </div>
                        <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.content}</p>
                        <div className="mt-3 flex items-center justify-between gap-3">
                          <p className="text-xs font-semibold tracking-[0.16em] text-teal-800 uppercase">Target {formatTargetRoleLabel(item.targetRole)}</p>
                          {activeRole === "admin" || activeRole === "musyrif" ? (
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleEditPengumuman(item)}
                                className="rounded-lg border border-cyan-200 bg-cyan-50 px-2.5 py-1.5 text-xs font-semibold text-cyan-800 transition hover:bg-cyan-100"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeletePengumuman(item.id)}
                                className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-800 transition hover:bg-red-100"
                              >
                                Hapus
                              </button>
                            </div>
                          ) : null}
                        </div>
                      </article>
                    ))
                  ) : (
                    <div className="flex min-h-[220px] items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50/80 p-6 text-center">
                      <div>
                        <p className="text-base font-semibold text-slate-700">Belum ada pengumuman untuk {roleLabels[activeRole].toLowerCase()}.</p>
                        <p className="mt-2 text-sm text-slate-500">Informasi penting akan muncul di sini saat admin menyiarkannya.</p>
                      </div>
                    </div>
                  )}
                </div>
              </article>

              {activeRole !== "anggota" && (
                <article className="panel rounded-[2rem] p-6">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold tracking-[0.16em] text-teal-800 uppercase">Kelola Pengumuman</p>
                      <h3 className="font-display mt-2 text-2xl text-slate-950">Panel admin</h3>
                    </div>
                  </div>

                  <form id="pengumuman-form" onSubmit={handleTambahPengumuman} data-editable="true" className={`mt-5 grid gap-4 ${(!canManagePengumuman || isReadonly) ? "opacity-50 pointer-events-none" : ""}`}>
                    {pengumumanError ? <p className="text-sm font-medium text-red-700">{pengumumanError}</p> : null}
                    <label className="grid gap-2 text-sm">
                      <span className="font-semibold text-slate-700">Judul</span>
                      <input
                        className="input-field"
                        value={pengumumanForm.title}
                        onChange={(event) => setPengumumanForm((previous) => ({ ...previous, title: event.target.value }))}
                        disabled={!canManagePengumuman}
                        required
                      />
                    </label>

                    <label className="grid gap-2 text-sm">
                      <span className="font-semibold text-slate-700">Isi</span>
                      <textarea
                        rows={4}
                        className="input-field"
                        value={pengumumanForm.content}
                        onChange={(event) => setPengumumanForm((previous) => ({ ...previous, content: event.target.value }))}
                        disabled={!canManagePengumuman}
                        required
                      />
                    </label>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="grid gap-2 text-sm">
                        <span className="font-semibold text-slate-700">Tanggal Publish</span>
                        <input
                          type="date"
                          className="input-field"
                          value={pengumumanForm.publishDate}
                          min={todayIso}
                          onChange={(event) => setPengumumanForm((previous) => ({ ...previous, publishDate: event.target.value }))}
                          disabled={!canManagePengumuman}
                        />
                      </label>

                      <label className="grid gap-2 text-sm">
                        <span className="font-semibold text-slate-700">Target</span>
                        <select
                          className="input-field"
                          value={pengumumanForm.targetRole}
                          onChange={(event) =>
                            setPengumumanForm((previous) => ({
                              ...previous,
                              targetRole: event.target.value as UserRole | "semua",
                            }))
                          }
                          disabled={!canManagePengumuman}
                        >
                          <option value="semua">Semua</option>
                          <option value="anggota">Anggota</option>
                          <option value="musyrif">Musyrif</option>
                          <option value="admin">Admin</option>
                        </select>
                      </label>
                    </div>

                    <div className="flex gap-3">
                      <button
                        type="submit"
                        disabled={!canManagePengumuman || isReadonly}
                        className={`flex-1 rounded-2xl bg-amber-600 px-5 py-3.5 text-sm font-semibold text-white transition ${(!canManagePengumuman || isReadonly) ? "opacity-60 cursor-not-allowed" : "hover:bg-amber-700 disabled:cursor-not-allowed disabled:bg-slate-400"}`}
                      >
                        {editingPengumumanId !== null ? "Perbarui Pengumuman" : "Tambah Pengumuman"}
                      </button>

                      {editingPengumumanId !== null ? (
                        <button
                          type="button"
                          onClick={handleCancelEditPengumuman}
                          className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                        >
                          Batal
                        </button>
                      ) : null}
                    </div>

                    {!canManagePengumuman ? <p className="text-xs font-semibold text-red-700">Akses ditolak: login sebagai Admin untuk mengelola pengumuman.</p> : null}
                  </form>
                </article>
              )}
            </section>
          </main>
        </div>
      </div>

      {/* Password Change Modal */}
      {isPasswordModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[2rem] border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold tracking-[0.16em] text-teal-800 uppercase">Akun</p>
                <h3 className="font-display mt-2 text-2xl text-slate-950">Ubah Password</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsPasswordModalOpen(false);
                  setPasswordForm(initialPasswordForm);
                }}
                className="rounded-full border border-slate-200 px-2.5 py-1.5 text-sm text-slate-600 transition hover:bg-slate-50"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleChangePassword} className="mt-5 space-y-4">
              <label className="grid gap-2 text-sm">
                <span className="font-semibold text-slate-700">Password Saat Ini</span>
                <input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(event) => setPasswordForm((previous) => ({ ...previous, currentPassword: event.target.value }))}
                  className="input-field"
                  placeholder="Masukkan password lama"
                  required
                />
              </label>

              <label className="grid gap-2 text-sm">
                <span className="font-semibold text-slate-700">Password Baru</span>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(event) => setPasswordForm((previous) => ({ ...previous, newPassword: event.target.value }))}
                  className="input-field"
                  placeholder="Minimal 6 karakter"
                  minLength={6}
                  required
                />
              </label>

              <label className="grid gap-2 text-sm">
                <span className="font-semibold text-slate-700">Konfirmasi Password Baru</span>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(event) => setPasswordForm((previous) => ({ ...previous, confirmPassword: event.target.value }))}
                  className="input-field"
                  placeholder="Ulangi password baru"
                  minLength={6}
                  required
                />
              </label>

              {passwordForm.error ? <p className="text-sm font-medium text-red-700">{passwordForm.error}</p> : null}
              {passwordForm.success ? <p className="text-sm font-medium text-emerald-700">{passwordForm.success}</p> : null}

              <button
                type="submit"
                disabled={passwordForm.isSubmitting}
                className="w-full rounded-2xl bg-cyan-600 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {passwordForm.isSubmitting ? "Memproses..." : "Simpan Password Baru"}
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function MiniRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-cyan-50/90 px-3 py-2 text-sm shadow-sm">
      <span className="text-cyan-700">{label}</span>
      <span className="font-semibold text-cyan-950">{value}</span>
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: number; accent: "teal" | "cyan" | "amber" | "slate" }) {
  const gradient =
    accent === "teal"
      ? "from-teal-600 via-cyan-500 to-sky-500"
      : accent === "cyan"
        ? "from-cyan-600 via-sky-500 to-teal-500"
        : accent === "amber"
          ? "from-amber-500 via-orange-400 to-amber-600"
          : "from-slate-700 via-slate-600 to-slate-500";

  return (
    <article className={`rounded-[1.6rem] bg-linear-to-br ${gradient} p-4 text-white shadow-xl shadow-cyan-200/40`}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold tracking-[0.16em] uppercase text-white/85">{label}</p>
          <p className="font-display mt-2 text-3xl text-white">{value}</p>
        </div>
        <div className="h-12 w-12 rounded-2xl bg-white/15 ring-1 ring-white/30" />
      </div>
    </article>
  );
}