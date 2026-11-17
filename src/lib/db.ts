import fs from "fs";
import path from "path";
import pg from "pg";

function loadEnvFile() {
  if (process.env.DATABASE_URL) return;
  const envPath = path.resolve(process.cwd(), ".env");
  if (!fs.existsSync(envPath)) return;

  const envContent = fs.readFileSync(envPath, "utf8");
  for (const line of envContent.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const [key, ...rest] = trimmed.split("=");
    if (!key) continue;
    const value = rest.join("=").trim();
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

loadEnvFile();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
});

export async function query(text: string, params?: unknown[]) {
  const client = await pool.connect();

  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
}

export async function getUsers() {
  const result = await query("SELECT id, name, email, role, active FROM users ORDER BY id");
  return result.rows;
}

export async function ensureAppSettingsTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

export async function getDefaultPasswordHash(role: string) {
  await ensureAppSettingsTable();
  const key = `default_password_${role}`;
  const result = await query("SELECT value FROM app_settings WHERE key = $1", [key]);
  return result.rows[0]?.value ?? null;
}

export async function getDefaultPasswordHashes() {
  await ensureAppSettingsTable();
  const result = await query(
    "SELECT key, value FROM app_settings WHERE key IN ($1, $2, $3)",
    ["default_password_admin", "default_password_musyrif", "default_password_anggota"]
  );

  const passwords: Record<string, string> = {};
  for (const row of result.rows) {
    passwords[row.key.replace("default_password_", "")] = row.value;
  }

  return passwords;
}

export async function setDefaultPasswordHash(role: string, passwordHash: string) {
  await ensureAppSettingsTable();
  const key = `default_password_${role}`;
  const result = await query(
    `INSERT INTO app_settings (key, value, updated_at)
     VALUES ($1, $2, NOW())
     ON CONFLICT (key)
     DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
     RETURNING key, value`,
    [key, passwordHash]
  );
  return result.rows[0];
}

export async function createUser({
  name,
  email,
  role,
  active = true,
  passwordHash = "",
}: {
  name: string;
  email: string;
  role: string;
  active?: boolean;
  passwordHash?: string;
}) {
  const result = await query(
    "INSERT INTO users (name, email, role, active, password_hash) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, role, active, created_at",
    [name, email, role, active, passwordHash]
  );
  return result.rows[0];
}

export async function getUserById(id: number) {
  const result = await query(
    "SELECT id, name, email, role, active, created_at FROM users WHERE id = $1",
    [id]
  );
  return result.rows[0];
}

export async function getUserByEmailAndRole(email: string, role: string) {
  const result = await query(
    "SELECT id, name, email, role, active, password_hash, created_at FROM users WHERE email = $1 AND role = $2",
    [email, role]
  );
  return result.rows[0];
}

export async function updateUser(id: number, fields: Record<string, unknown>) {
  const keys = Object.keys(fields);
  if (keys.length === 0) return getUserById(id);

  const setClauses = keys.map((k, i) => `${k} = $${i + 2}`);
  const values = keys.map((k) => fields[k]);

  const sql = `UPDATE users SET ${setClauses.join(", ")} WHERE id = $1 RETURNING id, name, email, role, active, created_at`;
  const result = await query(sql, [id, ...values]);
  return result.rows[0];
}

export async function deactivateUser(id: number) {
  const result = await query(
    "UPDATE users SET active = false WHERE id = $1 RETURNING id, name, email, role, active, created_at",
    [id]
  );
  return result.rows[0];
}

// Setoran (Hafalan Submission) functions
export async function getSetoran(filters?: {
  anggotaId?: number;
  musyrifId?: number;
  userId?: number;
  userRole?: string;
}) {
  let sql = `
    SELECT 
      id, anggota_id, musyrif_id, target_date, 
      halaman_awal, halaman_akhir, 
      nilai_tajwid, nilai_kelancaran, nilai_makhraj, 
      feedback
    FROM setoran
    WHERE 1=1
  `;
  const params: unknown[] = [];

  if (filters?.anggotaId) {
    sql += ` AND anggota_id = $${params.length + 1}`;
    params.push(filters.anggotaId);
  }

  if (filters?.musyrifId) {
    sql += ` AND musyrif_id = $${params.length + 1}`;
    params.push(filters.musyrifId);
  }

  // Access control: if user is anggota, only show their own
  if (filters?.userRole === "anggota" && filters?.userId) {
    sql += ` AND anggota_id = $${params.length + 1}`;
    params.push(filters.userId);
  }

  // Access control: if user is musyrif, only show for their anggota
  if (filters?.userRole === "musyrif" && filters?.userId) {
    sql += ` AND musyrif_id = $${params.length + 1}`;
    params.push(filters.userId);
  }

  sql += ` ORDER BY target_date DESC`;

  const result = await query(sql, params);
  return result.rows;
}

