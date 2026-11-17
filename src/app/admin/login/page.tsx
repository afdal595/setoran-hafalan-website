"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { UserRole } from "@/lib/mock-data";

export default function AdminLoginPage() {
  const router = useRouter();
  const [role, setRole] = useState<UserRole>("admin");
  const [email, setEmail] = useState("admin@ldk.ac.id");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const defaultCredentials: Record<UserRole, { email: string; password: string }> = {
    admin: { email: "admin@ldk.ac.id", password: "" },
    musyrif: { email: "musyrif1@ldk.ac.id", password: "" },
    anggota: { email: "anggota1@ldk.ac.id", password: "" },
  };

  function syncDefaultCredentials(nextRole: UserRole) {
    const nextCredentials = defaultCredentials[nextRole];
    setEmail(nextCredentials.email);
    setPassword(nextCredentials.password);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const submitEmail = email.trim();
    const submitPassword = password;

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, email: submitEmail, password: submitPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Login gagal");
      }

      router.replace("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login gagal — periksa peran, email, dan kata sandi.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-7xl items-center px-4 py-6 sm:px-6 lg:px-8">
      <div className="panel grid w-full overflow-hidden rounded-4xl lg:grid-cols-[0.95fr_1.05fr]">
        <aside className="relative overflow-hidden bg-slate-950 px-6 py-8 text-white sm:px-8 lg:p-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(45,212,191,0.18),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.12),transparent_30%)]" />
          <div className="relative flex h-full flex-col justify-between gap-10">
            <div className="space-y-5">
              <div className="inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold tracking-[0.18em] text-teal-200 uppercase">
                Admin Access
              </div>
              <div className="space-y-3">
                <h1 className="font-display text-4xl leading-tight md:text-5xl">Masuk ke pusat kendali hafalan.</h1>
                <p className="max-w-md text-sm leading-relaxed text-slate-300 md:text-base">
                  Login admin membuka akses untuk mengelola pengumuman, data mahasiswa hafal, dan kontrol tampilan dashboard.
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {[
                ["Sidebar", "Navigasi terstruktur dan cepat"],
                ["Chart", "Ringkasan visual progres"],
                ["Role", "Admin, musyrif, anggota"],
                ["Print", "Laporan siap dicetak"],
              ].map(([title, desc]) => (
                <article key={title} className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                  <p className="text-sm font-semibold">{title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-300">{desc}</p>
                </article>
              ))}
            </div>
          </div>
        </aside>

        <section className="bg-white px-6 py-8 sm:px-8 lg:p-10">
          <div className="mb-8 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold tracking-[0.18em] text-teal-800 uppercase">Login Admin</p>
              <h2 className="font-display mt-2 text-3xl text-slate-950">Selamat datang kembali.</h2>
            </div>
            <Link href="/" className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-teal-300 hover:text-teal-800">
              Kembali
            </Link>
          </div>

          <form onSubmit={handleSubmit} className="grid gap-4">
            <label className="grid gap-2 text-sm">
              <span className="font-semibold text-slate-700">Peran</span>
              <select
                value={role}
                onChange={(e) => {
                  const nextRole = e.target.value as UserRole;
                  setRole(nextRole);
                  syncDefaultCredentials(nextRole);
                }}
                className="input-field"
              >
                <option value="admin">Admin</option>
                <option value="musyrif">Musyrif</option>
                <option value="anggota">Anggota</option>
              </select>
            </label>

            <label className="grid gap-2 text-sm">
              <span className="font-semibold text-slate-700">Email</span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="admin@ldk.ac.id"
              />
            </label>

            <label className="grid gap-2 text-sm">
              <span className="font-semibold text-slate-700">Kata Sandi</span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                placeholder=""
              />
            </label>

            {error ? <p className="text-sm font-medium text-red-700">{error}</p> : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-2xl bg-slate-950 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? "Memproses..." : "Masuk Dashboard"}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
