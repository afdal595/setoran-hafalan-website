"use client";

import { useMemo, useState } from "react";
import { getCurrentRole, logoutAdmin } from "@/lib/auth";
import {
  jadwalSetoran,
  levelList,
  murojaahAwal,
  pengumumanAwal,
  progressAwal,
  sektorList,
  setoranAwal,
  users,
  surahList,
  type Pengumuman,
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

type NewMurojaahForm = {
  anggotaId: number;
  musyrifId: number;
  targetHalaman: number;
  tanggalTarget: string;
  status: "belum" | "proses" | "tuntas";
  catatan: string;
};

type NewPengumumanForm = {
  adminId: number;
  title: string;
  content: string;
  publishDate: string;
  targetRole: UserRole | "semua";
};

type MahasiswaHafal = {
  id: number;
  nama: string;
  nim: string;
  programStudi: string;
  juzSelesai: number;
  tanggalSelesai: string;
  catatan: string;
};

type NewMahasiswaHafalForm = {
  nama: string;
  nim: string;
  programStudi: string;
  juzSelesai: number;
  tanggalSelesai: string;
  catatan: string;
};

const roleLabels: Record<UserRole, string> = {
  admin: "Admin",
  musyrif: "Musyrif",
  anggota: "Anggota",
};

function avgScore(tajwid: number, kelancaran: number, makhraj: number) {
  return Math.round((tajwid + kelancaran + makhraj) / 3);
}

function resolveLevel(totalHalaman: number) {
  const sorted = [...levelList].sort((a, b) => a.targetHalaman - b.targetHalaman);
  let selected = sorted[0];

  for (const level of sorted) {
    if (totalHalaman >= level.targetHalaman) {
      selected = level;
    }
  }

  return selected;
}

function persentaseLevel(totalHalaman: number, levelId: number) {
  const level = levelList.find((l) => l.id === levelId);
  if (!level) {
    return 0;
  }
  return Math.min(100, Math.round((totalHalaman / level.targetHalaman) * 100));
}

export default function HafalanDashboard() {
  const initialRole = getCurrentRole();
  const [activeRole, setActiveRole] = useState<UserRole>(initialRole ?? "anggota");
  const [isAdminState, setIsAdminState] = useState(initialRole === "admin");
  const [currentRoleRaw] = useState<UserRole | null>(initialRole ?? null);
  const [setoranItems, setSetoranItems] = useState(setoranAwal);
  const [progressItems, setProgressItems] = useState(progressAwal);
  const [, setMurojaahItems] = useState(murojaahAwal);
  const [pengumumanItems, setPengumumanItems] = useState(pengumumanAwal);
  const [mahasiswaHafalItems, setMahasiswaHafalItems] = useState<MahasiswaHafal[]>([
    {
      id: 1,
      nama: "Naila Putri",
      nim: "220301045",
      programStudi: "Teknik Informatika",
      juzSelesai: 30,
      tanggalSelesai: "2026-06-10",
      catatan: "Lulus munaqasyah internal LDK.",
    },
  ]);

  const [setoranForm, setSetoranForm] = useState<NewSetoranForm>({
    anggotaId: 4,
    musyrifId: 2,
    targetDate: "2026-06-13",
    surahAwal: 1,
    surahAkhir: 1,
    nilaiTajwid: 80,
    nilaiKelancaran: 80,
    nilaiMakhraj: 80,
    feedback: "",
  });

  const [murojaahForm, setMurojaahForm] = useState<NewMurojaahForm>({
    anggotaId: 4,
    musyrifId: 2,
    targetHalaman: 3,
    tanggalTarget: "2026-06-20",
    status: "belum",
    catatan: "",
  });

  const [pengumumanForm, setPengumumanForm] = useState<NewPengumumanForm>({
    adminId: 1,
    title: "",
    content: "",
    publishDate: "2026-06-13",
    targetRole: "semua",
  });

  const [mahasiswaHafalForm, setMahasiswaHafalForm] = useState<NewMahasiswaHafalForm>({
    nama: "",
    nim: "",
    programStudi: "",
    juzSelesai: 30,
    tanggalSelesai: "2026-06-13",
    catatan: "",
  });

  const usersById = useMemo(() => new Map(users.map((u) => [u.id, u])), []);

  const canEditContent = currentRoleRaw === "admin" || currentRoleRaw === "musyrif";
  const isReadonly = !canEditContent;

  const summary = useMemo(() => {
    const totalAnggota = users.filter((u) => u.role === "anggota").length;
    const totalMusyrif = users.filter((u) => u.role === "musyrif").length;
    const setoranPekanIni = setoranItems.filter((s) => s.targetDate >= "2026-06-09").length;
    const avgNilai =
      setoranItems.length === 0
        ? 0
        : Math.round(
            setoranItems.reduce((acc, item) => {
              return acc + avgScore(item.nilaiTajwid, item.nilaiKelancaran, item.nilaiMakhraj);
            }, 0) / setoranItems.length,
          );

    return {
      totalAnggota,
      totalMusyrif,
      setoranPekanIni,
      avgNilai,
    };
  }, [setoranItems]);

  function handleTambahSetoran(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (isReadonly) return;

    const newSetoran = {
      id: setoranItems.length + 1,
      ...setoranForm,
    };

    setSetoranItems((prev) => [newSetoran, ...prev]);

    setProgressItems((prev) => {
      // gunakan jumlah surah sebagai unit progress sederhana
      const deltaHalaman = Math.max(0, setoranForm.surahAkhir - setoranForm.surahAwal + 1);
      const existing = prev.find((p) => p.anggotaId === setoranForm.anggotaId);

      if (!existing) {
        const level = resolveLevel(deltaHalaman);
        const newProgress = {
          id: prev.length + 1,
          anggotaId: setoranForm.anggotaId,
          totalHalaman: deltaHalaman,
          levelId: level.id,
          persentase: persentaseLevel(deltaHalaman, level.id),
          lastUpdated: setoranForm.targetDate,
        };
        return [newProgress, ...prev];
      }

      const newTotal = existing.totalHalaman + deltaHalaman;
      const newLevel = resolveLevel(newTotal);

      return prev.map((item) => {
        if (item.id !== existing.id) {
          return item;
        }
        return {
          ...item,
          totalHalaman: newTotal,
          levelId: newLevel.id,
          persentase: persentaseLevel(newTotal, newLevel.id),
          lastUpdated: setoranForm.targetDate,
        };
      });
    });

    setSetoranForm((prev) => ({
      ...prev,
      surahAwal: 1,
      surahAkhir: 1,
      nilaiTajwid: 80,
      nilaiKelancaran: 80,
      nilaiMakhraj: 80,
      feedback: "",
    }));
  }

  function handleTambahMurojaah(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (isReadonly) return;

    setMurojaahItems((prev) => [
      {
        id: prev.length + 1,
        ...murojaahForm,
        tanggalRealisasi: murojaahForm.status === "tuntas" ? murojaahForm.tanggalTarget : undefined,
      },
      ...prev,
    ]);

    setMurojaahForm((prev) => ({
      ...prev,
      targetHalaman: 3,
      catatan: "",
      status: "belum",
    }));
  }

  function handleTambahPengumuman(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (isReadonly) return;

    const item: Pengumuman = {
      id: pengumumanItems.length + 1,
      ...pengumumanForm,
    };

    setPengumumanItems((prev) => [item, ...prev]);
    setPengumumanForm((prev) => ({ ...prev, title: "", content: "" }));
  }

  function handleTambahMahasiswaHafal(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (isReadonly || activeRole !== "admin") {
      return;
    }

    const newItem: MahasiswaHafal = {
      id: mahasiswaHafalItems.length + 1,
      ...mahasiswaHafalForm,
    };

    setMahasiswaHafalItems((prev) => [newItem, ...prev]);
    setMahasiswaHafalForm((prev) => ({
      ...prev,
      nama: "",
      nim: "",
      programStudi: "",
      catatan: "",
    }));
  }

  const canManagePengumuman = isAdminState === true;
  const canManageMahasiswaHafal = isAdminState === true;

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 pb-10 md:p-8">
      <section className="panel animate-rise rounded-3xl p-5 md:p-7">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <p className="text-sm font-semibold tracking-[0.18em] text-teal-900/75 uppercase">Rancang Bangun SIM Setoran Hafalan</p>
            <h1 className="font-display text-3xl leading-tight text-teal-950 md:text-5xl">
              Sistem Informasi Manajemen Setoran Hafalan LDK
            </h1>
            <p className="max-w-3xl text-sm text-teal-900/85 md:text-base">
              Aplikasi ini dipakai untuk pencatatan setoran hafalan tatap muka, penilaian musyrif, tracking progress,
              jadwal, murojaah, dan pengumuman internal lembaga.
            </p>
          </div>
          <div className="rounded-2xl border border-teal-200 bg-white/70 p-3 backdrop-blur">
            <label className="text-xs font-bold tracking-wide text-teal-900 uppercase">Mode Peran</label>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {isAdminState ? (
                <>
                  {(Object.keys(roleLabels) as UserRole[]).map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setActiveRole(role)}
                      className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                        activeRole === role ? "bg-teal-600 text-white" : "bg-white text-teal-800 hover:bg-teal-50"
                      }`}
                    >
                      {roleLabels[role]}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      logoutAdmin();
                      setIsAdminState(false);
                      setActiveRole("anggota");
                    }}
                    className="ml-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <div className="flex items-center gap-3">
                  <p className="text-sm text-teal-900/90">Anda sedang sebagai pengunjung.</p>
                  <a href="/admin/login" className="rounded-xl bg-teal-700 px-3 py-2 text-sm font-semibold text-white">
                    Login Admin
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="panel animate-rise rounded-2xl p-5" style={{ animationDelay: "80ms" }}>
          <p className="text-xs font-semibold tracking-wide text-teal-900 uppercase">Total Anggota</p>
          <p className="mt-2 font-display text-4xl text-teal-950">{summary.totalAnggota}</p>
        </article>
        <article className="panel animate-rise rounded-2xl p-5" style={{ animationDelay: "120ms" }}>
          <p className="text-xs font-semibold tracking-wide text-teal-900 uppercase">Total Musyrif</p>
          <p className="mt-2 font-display text-4xl text-teal-950">{summary.totalMusyrif}</p>
        </article>
        <article className="panel animate-rise rounded-2xl p-5" style={{ animationDelay: "160ms" }}>
          <p className="text-xs font-semibold tracking-wide text-teal-900 uppercase">Setoran Pekan Ini</p>
          <p className="mt-2 font-display text-4xl text-teal-950">{summary.setoranPekanIni}</p>
        </article>
        <article className="panel animate-rise rounded-2xl p-5" style={{ animationDelay: "220ms" }}>
          <p className="text-xs font-semibold tracking-wide text-teal-900 uppercase">Rata-Rata Nilai</p>
          <p className="mt-2 font-display text-4xl text-teal-950">{summary.avgNilai}</p>
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <article className="panel rounded-2xl p-5 md:p-6">
          <h2 className="font-display text-2xl text-teal-950">Jadwal Setoran</h2>
          <p className="mt-1 text-sm text-teal-900/85">Jadwal tatap muka hafalan antara anggota dan musyrif.</p>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-xs tracking-wide text-teal-900 uppercase">
                  <th className="py-2">Tanggal</th>
                  <th className="py-2">Sektor</th>
                  <th className="py-2">Musyrif</th>
                  <th className="py-2">Waktu</th>
                  <th className="py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {jadwalSetoran.map((j) => {
                  const sektor = sektorList.find((s) => s.id === j.sektorId);
                  const musyrif = usersById.get(j.musyrifId);
                  return (
                    <tr key={j.id} className="border-t border-teal-100">
                      <td className="py-3">{j.date}</td>
                      <td className="py-3">{sektor?.name ?? "-"}</td>
                      <td className="py-3">{musyrif?.name ?? "-"}</td>
                      <td className="py-3">{j.startTime} - {j.endTime}</td>
                      <td className="py-3">
                        <span className="rounded-full bg-teal-100 px-3 py-1 text-xs font-semibold text-teal-900">
                          {j.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </article>

        <article className="panel rounded-2xl p-5 md:p-6">
          <h2 className="font-display text-2xl text-teal-950">Input Penilaian Setoran</h2>
          <p className="mt-1 text-sm text-teal-900/85">Diisi musyrif setelah sesi setoran tatap muka selesai.</p>
          <form data-editable="true" className={`mt-4 grid gap-3 ${isReadonly ? "opacity-50 pointer-events-none" : ""}`} onSubmit={handleTambahSetoran}>
            <label className="grid gap-1 text-sm">
              <span className="font-semibold text-teal-900">Anggota</span>
              <select
                className="input-field"
                value={setoranForm.anggotaId}
                onChange={(e) => setSetoranForm((prev) => ({ ...prev, anggotaId: Number(e.target.value) }))}
                disabled={isReadonly}
              >
                {users
                  .filter((u) => u.role === "anggota")
                  .map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
              </select>
            </label>

            <label className="grid gap-1 text-sm">
              <span className="font-semibold text-teal-900">Musyrif</span>
              <select
                className="input-field"
                value={setoranForm.musyrifId}
                onChange={(e) => setSetoranForm((prev) => ({ ...prev, musyrifId: Number(e.target.value) }))}
                disabled={isReadonly}
              >
                {users
                  .filter((u) => u.role === "musyrif")
                  .map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
              </select>
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="grid gap-1 text-sm">
                <span className="font-semibold text-teal-900">Surah Awal</span>
                <select
                  className="input-field"
                  value={setoranForm.surahAwal}
                  onChange={(e) => setSetoranForm((prev) => ({ ...prev, surahAwal: Number(e.target.value) }))}
                  disabled={isReadonly}
                >
                  {surahList.map((s, idx) => (
                    <option key={s} value={idx + 1}>
                      {idx + 1}. {s}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-1 text-sm">
                <span className="font-semibold text-teal-900">Surah Akhir</span>
                <select
                  className="input-field"
                  value={setoranForm.surahAkhir}
                  onChange={(e) => setSetoranForm((prev) => ({ ...prev, surahAkhir: Number(e.target.value) }))}
                  disabled={isReadonly}
                >
                  {surahList.map((s, idx) => (
                    <option key={s} value={idx + 1} disabled={idx + 1 < setoranForm.surahAwal}>
                      {idx + 1}. {s}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <label className="grid gap-1 text-sm">
                <span className="font-semibold text-teal-900">Tajwid</span>
                <input
                  type="number"
                  className="input-field"
                  min={0}
                  max={100}
                  value={setoranForm.nilaiTajwid}
                  onChange={(e) => setSetoranForm((prev) => ({ ...prev, nilaiTajwid: Number(e.target.value) }))}
                  disabled={isReadonly}
                />
              </label>
              <label className="grid gap-1 text-sm">
                <span className="font-semibold text-teal-900">Kelancaran</span>
                <input
                  type="number"
                  className="input-field"
                  min={0}
                  max={100}
                  value={setoranForm.nilaiKelancaran}
                  onChange={(e) => setSetoranForm((prev) => ({ ...prev, nilaiKelancaran: Number(e.target.value) }))}
                  disabled={isReadonly}
                />
              </label>
              <label className="grid gap-1 text-sm">
                <span className="font-semibold text-teal-900">Makhraj</span>
                <input
                  type="number"
                  className="input-field"
                  min={0}
                  max={100}
                  value={setoranForm.nilaiMakhraj}
                  onChange={(e) => setSetoranForm((prev) => ({ ...prev, nilaiMakhraj: Number(e.target.value) }))}
                  disabled={isReadonly}
                />
              </label>
            </div>

            <label className="grid gap-1 text-sm">
              <span className="font-semibold text-teal-900">Catatan Feedback</span>
              <textarea
                rows={3}
                className="input-field"
                value={setoranForm.feedback}
                onChange={(e) => setSetoranForm((prev) => ({ ...prev, feedback: e.target.value }))}
                placeholder="Catatan murajaah, tajwid, atau target perbaikan"
                disabled={isReadonly}
              />
            </label>

            <label className="grid gap-1 text-sm">
              <span className="font-semibold text-teal-900">Tanggal Setoran</span>
                <input
                  type="date"
                  className="input-field"
                  value={setoranForm.targetDate}
                  onChange={(e) => setSetoranForm((prev) => ({ ...prev, targetDate: e.target.value }))}
                  disabled={isReadonly}
                />
            </label>

            <button
              type="submit"
              disabled={isReadonly}
              className={`mt-2 rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white transition ${isReadonly ? "opacity-60 cursor-not-allowed" : "hover:bg-teal-800"}`}
            >
              Simpan Penilaian Setoran
            </button>
          </form>
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <article className="panel rounded-2xl p-5 md:p-6">
          <h2 className="font-display text-2xl text-teal-950">Progress Hafalan</h2>
          <p className="mt-1 text-sm text-teal-900/85">Update otomatis berdasarkan halaman setoran yang masuk.</p>
          <div className="mt-4 space-y-3">
            {progressItems.map((item) => {
              const anggota = usersById.get(item.anggotaId);
              const level = levelList.find((l) => l.id === item.levelId);
              return (
                <div key={item.id} className="rounded-xl border border-teal-100 bg-white/70 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold text-teal-950">{anggota?.name ?? "Anggota"}</p>
                    <span className="rounded-full bg-teal-100 px-2.5 py-1 text-xs font-semibold text-teal-900">
                      {level?.namaLevel} ({level?.badge})
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-teal-900/85">
                    Total halaman: <strong>{item.totalHalaman}</strong> | Update: {item.lastUpdated}
                  </p>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-teal-100">
                    <div className="h-full rounded-full bg-gradient-to-r from-teal-500 to-cyan-500" style={{ width: `${item.persentase}%` }} />
                  </div>
                  <p className="mt-1 text-right text-xs font-semibold text-teal-800">{item.persentase}% target level</p>
                </div>
              );
            })}
          </div>
        </article>

        <article className="panel rounded-2xl p-5 md:p-6">
          <h2 className="font-display text-2xl text-teal-950">Catatan Murojaah</h2>
          <form data-editable="true" className={`mt-4 grid gap-3 ${isReadonly ? "opacity-50 pointer-events-none" : ""}`} onSubmit={handleTambahMurojaah}>
            <div className="grid grid-cols-2 gap-3">
              <label className="grid gap-1 text-sm">
                <span className="font-semibold text-teal-900">Anggota</span>
                <select
                  className="input-field"
                  value={murojaahForm.anggotaId}
                  onChange={(e) => setMurojaahForm((prev) => ({ ...prev, anggotaId: Number(e.target.value) }))}
                  disabled={isReadonly}
                >
                  {users
                    .filter((u) => u.role === "anggota")
                    .map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                </select>
              </label>
              <label className="grid gap-1 text-sm">
                <span className="font-semibold text-teal-900">Musyrif</span>
                <select
                  className="input-field"
                  value={murojaahForm.musyrifId}
                  onChange={(e) => setMurojaahForm((prev) => ({ ...prev, musyrifId: Number(e.target.value) }))}
                  disabled={isReadonly}
                >
                  {users
                    .filter((u) => u.role === "musyrif")
                    .map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                </select>
              </label>
            </div>

            <label className="grid gap-1 text-sm">
              <span className="font-semibold text-teal-900">Target Halaman Murojaah</span>
              <input
                className="input-field"
                type="number"
                min={1}
                value={murojaahForm.targetHalaman}
                onChange={(e) => setMurojaahForm((prev) => ({ ...prev, targetHalaman: Number(e.target.value) }))}
                disabled={isReadonly}
              />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="grid gap-1 text-sm">
                <span className="font-semibold text-teal-900">Tanggal Target</span>
                <input
                  className="input-field"
                  type="date"
                  value={murojaahForm.tanggalTarget}
                  onChange={(e) => setMurojaahForm((prev) => ({ ...prev, tanggalTarget: e.target.value }))}
                  disabled={isReadonly}
                />
              </label>
              <label className="grid gap-1 text-sm">
                <span className="font-semibold text-teal-900">Status</span>
                <select
                  className="input-field"
                  value={murojaahForm.status}
                  onChange={(e) =>
                    setMurojaahForm((prev) => ({
                      ...prev,
                      status: e.target.value as "belum" | "proses" | "tuntas",
                    }))
                  }
                  disabled={isReadonly}
                >
                  <option value="belum">Belum</option>
                  <option value="proses">Proses</option>
                  <option value="tuntas">Tuntas</option>
                </select>
              </label>
            </div>

            <label className="grid gap-1 text-sm">
              <span className="font-semibold text-teal-900">Catatan</span>
              <textarea
                rows={3}
                className="input-field"
                value={murojaahForm.catatan}
                onChange={(e) => setMurojaahForm((prev) => ({ ...prev, catatan: e.target.value }))}
                placeholder="Catatan progres murojaah"
                disabled={isReadonly}
              />
            </label>

            <button type="submit" disabled={isReadonly} className={`rounded-xl bg-cyan-700 px-4 py-2.5 text-sm font-semibold text-white ${isReadonly ? "opacity-60 cursor-not-allowed" : "hover:bg-cyan-800"}`}>
              Simpan Catatan Murojaah
            </button>
          </form>
          {/* Recent murojaah list removed as requested */}
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <article className="panel rounded-2xl p-5 md:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-2xl text-teal-950">Pengumuman</h2>
            <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-800">
              Mode aktif: {roleLabels[activeRole]}
            </span>
          </div>

          <div className="mt-4 space-y-3">
            {pengumumanItems
              .filter((item) => item.targetRole === "semua" || item.targetRole === activeRole)
              .map((item) => (
                <article key={item.id} className="rounded-xl border border-teal-100 bg-white/70 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-semibold text-teal-950">{item.title}</h3>
                    <span className="text-xs text-teal-900/70">{item.publishDate}</span>
                  </div>
                  <p className="mt-1 text-sm text-teal-900/90">{item.content}</p>
                  <p className="mt-2 text-xs font-semibold text-teal-800 uppercase">Target: {item.targetRole}</p>
                </article>
              ))}
          </div>
        </article>

        <article className="panel rounded-2xl p-5 md:p-6">
          <h2 className="font-display text-2xl text-teal-950">Kelola Pengumuman</h2>
          <p className="mt-1 text-sm text-teal-900/85">
            Hanya Admin yang dapat menambahkan pengumuman baru untuk anggota/musyrif.
          </p>

          <form data-editable="true" className={`mt-4 grid gap-3 ${isReadonly ? "opacity-50 pointer-events-none" : ""}`} onSubmit={handleTambahPengumuman}>
            <label className="grid gap-1 text-sm">
              <span className="font-semibold text-teal-900">Judul</span>
              <input
                className="input-field"
                value={pengumumanForm.title}
                onChange={(e) => setPengumumanForm((prev) => ({ ...prev, title: e.target.value }))}
                disabled={!canManagePengumuman}
                required
              />
            </label>

            <label className="grid gap-1 text-sm">
              <span className="font-semibold text-teal-900">Isi</span>
              <textarea
                rows={4}
                className="input-field"
                value={pengumumanForm.content}
                onChange={(e) => setPengumumanForm((prev) => ({ ...prev, content: e.target.value }))}
                disabled={!canManagePengumuman}
                required
              />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="grid gap-1 text-sm">
                <span className="font-semibold text-teal-900">Tanggal Publish</span>
                <input
                  type="date"
                  className="input-field"
                  value={pengumumanForm.publishDate}
                  onChange={(e) => setPengumumanForm((prev) => ({ ...prev, publishDate: e.target.value }))}
                  disabled={!canManagePengumuman}
                />
              </label>
              <label className="grid gap-1 text-sm">
                <span className="font-semibold text-teal-900">Target</span>
                <select
                  className="input-field"
                  value={pengumumanForm.targetRole}
                  onChange={(e) =>
                    setPengumumanForm((prev) => ({
                      ...prev,
                      targetRole: e.target.value as UserRole | "semua",
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

            <button
              type="submit"
              disabled={!canManagePengumuman || isReadonly}
              className={`rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white transition ${(!canManagePengumuman || isReadonly) ? "opacity-60 cursor-not-allowed" : "hover:bg-amber-700"}`}
            >
              Tambah Pengumuman
            </button>
          </form>

          {!canManagePengumuman ? (
            <p className="mt-3 text-xs font-semibold text-red-700">Akses ditolak: ubah Mode Peran ke Admin untuk mengelola pengumuman.</p>
          ) : null}
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <article className="panel rounded-2xl p-5 md:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-display text-2xl text-teal-950">Daftar Mahasiswa Sudah Hafal</h2>
            <span className="rounded-full bg-teal-100 px-3 py-1 text-xs font-semibold text-teal-900">
              Total: {mahasiswaHafalItems.length}
            </span>
          </div>

          <div className="mt-4 space-y-3">
            {mahasiswaHafalItems.map((item) => (
              <article key={item.id} className="rounded-xl border border-teal-100 bg-white/70 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-semibold text-teal-950">{item.nama}</h3>
                  <span className="rounded-full bg-cyan-100 px-2.5 py-1 text-xs font-semibold text-cyan-900">
                    {item.juzSelesai} Juz
                  </span>
                </div>
                <p className="mt-1 text-sm text-teal-900/90">NIM: {item.nim} | Prodi: {item.programStudi}</p>
                <p className="text-sm text-teal-900/90">Tanggal selesai: {item.tanggalSelesai}</p>
                {item.catatan ? <p className="mt-1 text-sm text-teal-900/90">Catatan: {item.catatan}</p> : null}
              </article>
            ))}
          </div>
        </article>

        <article className="panel rounded-2xl p-5 md:p-6">
          <h2 className="font-display text-2xl text-teal-950">Input Mahasiswa Sudah Hafal</h2>
          <p className="mt-1 text-sm text-teal-900/85">Fitur ini khusus Admin untuk menambahkan data mahasiswa yang sudah menyelesaikan target hafalan.</p>

          <form data-editable="true" className={`mt-4 grid gap-3 ${isReadonly ? "opacity-50 pointer-events-none" : ""}`} onSubmit={handleTambahMahasiswaHafal}>
            <label className="grid gap-1 text-sm">
              <span className="font-semibold text-teal-900">Nama Mahasiswa</span>
              <input
                className="input-field"
                value={mahasiswaHafalForm.nama}
                onChange={(e) => setMahasiswaHafalForm((prev) => ({ ...prev, nama: e.target.value }))}
                disabled={!canManageMahasiswaHafal}
                required
              />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="grid gap-1 text-sm">
                <span className="font-semibold text-teal-900">NIM</span>
                <input
                  className="input-field"
                  value={mahasiswaHafalForm.nim}
                  onChange={(e) => setMahasiswaHafalForm((prev) => ({ ...prev, nim: e.target.value }))}
                  disabled={!canManageMahasiswaHafal}
                  required
                />
              </label>

              <label className="grid gap-1 text-sm">
                <span className="font-semibold text-teal-900">Program Studi</span>
                <input
                  className="input-field"
                  value={mahasiswaHafalForm.programStudi}
                  onChange={(e) => setMahasiswaHafalForm((prev) => ({ ...prev, programStudi: e.target.value }))}
                  disabled={!canManageMahasiswaHafal}
                  required
                />
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="grid gap-1 text-sm">
                <span className="font-semibold text-teal-900">Jumlah Juz Selesai</span>
                <input
                  type="number"
                  className="input-field"
                  min={1}
                  max={30}
                  value={mahasiswaHafalForm.juzSelesai}
                  onChange={(e) => setMahasiswaHafalForm((prev) => ({ ...prev, juzSelesai: Number(e.target.value) }))}
                  disabled={!canManageMahasiswaHafal}
                  required
                />
              </label>

              <label className="grid gap-1 text-sm">
                <span className="font-semibold text-teal-900">Tanggal Selesai</span>
                <input
                  type="date"
                  className="input-field"
                  value={mahasiswaHafalForm.tanggalSelesai}
                  onChange={(e) => setMahasiswaHafalForm((prev) => ({ ...prev, tanggalSelesai: e.target.value }))}
                  disabled={!canManageMahasiswaHafal}
                  required
                />
              </label>
            </div>

            <label className="grid gap-1 text-sm">
              <span className="font-semibold text-teal-900">Catatan</span>
              <textarea
                rows={3}
                className="input-field"
                value={mahasiswaHafalForm.catatan}
                onChange={(e) => setMahasiswaHafalForm((prev) => ({ ...prev, catatan: e.target.value }))}
                disabled={!canManageMahasiswaHafal}
                placeholder="Misal: selesai 30 juz / lulus munaqasyah"
              />
            </label>

            <button
              type="submit"
              disabled={!canManageMahasiswaHafal || isReadonly}
              className={`mt-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white ${(!canManageMahasiswaHafal || isReadonly) ? "opacity-60 cursor-not-allowed" : "hover:bg-emerald-800"}`}
            >
              Tambah Mahasiswa Hafal
            </button>
          </form>
        </article>
      </section>

      <section className="panel rounded-2xl p-5 md:p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="font-display text-2xl text-teal-950">Cetak Laporan Hafalan</h2>
            <p className="text-sm text-teal-900/85">Ekspor manual dapat dihubungkan ke PDF/Excel pada tahap pengembangan berikutnya.</p>
          </div>
          <button
            type="button"
            onClick={() => window.print()}
            className="rounded-xl bg-teal-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-950"
          >
            Cetak Laporan
          </button>
        </div>
      </section>
    </div>
  );
}
