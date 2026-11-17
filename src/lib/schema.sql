-- PostgreSQL schema for SIM Hafalan LDK

CREATE TYPE user_role AS ENUM ('admin', 'musyrif', 'anggota');
CREATE TYPE jadwal_status AS ENUM ('terjadwal', 'selesai', 'ditunda');
CREATE TYPE murojaah_status AS ENUM ('belum', 'proses', 'tuntas');
CREATE TYPE pengumuman_target AS ENUM ('admin', 'musyrif', 'anggota', 'semua');

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role user_role NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  password_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE level_hafalan (
  id SERIAL PRIMARY KEY,
  nama_level TEXT NOT NULL,
  target_halaman INTEGER NOT NULL,
  badge TEXT NOT NULL
);

CREATE TABLE sektor (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  musyrif_id INTEGER REFERENCES users(id),
  description TEXT,
  created_at DATE NOT NULL
);

CREATE TABLE jadwal_setoran (
  id SERIAL PRIMARY KEY,
  sektor_id INTEGER NOT NULL REFERENCES sektor(id),
  musyrif_id INTEGER NOT NULL REFERENCES users(id),
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status jadwal_status NOT NULL
);

CREATE TABLE setoran (
  id SERIAL PRIMARY KEY,
  anggota_id INTEGER NOT NULL REFERENCES users(id),
  musyrif_id INTEGER NOT NULL REFERENCES users(id),
  target_date DATE NOT NULL,
  halaman_awal INTEGER NOT NULL,
  halaman_akhir INTEGER NOT NULL,
  nilai_tajwid INTEGER NOT NULL,
  nilai_kelancaran INTEGER NOT NULL,
  nilai_makhraj INTEGER NOT NULL,
  feedback TEXT
);

CREATE TABLE progress_hafalan (
  id SERIAL PRIMARY KEY,
  anggota_id INTEGER NOT NULL REFERENCES users(id),
  total_halaman INTEGER NOT NULL,
  level_id INTEGER NOT NULL REFERENCES level_hafalan(id),
  persentase INTEGER NOT NULL,
  last_updated DATE NOT NULL
);

CREATE TABLE murojaah (
  id SERIAL PRIMARY KEY,
  anggota_id INTEGER NOT NULL REFERENCES users(id),
  musyrif_id INTEGER NOT NULL REFERENCES users(id),
  target_halaman INTEGER NOT NULL,
  tanggal_target DATE NOT NULL,
  tanggal_realisasi DATE,
  status murojaah_status NOT NULL,
  catatan TEXT
);

CREATE TABLE pengumuman (
  id SERIAL PRIMARY KEY,
  admin_id INTEGER NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  publish_date DATE NOT NULL,
  target_role pengumuman_target NOT NULL
);

-- Seed data
INSERT INTO users (name, email, role, active, password_hash) VALUES
('Admin LDK', 'admin@ldk.ac.id', 'admin', true, '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9'),
('Musyrif A', 'musyrif1@ldk.ac.id', 'musyrif', true, 'ebcf79a0da92a76ab9747c1583e48dc1b719d2be574b7cd2162e6bb7eb14af20'),
('Anggota A', 'anggota1@ldk.ac.id', 'anggota', true, '59a3b2e9de40b220ea27817ac85b2ac62c26473df75f7029611077b21bcf3ef9');

INSERT INTO level_hafalan (nama_level, target_halaman, badge) VALUES
('Pemula', 10, 'Bronze'),
('Istiqamah', 30, 'Silver'),
('Mumtaz', 60, 'Gold'),
('Murabbi', 100, 'Platinum');

INSERT INTO sektor (name, musyrif_id, description, created_at) VALUES
('Sektor Al-Mulk', NULL, 'Pembinaan anggota ikhwan semester awal.', '2026-05-10'),
('Sektor An-Naba', NULL, 'Pembinaan anggota akhwat dengan fokus tajwid.', '2026-05-13');

INSERT INTO pengumuman (admin_id, title, content, publish_date, target_role) VALUES
(1, 'Evaluasi Pekanan Setoran', 'Mohon semua anggota hadir tepat waktu pada jadwal sektor masing-masing.', '2026-06-12', 'semua'),
(1, 'Khusus Musyrif: Sinkron Nilai', 'Pastikan input tajwid, kelancaran, dan makhraj terisi lengkap setelah sesi tatap muka.', '2026-06-13', 'musyrif');
