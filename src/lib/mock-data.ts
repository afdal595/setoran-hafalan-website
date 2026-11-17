export type UserRole = "admin" | "musyrif" | "anggota";

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
}

export interface Sektor {
  id: number;
  name: string;
  musyrifId: number;
  description: string;
  createdAt: string;
}

export interface JadwalSetoran {
  id: number;
  sektorId: number;
  musyrifId: number;
  date: string;
  startTime: string;
  endTime: string;
  status: "terjadwal" | "selesai" | "ditunda";
}

export interface  Setoran {
  id: number;
  anggotaId: number;
  musyrifId: number;
  targetDate: string;
  surahAwal: number;
  surahAkhir: number;
  nilaiTajwid: number;
  nilaiKelancaran: number;
  nilaiMakhraj: number;
  feedback: string;
}

export interface ProgressHafalan {
  id: number;
  anggotaId: number;
  totalHalaman: number;
  levelId: number;
  persentase: number;
  lastUpdated: string;
}

export interface LevelHafalan {
  id: number;
  namaLevel: string;
  targetHalaman: number;
  badge: string;
}

export interface Murojaah {
  id: number;
  anggotaId: number;
  musyrifId: number;
  targetHalaman: number;
  tanggalTarget: string;
  tanggalRealisasi?: string;
  status: "belum" | "proses" | "tuntas";
  catatan: string;
}

export interface Pengumuman {
  id: number;
  adminId: number;
  title: string;
  content: string;
  publishDate: string;
  targetRole: UserRole | "semua";
}

export const users: User[] = [
  { id: 1, name: "Admin LDK", email: "admin@ldk.ac.id", role: "admin", active: true },
  { id: 2, name: "Ustadz Musyrif A", email: "musyrif1@ldk.ac.id", role: "musyrif", active: true },
  { id: 3, name: "Ustadz Musyrif B", email: "musyrif2@ldk.ac.id", role: "musyrif", active: true },
  { id: 4, name: "Anggota A", email: "anggota1@ldk.ac.id", role: "anggota", active: true },
  { id: 5, name: "Anggota B", email: "anggota2@ldk.ac.id", role: "anggota", active: true },
];

export const sektorList: Sektor[] = [
  {
    id: 1,
    name: "Sekretariat Ukm Pam",
    musyrifId: 2,
    description: "Pembinaan anggota ikhwan semester awal.",
    createdAt: "2026-05-10",
  },
  {
    id: 2,
    name: "mesjid umi",
    musyrifId: 3,
    description: "Pembinaan anggota akhwat dengan fokus tajwid.",
    createdAt: "2026-05-13",
  },
];

export const jadwalSetoran: JadwalSetoran[] = [];

export const levelList: LevelHafalan[] = [
  { id: 1, namaLevel: "Pemula", targetHalaman: 10, badge: "Bronze" },
  { id: 2, namaLevel: "Istiqamah", targetHalaman: 30, badge: "Silver" },
  { id: 3, namaLevel: "Mumtaz", targetHalaman: 60, badge: "Gold" },
  { id: 4, namaLevel: "Murabbi", targetHalaman: 100, badge: "Platinum" },
];

export const surahList = [
  "Al-Fatihah",
  "Al-Baqarah",
  "Ali Imran",
  "An-Nisa'",
  "Al-Maidah",
  "Al-An'am",
  "Al-A'raf",
  "Al-Anfal",
  "At-Taubah",
  "Yunus",
  "Hud",
  "Yusuf",
  "Ar-Ra'd",
  "Ibrahim",
  "Al-Hijr",
  "An-Nahl",
  "Al-Isra'",
  "Al-Kahf",
  "Maryam",
  "Ta-Ha",
];

export const juzList = Array.from({ length: 30 }, (_, index) => `Juz ${index + 1}`);

export const setoranAwal: Setoran[] = [];

export const progressAwal: ProgressHafalan[] = [];

export const murojaahAwal: Murojaah[] = [];

export const pengumumanAwal: Pengumuman[] = [];
