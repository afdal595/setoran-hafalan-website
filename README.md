# Setoran Hafalan Website

Aplikasi Next.js untuk manajemen setoran hafalan LDK: jadwal, setoran, murojaah, progress, pengumuman, dan pengelolaan pengguna berbasis role (`admin`, `musyrif`, `anggota`).

## Stack

- Next.js (App Router)
- TypeScript
- PostgreSQL (`pg`)
- Tailwind CSS

## Menjalankan Proyek

1. Install dependency:

```bash
npm install
```

2. Siapkan environment file:

```bash
cp .env.example .env
```

3. Isi nilai di `.env`:

```env
DATABASE_URL=postgresql://setoran_user:password_aman@localhost:5432/setoran_hafalan
AUTH_SECRET=ganti-dengan-secret-random-yang-panjang
```

4. Jalankan database setup (opsional helper):

```bash
./scripts/init-db.sh
```

5. Terapkan schema database:

```bash
psql "$DATABASE_URL" -f src/lib/schema.sql
```

6. Jalankan development server:

```bash
npm run dev
```

App akan berjalan di `http://localhost:3000`.

## Akun Login Awal

Data seed di `src/lib/schema.sql` menyediakan akun berikut:

- Admin: `admin@ldk.ac.id`
- Musyrif: `musyrif1@ldk.ac.id`
- Anggota: `anggota1@ldk.ac.id`

Password default role:

- Admin: `admin123`
- Musyrif: `musyrif123`
- Anggota: `anggota123`

## Script Penting

- `npm run dev`: jalankan mode development.
- `npm run build`: build production.
- `npm run start`: jalankan hasil build.
- `npm run lint`: linting TypeScript/ESLint.
- `./test-guards.sh`: smoke test auth/guard via `curl`.

## Ringkasan API

- Auth:
	- `POST /api/auth/login`
	- `POST /api/auth/logout`
	- `GET /api/auth/me`
- Admin:
	- `GET /api/admin/me`
	- `GET /api/admin/users`
- Users (admin only):
	- `GET /api/users`
	- `POST /api/users`
	- `GET /api/users/:id`
	- `PUT /api/users/:id`
	- `DELETE /api/users/:id`
- Domain:
	- `GET/POST /api/setoran`
	- `GET/PUT/DELETE /api/setoran/:id`
	- `GET/POST /api/murojaah`
	- `GET/PUT/DELETE /api/murojaah/:id`
	- `GET/POST /api/pengumuman`
	- `GET/PUT/DELETE /api/pengumuman/:id`
	- `GET /api/progress`

## Catatan Keamanan

- Jangan gunakan `AUTH_SECRET` default di production.
- Selalu gunakan nilai secret random yang panjang.
- Gunakan koneksi database production yang aman dan terproteksi.