export async function getSetoranById(id: number) {
  const result = await query(
    "SELECT id, anggota_id, musyrif_id, target_date, halaman_awal, halaman_akhir, nilai_tajwid, nilai_kelancaran, nilai_makhraj, feedback FROM setoran WHERE id = $1",
    [id]
  );
  return result.rows[0];
}

export async function createSetoran({
  anggotaId,
  musyrifId,
  targetDate,
  halamanAwal,
  halamanAkhir,
  nilaiTajwid,
  nilaiKelancaran,
  nilaiMakhraj,
  feedback = "",
}: {
  anggotaId: number;
  musyrifId: number;
  targetDate: string;
  halamanAwal: number;
  halamanAkhir: number;
  nilaiTajwid: number;
  nilaiKelancaran: number;
  nilaiMakhraj: number;
  feedback?: string;
}) {
  const result = await query(
    `INSERT INTO setoran 
    (anggota_id, musyrif_id, target_date, halaman_awal, halaman_akhir, nilai_tajwid, nilai_kelancaran, nilai_makhraj, feedback) 
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
    RETURNING id, anggota_id, musyrif_id, target_date, halaman_awal, halaman_akhir, nilai_tajwid, nilai_kelancaran, nilai_makhraj, feedback`,
    [anggotaId, musyrifId, targetDate, halamanAwal, halamanAkhir, nilaiTajwid, nilaiKelancaran, nilaiMakhraj, feedback]
  );
  return result.rows[0];
}

export async function updateSetoran(id: number, fields: Record<string, unknown>) {
  const keys = Object.keys(fields);
  if (keys.length === 0) return getSetoranById(id);

  const setClauses = keys.map((k, i) => `${k} = $${i + 2}`);
  const values = keys.map((k) => fields[k]);

  const sql = `UPDATE setoran SET ${setClauses.join(", ")} WHERE id = $1 RETURNING id, anggota_id, musyrif_id, target_date, halaman_awal, halaman_akhir, nilai_tajwid, nilai_kelancaran, nilai_makhraj, feedback`;
  const result = await query(sql, [id, ...values]);
  return result.rows[0];
}

export async function deleteSetoran(id: number) {
  const result = await query("DELETE FROM setoran WHERE id = $1 RETURNING id", [id]);
  return result.rows[0];
}

// Murojaah (Hafalan Review) functions
export async function getMurojaah(filters?: {
  anggotaId?: number;
  musyrifId?: number;
  userId?: number;
  userRole?: string;
}) {
  let sql = `
    SELECT 
      id, anggota_id, musyrif_id, target_halaman, 
      tanggal_target, tanggal_realisasi, status, catatan
    FROM murojaah
    WHERE 1=1
  `;
  const params: unknown[] = [];

  if (filters?.anggotaId) {
    sql += ` AND anggota_id = $${params.length + 1}`;
    params.push(filters.anggotaId);
  }

  if (filters?.musyrifId) {
    sql += ` AND musyrif_id = $${params.length + 1}`;
    params.push(filters.musyrifId);
  }

  // Access control: if user is anggota, only show their own
  if (filters?.userRole === "anggota" && filters?.userId) {
    sql += ` AND anggota_id = $${params.length + 1}`;
    params.push(filters.userId);
  }

  // Access control: if user is musyrif, only show for their anggota
  if (filters?.userRole === "musyrif" && filters?.userId) {
    sql += ` AND musyrif_id = $${params.length + 1}`;
    params.push(filters.userId);
  }

  sql += ` ORDER BY tanggal_target DESC`;

  const result = await query(sql, params);
  return result.rows;
}

export async function getMurojaahById(id: number) {
  const result = await query(
    "SELECT id, anggota_id, musyrif_id, target_halaman, tanggal_target, tanggal_realisasi, status, catatan FROM murojaah WHERE id = $1",
    [id]
  );
  return result.rows[0];
}

export async function createMurojaah({
  anggotaId,
  musyrifId,
  targetHalaman,
  tanggalTarget,
  tanggalRealisasi = null,
  status = "belum",
  catatan = "",
}: {
  anggotaId: number;
  musyrifId: number;
  targetHalaman: number;
  tanggalTarget: string;
  tanggalRealisasi?: string | null;
  status?: string;
  catatan?: string;
}) {
  const result = await query(
    `INSERT INTO murojaah 
    (anggota_id, musyrif_id, target_halaman, tanggal_target, tanggal_realisasi, status, catatan) 
    VALUES ($1, $2, $3, $4, $5, $6, $7) 
    RETURNING id, anggota_id, musyrif_id, target_halaman, tanggal_target, tanggal_realisasi, status, catatan`,
    [anggotaId, musyrifId, targetHalaman, tanggalTarget, tanggalRealisasi, status, catatan]
  );
  return result.rows[0];
}

