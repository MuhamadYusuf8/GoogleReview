# ReviewLink – Dynamic QR Code & NFC Redirector

> Platform manajemen tautan dinamis untuk kartu review fisik Google Maps merchant F&B.
> Satu kali cetak kartu, tujuan bisa diubah selamanya.

## Stack Teknologi

| Layer | Teknologi |
|---|---|
| Framework | Next.js 16 (App Router, TypeScript) |
| Database | Supabase PostgreSQL |
| Auth | Supabase Auth |
| Hosting | Vercel (region `sin1` Singapura) |
| QR Generator | `qrcode.react` (client-side) |
| Validasi | `zod` |

---

## Quick Start

### 1. Setup Supabase

1. Buat project baru di [supabase.com](https://supabase.com) — pilih region **Singapore (ap-southeast-1)**
2. Buka **SQL Editor** dan jalankan file migrasi:
   ```
   supabase/migrations/001_initial_schema.sql
   ```
3. Di **Authentication → Settings**:
   - Nonaktifkan **Enable email confirmations** (untuk dev)
   - Nonaktifkan **Enable signups** (hanya admin bisa dibuat manual)
4. Buat akun admin pertama via **Authentication → Users → Add User**
5. Catat **Project URL**, **anon key**, dan **service_role key** dari **Project Settings → API**

### 2. Setup Environment Variables

Salin `.env.local` dan isi dengan kredensial Supabase:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Domain pendek yang tercetak pada kartu fisik
NEXT_PUBLIC_SHORT_DOMAIN=go.reviewku.id

# URL aplikasi
NEXT_PUBLIC_APP_URL=https://go.reviewku.id
```

> ⚠️ **PENTING:** `SUPABASE_SERVICE_ROLE_KEY` **TIDAK BOLEH** punya prefix `NEXT_PUBLIC_`. Key ini hanya boleh ada di server.

### 3. Jalankan Lokal

```bash
npm install
npm run dev
# Buka http://localhost:3000
```

---

## Struktur Project

```
app/
├── app/
│   ├── r/[slug]/route.ts          ← Redirect Engine (core)
│   ├── admin/
│   │   ├── layout.tsx             ← Protected layout (double auth guard)
│   │   ├── page.tsx               ← Dashboard dengan stats
│   │   ├── merchants/page.tsx     ← CRUD Merchant
│   │   ├── links/page.tsx         ← CRUD Links + QR Generator
│   │   └── analytics/page.tsx     ← Analytics dashboard
│   ├── login/page.tsx
│   ├── not-found.tsx              ← 404 branded
│   ├── link-inactive/page.tsx     ← 410 (link paused/archived)
│   └── 503/page.tsx               ← 503 (DB error)
├── components/admin/
│   ├── AdminSidebar.tsx
│   ├── MerchantsClient.tsx
│   ├── LinksClient.tsx            ← Termasuk modal QR
│   ├── QRGenerator.tsx            ← PNG 1200px + SVG + NFC URL
│   └── AnalyticsClient.tsx        ← Charts + CSV export
├── lib/
│   ├── supabase/
│   │   ├── client.ts              ← Browser client
│   │   ├── server.ts              ← Server client + service role client
│   │   ├── database.types.ts      ← DB type definitions
│   │   └── types.ts               ← Row type helpers
│   ├── validations.ts             ← Zod schemas + allowlist + slug rules
│   └── analytics.ts               ← UA parsing, bot detection, payload builder
├── middleware.ts                   ← Auth middleware (Next.js proxy)
└── supabase/migrations/
    └── 001_initial_schema.sql     ← Full DB schema + RLS + triggers + RPC
```

---

## Cara Kerja Redirect

```
Pelanggan scan QR / tap NFC
    ↓
https://go.reviewku.id/r/<slug>?s=qr
    ↓
Route Handler: app/r/[slug]/route.ts
    1. Validasi format slug (tanpa DB query)
    2. Query Supabase: SELECT target_url, status (satu query, indeks unik)
    3. Verifikasi ulang target_url (runtime allowlist check)
    4. HTTP 302 + Cache-Control: no-store
    ↓ (asinkron, setelah respons terkirim)
    5. INSERT scan_events (link_id, source, device, os, country, is_bot)
    ↓
Pelanggan masuk ke form ulasan Google Maps
```

**Target performa:** p50 < 100ms, p95 < 300ms server-side

---

## Fitur Utama

### Redirect Engine (M1)
- ✅ HTTP 302 + `Cache-Control: no-store` (perubahan aktif ≤ 5 detik)
- ✅ Validasi slug sebelum query DB (hemat round-trip)
- ✅ Runtime re-verification target URL (keamanan open redirect)
- ✅ Logging asinkron via `after()` (tidak memperlambat redirect)
- ✅ Halaman bermerek: 404, 410, 503

### Dashboard Admin (M2)
- ✅ Login Supabase Auth dengan verifikasi role `admin`
- ✅ CRUD Merchant + pembantu Google Place ID
- ✅ CRUD Links: slug immutable, validasi zod + allowlist, cek slug real-time
- ✅ Audit trail perubahan target URL (`link_target_history`)
- ✅ Toggle status link (active/paused/archived) langsung dari tabel

### QR Generator (M3)
- ✅ Preview QR di modal
- ✅ Download PNG 1200×1200px (siap cetak)
- ✅ Download SVG (vektor, skala bebas)
- ✅ Salin URL NFC (`?s=nfc`) ke clipboard

### Analytics (M4)
- ✅ Total scan 7/30 hari
- ✅ Split QR vs NFC dengan progress bar
- ✅ Grafik tren harian (mini bar chart)
- ✅ Top 10 link terpakai
- ✅ Export CSV

---

## Database Schema

Lihat [`supabase/migrations/001_initial_schema.sql`](supabase/migrations/001_initial_schema.sql) untuk DDL lengkap.

**Tabel utama:**
- `profiles` — peran admin
- `merchants` — data klien F&B
- `links` — slug (immutable) + target_url (mutable) + status
- `link_target_history` — audit trail perubahan target URL
- `scan_events` — log setiap scan/tap (tanpa IP, tanpa PII)

---

## Deploy ke Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables di Vercel Dashboard:
# NEXT_PUBLIC_SUPABASE_URL
# NEXT_PUBLIC_SUPABASE_ANON_KEY
# SUPABASE_SERVICE_ROLE_KEY
# NEXT_PUBLIC_SHORT_DOMAIN
# NEXT_PUBLIC_APP_URL
```

**Pengaturan Vercel yang direkomendasikan:**
- Region: `sin1` (Singapura) — dekat dengan Supabase `ap-southeast-1`
- Runtime: Node.js (default) — benchmark dulu sebelum pindah ke Edge

---

## Security Checklist

- [x] HTTPS + HSTS header aktif (`next.config.ts`)
- [x] Pencegahan open redirect: allowlist domain + runtime re-verification
- [x] Supabase RLS aktif di semua tabel, anon role diblokir
- [x] Service role key hanya di server, tidak di `NEXT_PUBLIC_`
- [x] Auth: session dicek di middleware DAN di setiap Server Action
- [x] Validasi semua input dengan zod di server
- [x] Slug reserved list (admin, api, login, r, _next, dll.)
- [x] Tidak ada IP atau PII tersimpan di scan_events
- [ ] Rate limiting (tambahkan Vercel WAF atau Upstash Ratelimit di M5)
- [ ] MFA untuk akun admin (aktifkan di Supabase Auth settings)
- [ ] Uptime monitoring (UptimeRobot / Better Stack)
- [ ] Supabase upgrade ke paket Pro (wajib sebelum produksi)

---

## Pertanyaan Terbuka (Sebelum Produksi)

1. **Domain:** Apa domain pendek yang akan dipakai? (saat ini placeholder: `go.reviewku.id`)
2. **Supabase Pro:** Upgrade wajib — paket gratis bisa di-pause otomatis
3. **Rate limiting:** Implementasi Upstash Ratelimit sebelum go-live
4. **NFC tag:** Rekomendasi NTAG213/215, kunci chip setelah verifikasi

---

## Roadmap Pasca-MVP

- [ ] Portal read-only untuk merchant
- [ ] Peran operator (akses terbatas)
- [ ] Cache edge (Upstash Redis) dengan TTL ≤ 5 detik
- [ ] Agregat harian otomatis via `pg_cron`
- [ ] Laporan PDF/email otomatis per merchant
- [ ] Custom domain per merchant
