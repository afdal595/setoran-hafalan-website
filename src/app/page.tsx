"use client";

import Link from "next/link";

export default function Home() {
  const scrollToFitur = () => {
    const target = document.getElementById("fitur");
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-1 flex-col px-4 py-6 sm:px-6 lg:px-8">
      <main className="panel animate-rise relative overflow-hidden rounded-[2rem] p-6 shadow-[0_20px_60px_-35px_rgba(15,23,42,0.45)] md:p-10 lg:p-12">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(20,184,166,0.14),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.08),transparent_26%)]" />
        <div className="relative grid items-center gap-10 lg:grid-cols-[1.08fr_0.92fr]">
          <section className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-white/80 px-4 py-2 text-xs font-semibold tracking-[0.18em] text-teal-900 uppercase shadow-sm">
              <span className="h-2 w-2 rounded-full bg-teal-600" />
              Lembaga Dakwah Kampus
            </div>

            <div className="space-y-4">
              <h1 className="font-display max-w-2xl text-4xl leading-tight text-slate-950 md:text-6xl">
                Sistem manajemen setoran hafalan LDK untuk pengurus kampus.
              </h1>
              <p className="max-w-2xl text-base leading-relaxed text-slate-700 md:text-lg">
                Aplikasi ini membantu mencatat jadwal setoran, nilai tajwid dan makhraj, progress murojaah, serta distribusi
                pengumuman untuk anggota, musyrif, dan admin.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/dashboard"
                className="rounded-2xl bg-slate-950 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Buka Dashboard
              </Link>
              <Link
                href="/admin/login"
                className="rounded-2xl border border-slate-300 bg-white px-6 py-3.5 text-sm font-semibold text-slate-800 transition hover:border-teal-300 hover:text-teal-800"
              >
                Login Admin
              </Link>
              <button
                type="button"
                onClick={scrollToFitur}
                className="rounded-2xl border border-transparent bg-teal-100 px-6 py-3.5 text-sm font-semibold text-teal-900 transition hover:bg-teal-200"
              >
                Lihat Fitur
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {[
                ["Input Setoran", "Catat nilai setoran beserta feedback"],
                ["Progress Hafalan", "Pantau progress dan level anggota"],
                ["Pengumuman", "Kirim informasi yang sesuai per role"],
              ].map(([title, desc]) => (
                <article key={title} className="rounded-2xl border border-white/70 bg-white/75 p-4 shadow-sm backdrop-blur">
                  <p className="text-sm font-semibold text-slate-950">{title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-600">{desc}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="grid gap-4" id="fitur">
            <div className="rounded-[1.75rem] border border-slate-200 bg-slate-950 p-5 text-white shadow-xl shadow-slate-950/15">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold tracking-[0.18em] text-teal-300 uppercase">Preview Dashboard</p>
                  <h2 className="mt-2 text-2xl font-semibold">Fitur utama untuk pengelolaan setoran</h2>
                </div>
                <span className="rounded-full bg-teal-400/15 px-3 py-1 text-xs font-semibold text-teal-200">Live UI</span>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {[
                  ["Setoran", "Catat hasil setoran, nilai, dan catatan musyrif"],
                  ["Progress", "Monitor kemajuan hafalan per anggota"],
                  ["Pengumuman", "Sebarkan pesan untuk anggota atau musyrif"],
                  ["Laporan", "Cek ringkasan setoran dan progres langsung"],
                ].map(([title, desc], index) => (
                  <article key={title} className={`rounded-2xl border border-white/10 bg-white/${index % 2 === 0 ? "10" : "6"} p-4`}>
                    <p className="text-sm font-semibold text-white">{title}</p>
                    <p className="mt-1 text-xs leading-relaxed text-slate-300">{desc}</p>
                  </article>
                ))}
              </div>
            </div>

            {[
              {
                title: "Kelola Setoran Hafalan",
                desc: "Input nilai dan catatan tajwid, kelancaran, serta makhraj untuk tiap anggota.",
              },
              {
                title: "Pantau Progress Murojaah",
                desc: "Lihat target murojaah, status pengerjaan, dan realisasi per anggota.",
              },
              {
                title: "Pengumuman Role-based",
                desc: "Kirim pengumuman langsung ke anggota, musyrif, atau admin sesuai kebutuhan.",
              },
            ].map((item) => (
              <article key={item.title} className="rounded-2xl border border-white/80 bg-white/85 p-4 shadow-sm backdrop-blur">
                <h2 className="font-display text-lg text-slate-950">{item.title}</h2>
                <p className="mt-1 text-sm leading-relaxed text-slate-600">{item.desc}</p>
              </article>
            ))}
          </section>
        </div>
      </main>

      <footer className="px-2 py-6 text-center text-xs text-slate-500">
        Next.js App Router | SIM Hafalan LDK | Fokus setoran tatap muka
      </footer>
    </div>
  );
}
