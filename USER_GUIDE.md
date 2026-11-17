# 📚 Panduan Penggunaan Website Setoran Hafalan

Dokumen lengkap menjalankan dan menggunakan aplikasi **Setoran Hafalan** dari awal sampai akhir.

---

## 📋 DAFTAR ISI

1. [Setup & Instalasi](#setup--instalasi)
2. [Akses Aplikasi](#akses-aplikasi)
3. [Login & Autentikasi](#login--autentikasi)
4. [Panduan Per Role](#panduan-per-role)
   - [Admin](#admin)
   - [Musyrif (Guru)](#musyrif-guru)
   - [Anggota (Santri)](#anggota-santri)
5. [Fitur Utama](#fitur-utama)
6. [Workflow Umum](#workflow-umum)
7. [Troubleshooting](#troubleshooting)

---

## 🚀 Setup & Instalasi

### Step 1: Persiapkan Environment

```bash
# Clone/buka project
cd /home/angel/proyek/setoran-hafalan-website

# Install semua dependency
npm install
```

### Step 2: Setup Database

```bash
# Copy file contoh environment
cp .env.example .env
```

Edit file `.env`:

```env
# Database connection
DATABASE_URL=postgresql://setoran_user:password_aman@localhost:5432/setoran_hafalan

# Secret key untuk session token (ganti dengan random string panjang!)
AUTH_SECRET=your-super-secret-key-min-32-chars-randomrandomrandom123
```

**Setup PostgreSQL** (jika belum ada):

```bash
# Buat database user dan database
createuser setoran_user
createdb setoran_hafalan -O setoran_user

# Set password
psql -c "ALTER USER setoran_user WITH PASSWORD 'password_aman';"
```

### Step 3: Inisialisasi Database (Optional)

```bash
# Helper script untuk PostgreSQL setup
bash scripts/init-db.sh
```

### Step 4: Terapkan Schema Database

```bash
# Apply SQL schema
psql "$DATABASE_URL" -f src/lib/schema.sql
```

**Output yang diharapkan:**
```
CREATE TABLE
CREATE TABLE
...
INSERT ...
```

### Step 5: Jalankan Development Server

```bash
npm run dev
```

**Output:**
```
> next dev
  ▲ Next.js 16.2.9
  - Local:        http://localhost:3000
  ✓ Ready in 2.3s
```

✅ **Aplikasi siap di `http://localhost:3000`**

---

## 🌐 Akses Aplikasi

### Buka di Browser

1. Buka browser (Chrome, Firefox, Safari, dll)
2. Ketik: `http://localhost:3000`
3. Anda akan melihat **landing page** dengan 3 tombol:
   - 🏠 **Home** - Overview aplikasi
   - 📊 **Dashboard** - Area user (butuh login)
   - 🔐 **Login** - Form masuk

---

## 🔐 Login & Autentikasi

### Akun Default Test

Aplikasi sudah memiliki 3 akun test yang siap pakai:

| Role | Email | Password | Fungsi |
|------|-------|----------|--------|
| **Admin** | `admin@ldk.ac.id` | `admin123` | Kelola users, buat pengumuman |
| **Musyrif** | `musyrif1@ldk.ac.id` | `musyrif123` | Verifasi setoran santri |
| **Anggota** | `anggota1@ldk.ac.id` | `anggota123` | Submit setoran, lihat progress |

### Langkah Login

1. Klik tombol **"Login"** di home, atau langsung ke `/admin/login`
2. Masukkan email (contoh: `admin@ldk.ac.id`)
3. Masukkan password (contoh: `admin123`)
4. Klik **"Masuk"**
5. Jika berhasil → redirect ke `/dashboard`

**Petunjuk:**
- ✅ Session token disimpan di browser cookie (httpOnly, secure)
- ✅ Berlaku 8 jam, kemudian auto-logout
- ❌ Password salah 3x → coba refresh browser atau gunakan akun lain

### Logout

1. Klik menu user (biasanya di top-right, atau lihat navigasi)
2. Pilih **"Logout"** atau **"Keluar"**
3. Cookie session dihapus, redirect ke login page

---

## 👥 Panduan Per Role

### ADMIN

**Apa itu Admin?**  
Pengelola sistem: membuat user baru, verifikasi data, kelola pengumuman.

#### Login Admin
```
Email: admin@ldk.ac.id
Password: admin123
```

#### Dashboard Admin (akan ditampilkan nanti)

Setelah login, access akan mencakup:

**[BELUM DIIMPLEMENTASI - Fitur Dashboard UI masih dalam development]**

Fitur yang tersedia via API:
- Lihat semua users: `GET /api/admin/users`
- Kelola users: `POST /api/users`, `PUT /api/users/:id`, `DELETE /api/users/:id`
- Lihat info admin: `GET /api/admin/me`
- Terima/reject setoran santri
- Kelola pengumuman

#### Workflow Admin Khas

**Scenario 1: Tambah User Baru (Musyrif)**

```bash
# Via API (belum ada UI)
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -H "Cookie: session_token=<your-token>" \
  -d '{
    "name": "Ustadz Budi",
    "email": "ustadz.budi@ldk.ac.id",
    "role": "musyrif"
  }'
```

**Scenario 2: Verifikasi Setoran Santri**

- Tab "Setoran Menunggu" → lihat daftar setoran
- Klik masing-masing → review nilai (Tajwid, Kelancaran, Makhraj)
- Terima atau tolak
- Kirim feedback ke santri

**Scenario 3: Broadcast Pengumuman**

- Klik "Pengumuman"
- Buat baru atau edit
- Pilih target (Admin/Musyrif/Anggota)
- Publish

---

### MUSYRIF (Guru)

**Apa itu Musyrif?**  
Guru hafalan: verifikasi setoran santri, beri feedback, track progress.

#### Login Musyrif
```
Email: musyrif1@ldk.ac.id
Password: musyrif123
```

#### Dashboard Musyrif (akan ditampilkan nanti)

**[BELUM DIIMPLEMENTASI - Fitur Dashboard UI masih dalam development]**

Akses via API:

#### Workflow Musyrif Khas

**Scenario 1: Lihat Setoran Santri (Hari Ini)**

```bash
curl -X GET http://localhost:3000/api/setoran \
  -H "Cookie: session_token=<your-token>"
```

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "anggota_id": 3,
      "target_date": "2026-10-03",
      "nilai_tajwid": 85,
      "nilai_kelancaran": 90,
      "nilai_makhraj": 88,
      "feedback": "Bagus! Tajwid sudah lebih baik",
      "musyrif_id": 2,
      "created_at": "2026-10-03T08:30:00Z"
    }
  ]
}
```

**Scenario 2: Verifikasi & Beri Feedback**

```bash
curl -X PUT http://localhost:3000/api/setoran/1 \
  -H "Content-Type: application/json" \
  -H "Cookie: session_token=<your-token>" \
  -d '{
    "nilai_tajwid": 87,
    "nilai_kelancaran": 92,
    "nilai_makhraj": 89,
    "feedback": "Mantap! Peningkatan konsisten. Lanjut hafalan surah selanjutnya."
  }'
```

**Scenario 3: Lihat Progress Santri**

```bash
curl -X GET http://localhost:3000/api/progress \
  -H "Cookie: session_token=<your-token>"
```

**Response:**
```json
{
  "data": [
    {
      "user_id": 3,
      "name": "Ahmad Rizki",
      "current_level": "Silver",
      "persentase": 65,
      "setoran_count": 23,
      "avg_score": 87.5
    }
  ]
}
```

**Scenario 4: Lihat Pengumuman**

```bash
curl -X GET http://localhost:3000/api/pengumuman \
  -H "Cookie: session_token=<your-token>"
```

---

### ANGGOTA (Santri)

**Apa itu Anggota?**  
Santri: submit setoran hafalan, lihat feedback, track progress pribadi.

#### Login Anggota
```
Email: anggota1@ldk.ac.id
Password: anggota123
```

#### Dashboard Anggota (akan ditampilkan nanti)

**[BELUM DIIMPLEMENTASI - Fitur Dashboard UI masih dalam development]**

#### Workflow Anggota Khas

**Scenario 1: Submit Setoran Hafalan**

Santri sudah hafal target, minta musyrif dengarkan, musyrif catat nilai.

```bash
# Musyrif submit setoran untuk santri
curl -X POST http://localhost:3000/api/setoran \
  -H "Content-Type: application/json" \
  -H "Cookie: session_token=<your-token>" \
  -d '{
    "anggota_id": 3,
    "target_date": "2026-10-03",
    "nilai_tajwid": 85,
    "nilai_kelancaran": 88,
    "nilai_makhraj": 86,
    "feedback": "Bagus! Lanjutkan hafalan Al-Fatihah dan An-Nas"
  }'
```

**Scenario 2: Lihat Progress Pribadi**

```bash
curl -X GET http://localhost:3000/api/progress \
  -H "Cookie: session_token=<your-token>"

# Response: Lihat level (Bronze/Silver/Gold/Platinum) + persentase
```

**Scenario 3: Lihat Pengumuman Terbaru**

```bash
curl -X GET http://localhost:3000/api/pengumuman \
  -H "Cookie: session_token=<your-token>"

# Admin/musyrif broadcast pengumuman penting
# Contoh: "Jadwal ujian tahfidz: 15-20 Oktober"
```

**Scenario 4: Review Feedback dari Musyrif**

```bash
curl -X GET http://localhost:3000/api/setoran \
  -H "Cookie: session_token=<your-token>"

# Lihat field "feedback" untuk setiap setoran yg sudah diverifikasi
```

---

## 🎯 Fitur Utama

### 1. **Authentication (Autentikasi)**

- Login dengan email + password
- Session token (berlaku 8 jam)
- Role-based access control (Admin/Musyrif/Anggota)
- Secure cookie (httpOnly, SameSite)
- Logout & session invalidation

### 2. **User Management (Admin Only)**

**API Endpoints:**
- `GET /api/users` → Lihat semua users
- `POST /api/users` → Tambah user baru
- `GET /api/users/:id` → Detail user
- `PUT /api/users/:id` → Edit user
- `DELETE /api/users/:id` → Hapus user

**Field User:**
```json
{
  "id": 1,
  "name": "Ahmad Rizki",
  "email": "ahmad@ldk.ac.id",
  "role": "anggota",  // "admin" | "musyrif" | "anggota"
  "active": true,
  "created_at": "2026-10-01T00:00:00Z"
}
```

### 3. **Setoran (Submission Hafalan)**

**Apa itu Setoran?**  
Record setiap kali santri hafal surat/ayat dan diverifikasi musyrif.

**API Endpoints:**
- `GET /api/setoran` → Lihat setoran (role-filtered)
- `POST /api/setoran` → Buat setoran baru
- `GET /api/setoran/:id` → Detail setoran
- `PUT /api/setoran/:id` → Update nilai/feedback
- `DELETE /api/setoran/:id` → Hapus setoran

**Data Setoran:**
```json
{
  "id": 1,
  "anggota_id": 3,
  "musyrif_id": 2,
  "target_date": "2026-10-03",
  "nilai_tajwid": 85,      // (0-100) Ketepatan baca Tajwid
  "nilai_kelancaran": 90,  // (0-100) Kelancaran hafalan
  "nilai_makhraj": 88,     // (0-100) Kejelasan makhraj
  "feedback": "Bagus! Lanjut ke surah berikutnya",
  "created_at": "2026-10-03T08:30:00Z"
}
```

**Penilaian:**
- 🟢 **80-100**: Excellent (Sangat Baik)
- 🟡 **60-79**: Good (Baik)
- 🔴 **0-59**: Need Improvement (Perlu Usaha)

### 4. **Murojaah (Review Session)**

**Apa itu Murojaah?**  
Session mengulang hafalan yang sudah pernah disetorkan sebelumnya.

**API Endpoints:**
- `GET /api/murojaah` → Lihat sessions
- `POST /api/murojaah` → Buat review session
- `GET /api/murojaah/:id` → Detail session
- `PUT /api/murojaah/:id` → Update status
- `DELETE /api/murojaah/:id` → Hapus session

**Data Murojaah:**
```json
{
  "id": 1,
  "anggota_id": 3,
  "musyrif_id": 2,
  "target_surah": "Al-Fatihah, An-Nas",
  "tanggal_review": "2026-10-05",
  "status": "completed",  // "scheduled" | "completed" | "postponed"
  "feedback": "Hafalan stabil, perlu lebih fasih",
  "created_at": "2026-10-03T09:00:00Z"
}
```

### 5. **Progress Tracking**

**API Endpoints:**
- `GET /api/progress` → Progress semua user (admin) atau pribadi (user)
- `GET /api/progress/:user_id` → Progress user tertentu

**Data Progress:**
```json
{
  "user_id": 3,
  "name": "Ahmad Rizki",
  "current_level": "Silver",   // Level berdasarkan jumlah hafalan
  "persentase": 65,            // % progress ke level berikutnya
  "total_hafalan_pages": 15,
  "setoran_count": 23,
  "murojaah_count": 5,
  "avg_score": 87.5
}
```

**Level System:**
| Level | Syarat |
|-------|--------|
| 🥉 Bronze | 0-3 Juz |
| 🥈 Silver | 3-10 Juz |
| 🥇 Gold | 10-25 Juz |
| 💎 Platinum | 25+ Juz (Hafiz) |

### 6. **Pengumuman (Announcements)**

**Apa itu Pengumuman?**  
Informasi/berita dari admin untuk admin/musyrif/semua anggota.

**API Endpoints:**
- `GET /api/pengumuman` → Lihat announcements
- `POST /api/pengumuman` → Buat announcement (admin only)
- `GET /api/pengumuman/:id` → Detail
- `PUT /api/pengumuman/:id` → Edit (creator only)
- `DELETE /api/pengumuman/:id` → Hapus (admin only)

**Data Pengumuman:**
```json
{
  "id": 1,
  "admin_id": 1,
  "title": "Jadwal Ujian Tahfidz Q1",
  "content": "Ujian tahfidz akan dilaksanakan...",
  "target_roles": ["admin", "musyrif", "anggota"],  // siapa yg bisa baca
  "created_at": "2026-10-01T08:00:00Z"
}
```

---

## 📊 Workflow Umum

### **Workflow 1: Santri Menyetorkan Hafalan Baru**

```
┌─ Santri Datang ke Musyrif ─────────────────────────┐
│  ✓ Santri sudah hafal surah/ayat target            │
│  ✓ Minta musyrif dengarkan                          │
└──────────┬────────────────────────────────────────┘
           │
           ▼
┌─ Musyrif Verifikasi ────────────────────────────────┐
│  ✓ Dengarkan santri hafal                           │
│  ✓ Catat nilai: Tajwid (80), Kelancaran (85), ...  │
│  ✓ Buat feedback konstruktif                        │
│  ✓ POST /api/setoran dengan data-data di atas      │
└──────────┬────────────────────────────────────────┘
           │
           ▼
┌─ System Record Setoran ─────────────────────────────┐
│  ✓ Insert ke table `setoran`                        │
│  ✓ Update `progress_hafalan` (increment total)      │
│  ✓ Kirim notifikasi ke admin (optional)             │
└──────────┬────────────────────────────────────────┘
           │
           ▼
┌─ Santri Lihat Hasil ────────────────────────────────┐
│  ✓ GET /api/setoran (filter milik santri)           │
│  ✓ Lihat nilai & feedback di dashboard              │
│  ✓ Motivated untuk hafal surah berikutnya           │
└────────────────────────────────────────────────────┘
```

### **Workflow 2: Admin Membuat Pengumuman**

```
┌─ Admin Login ──────────────────────────────┐
│ Email: admin@ldk.ac.id                     │
│ Password: admin123                         │
└────────────┬────────────────────────────────┘
             │
             ▼
┌─ Admin Klik "Buat Pengumuman" ─────────────┐
│ Form:                                      │
│ - Title: "Jadwal Ujian Q4 2026"            │
│ - Content: "Ujian akan dilaksanakan..."    │
│ - Target: [Admin, Musyrif, Anggota]       │
└────────────┬────────────────────────────────┘
             │
             ▼
┌─ POST /api/pengumuman ─────────────────────┐
│ {                                          │
│   "title": "...",                          │
│   "content": "...",                        │
│   "target_roles": ["admin", "musyrif", ...│
│ }                                          │
└────────────┬────────────────────────────────┘
             │
             ▼
┌─ Broadcast ke Users ───────────────────────┐
│ ✓ Admin lihat di dashboard                 │
│ ✓ Musyrif lihat di pengumuman              │
│ ✓ Anggota lihat di pengumuman              │
└────────────────────────────────────────────┘
```

### **Workflow 3: Santri Track Progress**

```
┌─ Santri Login ────────────────────────────┐
│ Email: anggota1@ldk.ac.id                 │
│ Password: anggota123                      │
└────────────┬────────────────────────────┘
             │
             ▼
┌─ GET /api/progress ───────────────────────┐
│ Response:                                 │
│ {                                         │
│   "current_level": "Silver",              │
│   "persentase": 65,                       │
│   "total_hafalan": "7 Juz",               │
│   "avg_score": 86.5                       │
│ }                                         │
└────────────┬────────────────────────────┘
             │
             ▼
┌─ Santri Lihat Achievement ────────────────┐
│ "Kamu sudah hafal 7 Juz! Silver level"    │
│ "Masih 3 Juz lagi untuk status Hafiz!"    │
│ → Motivation tinggi ✓                     │
└─────────────────────────────────────────┘
```

---

## 🐛 Troubleshooting

### **Problem: Tidak Bisa Koneksi ke Database**

**Error:**
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solusi:**

1. Cek PostgreSQL jalan:
```bash
# Mac/Linux
pg_isready -h localhost -p 5432

# Output: accepting connections = OK
```

2. Cek DATABASE_URL di `.env`:
```bash
cat .env | grep DATABASE_URL
```

3. Test koneksi manual:
```bash
psql $DATABASE_URL -c "SELECT 1"
```

---

### **Problem: Lupa Password Login**

**Solusi:**

1. Gunakan akun lain (admin/musyrif/anggota)
2. Atau reset manual di database:
```bash
psql $DATABASE_URL -c \
  "UPDATE users SET password_hash='admin123' WHERE email='admin@ldk.ac.id';"
```

---

### **Problem: Session Expired Tiba-tiba**

**Penyebab:** Token berlaku hanya 8 jam

**Solusi:**

1. Login ulang
2. Atau extend AUTH_SECRET di `.env`

```env
AUTH_SECRET=ganti-dengan-string-panjang-random-min-32-karakter
```

---

### **Problem: API Endpoint Return 401 Unauthorized**

**Penyebab:** Cookie session tidak dikirim atau invalid

**Solusi:**

```bash
# Pastikan mengirim cookie di request
curl -X GET http://localhost:3000/api/auth/me \
  -H "Cookie: session_token=<valid-token>"

# Atau refresh login
```

---

### **Problem: Dashboard Kosong/Blank**

**Penyebab:** Frontend UI belum selesai (masih stub component)

**Info:** Dashboard HTML UI sedang dalam pengembangan. Sementara itu gunakan:
- API endpoints langsung via Postman/curl
- Atau tunggu frontend implementation selesai

---

### **Problem: npm install Error**

**Solusi:**

```bash
# Clear cache
npm cache clean --force

# Hapus node_modules & package-lock.json
rm -rf node_modules package-lock.json

# Install ulang
npm install
```

---

## 📱 Testing dengan Postman/Curl

### Contoh: Login & Get User Info

```bash
# 1. Login
RESPONSE=$(curl -s -c cookies.txt -X POST \
  http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@ldk.ac.id","password":"admin123"}')

echo $RESPONSE
# Output: {"user":{"id":1,"email":"admin@ldk.ac.id","role":"admin"}}

# 2. Get current user
curl -s -b cookies.txt \
  http://localhost:3000/api/auth/me

# Output: {"user":{"id":1,"email":"admin@ldk.ac.id","role":"admin",...}}

# 3. List all users (admin only)
curl -s -b cookies.txt \
  http://localhost:3000/api/users

# Output: {"users":[...]}

# 4. Logout
curl -X POST -b cookies.txt \
  http://localhost:3000/api/auth/logout
```

---

## 📈 Next Steps

Setelah memahami alur penggunaan:

1. **Testing Fitur** - Coba semua role (admin, musyrif, anggota)
2. **Explore API** - Gunakan Postman/Insomnia untuk test endpoints
3. **Build Frontend** - Dashboard UI masih dalam development
4. **Production Deploy** - Setup Docker, database production, monitoring
5. **Go-Live** - Sosialisasi user, training staff

---

## 📞 Support

- Email: admin@ldk.ac.id (akun admin test)
- Database queries: `psql $DATABASE_URL`
- API responses: Cek `/src/app/api/*/route.ts` files
- Server logs: `npm run dev` terminal output

---

**Last Updated:** Oktober 3, 2026  
**Status:** Development Preview  
**Version:** 0.1.0