export async function updateMurojaah(id: number, fields: Record<string, unknown>) {
  const keys = Object.keys(fields);
  if (keys.length === 0) return getMurojaahById(id);

  const setClauses = keys.map((k, i) => `${k} = $${i + 2}`);
  const values = keys.map((k) => fields[k]);

  const sql = `UPDATE murojaah SET ${setClauses.join(", ")} WHERE id = $1 RETURNING id, anggota_id, musyrif_id, target_halaman, tanggal_target, tanggal_realisasi, status, catatan`;
  const result = await query(sql, [id, ...values]);
  return result.rows[0];
}

export async function deleteMurojaah(id: number) {
  const result = await query("DELETE FROM murojaah WHERE id = $1 RETURNING id", [id]);
  return result.rows[0];
}

// Pengumuman (Announcements) functions
export async function getPengumuman(filters?: {
  targetRole?: string;
  userId?: number;
  userRole?: string;
}) {
  let sql = `
    SELECT 
      id, admin_id, title, content, publish_date, target_role
    FROM pengumuman
    WHERE 1=1
  `;
  const params: unknown[] = [];

  // Filter by target_role
  if (filters?.targetRole && filters.targetRole !== "semua") {
    sql += ` AND (target_role = $${params.length + 1} OR target_role = 'semua')`;
    params.push(filters.targetRole);
  } else if (!filters?.targetRole) {
    // If no role specified, filter based on user role
    if (filters?.userRole && filters.userRole !== "admin") {
      sql += ` AND (target_role = $${params.length + 1} OR target_role = 'semua')`;
      params.push(filters.userRole);
    }
  }

  sql += ` ORDER BY publish_date DESC`;

  const result = await query(sql, params);
  return result.rows;
}

export async function getPengumumanById(id: number) {
  const result = await query(
    "SELECT id, admin_id, title, content, publish_date, target_role FROM pengumuman WHERE id = $1",
    [id]
  );
  return result.rows[0];
}

export async function createPengumuman({
  adminId,
  title,
  content,
  publishDate,
  targetRole = "semua",
}: {
  adminId: number;
  title: string;
  content: string;
  publishDate: string;
  targetRole?: string;
}) {
  const result = await query(
    `INSERT INTO pengumuman 
    (admin_id, title, content, publish_date, target_role) 
    VALUES ($1, $2, $3, $4, $5) 
    RETURNING id, admin_id, title, content, publish_date, target_role`,
    [adminId, title, content, publishDate, targetRole]
  );
  return result.rows[0];
}

export async function updatePengumuman(id: number, fields: Record<string, unknown>) {
  const keys = Object.keys(fields);
  if (keys.length === 0) return getPengumumanById(id);

  const setClauses = keys.map((k, i) => `${k} = $${i + 2}`);
  const values = keys.map((k) => fields[k]);

  const sql = `UPDATE pengumuman SET ${setClauses.join(", ")} WHERE id = $1 RETURNING id, admin_id, title, content, publish_date, target_role`;
  const result = await query(sql, [id, ...values]);
  return result.rows[0];
}

export async function deletePengumuman(id: number) {
  const result = await query("DELETE FROM pengumuman WHERE id = $1 RETURNING id", [id]);
  return result.rows[0];
}

// Progress Hafalan (Reference Data) functions
export async function getLevelHafalan() {
  const result = await query("SELECT id, nama_level, target_halaman, badge FROM level_hafalan ORDER BY target_halaman ASC");
  return result.rows;
}

export async function getUserProgress(userId: number) {
  const result = await query(
    `SELECT 
      ph.id, ph.anggota_id, ph.total_halaman, ph.level_id, 
      ph.persentase, ph.last_updated,
      lh.nama_level, lh.target_halaman, lh.badge
    FROM progress_hafalan ph
    LEFT JOIN level_hafalan lh ON ph.level_id = lh.id
    WHERE ph.anggota_id = $1`,
    [userId]
  );
  return result.rows[0] || null;
}

export async function getAllProgress() {
  const result = await query(
    `SELECT 
      ph.id, ph.anggota_id, ph.total_halaman, ph.level_id, 
      ph.persentase, ph.last_updated,
      lh.nama_level, lh.target_halaman, lh.badge,
      u.name, u.email
    FROM progress_hafalan ph
    LEFT JOIN level_hafalan lh ON ph.level_id = lh.id
    LEFT JOIN users u ON ph.anggota_id = u.id
    ORDER BY ph.persentase DESC`
  );
  return result.rows;
}
