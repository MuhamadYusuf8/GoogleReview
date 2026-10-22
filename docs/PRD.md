# Product Requirements Document: Dynamic QR Code & NFC Redirector

*Versi 1.0 (Draft MVP) · 23 Oktober 2026 · Disusun oleh: Senior Product Manager & Technical Lead · Status: Siap menjadi acuan development*

## 1. Product Overview & Vision

### 1.1 Ringkasan Produk

**Dynamic QR Code & NFC Redirector** adalah platform manajemen tautan dinamis untuk mendukung kartu fisik Google Review milik merchant F&B. Setiap kartu memuat QR Code dan chip NFC yang **hanya** menyimpan satu short-link permanen pada domain milik agensi (contoh: `https://go.domainanda.id/r/kopi-senja-tebet`). Ketika pelanggan memindai atau men-tap kartu, sistem mencari tujuan terbaru pada database lalu mengarahkan pelanggan ke halaman ulasan Google Maps merchant melalui HTTP 302 redirect.

Karena kartu hanya menyimpan short-link, tujuan akhir dapat diganti kapan saja dari dashboard admin tanpa mencetak ulang kartu atau menulis ulang chip NFC.

### 1.2 Masalah yang Diselesaikan

- **Kartu cetak bersifat permanen, sedangkan tujuan bisa berubah.** Tautan Google Maps bisa salah, merchant bisa pindah lokasi, atau agensi perlu mengganti format tautan review. Tanpa lapisan perantara, kartu menjadi usang dan harus dicetak ulang.
- **Biaya dan waktu pencetakan ulang.** Satu kesalahan tautan pada satu batch kartu berarti biaya cetak, biaya penulisan ulang NFC, dan keterlambatan kampanye.
- **Tidak ada visibilitas penggunaan.** Agensi tidak tahu apakah kartu benar-benar dipindai, sehingga sulit membuktikan nilai layanan kepada merchant.
- **Manajemen tautan tersebar.** Tautan, slug, dan QR per merchant biasanya tercatat di spreadsheet atau chat, rawan salah dan tidak terkontrol.

### 1.3 Visi

Menjadi “pusat kendali” tunggal bagi agensi untuk seluruh kartu review fisik: satu kali cetak, tujuan bisa diubah selamanya, dan performa setiap kartu dapat diukur.

### 1.4 Tujuan Utama & Indikator Keberhasilan

| Tujuan | Indikator Keberhasilan (MVP) |
| --- | --- |
| Redirect cepat dan andal | p95 waktu proses server < 300 ms; tingkat keberhasilan redirect ≥ 99,9% |
| Perubahan tujuan real-time | Target URL baru aktif ≤ 5 detik setelah disimpan, tanpa cetak ulang |
| Operasional admin efisien | Onboarding merchant baru (merchant + slug + QR siap unduh) ≤ 3 menit |
| Visibilitas performa kartu | Total scan/tap per link tersedia di dashboard dengan selisih data ≤ 1 menit |
| Biaya rendah | Berjalan pada Vercel + Supabase dengan biaya infrastruktur terkendali untuk ratusan link |

### 1.5 Ruang Lingkup

**In scope (MVP):** redirect engine, dashboard admin (login, CRUD merchant dan link), QR generator sisi klien, analytics sederhana (total scan, sumber QR vs NFC, tren harian).

**Out of scope (MVP):** portal login untuk merchant, multi-tenant/multi-agensi, A/B routing atau rotasi tujuan, custom domain per merchant, pembayaran/billing, integrasi Google Business Profile API, pemantauan rating atau ulasan Google.

## 2. User Roles & Personas

| Peran | Akses ke Sistem | Deskripsi |
| --- | --- | --- |
| **Admin Agensi** | Dashboard (login) | Pemilik/pengelola layanan. Mengelola merchant, slug, target URL, QR, dan melihat analytics. Satu-satunya peran dengan akses tulis pada MVP. |
| **Pelanggan F&B (End User)** | Publik, tanpa login | Pengunjung merchant yang memindai QR atau men-tap NFC pada kartu untuk menulis ulasan. Hanya berinteraksi dengan endpoint redirect. |
| **Merchant F&B** | Tidak ada pada MVP | Pemilik outlet; penerima manfaat. Menerima laporan performa dari admin secara manual. Portal read-only masuk roadmap pasca-MVP. |
| **Operator/Staf Agensi** *(fase lanjutan)* | Dashboard (login) | Staf dengan hak terbatas (misalnya hanya mengelola link, tidak dapat menghapus merchant). |

**Persona 1: Rina, Admin Agensi.** Mengelola puluhan merchant dari laptop dan kadang dari ponsel. Butuh alur cepat untuk membuat link, mengganti tujuan saat ada kesalahan, dan mengunduh QR siap cetak. Frustrasi utama: salah tautan pada kartu yang sudah tercetak.

**Persona 2: Dimas, Pelanggan Kafe.** Selesai makan, ingin memberi ulasan dengan usaha minimal. Memindai QR atau men-tap NFC dengan ponsel, dan mengharapkan langsung masuk ke form ulasan tanpa halaman antara, tanpa login tambahan, dan tanpa menunggu.

## 3. User Stories

### Epic A: Redirect (Pelanggan)

| ID | User Story | Prioritas |
| --- | --- | --- |
| US-01 | As a **pelanggan**, I want to memindai QR atau men-tap NFC dan langsung diarahkan ke form ulasan Google Maps merchant so that saya bisa menulis ulasan dengan cepat. | Must |
| US-02 | As a **pelanggan**, I want to melihat halaman pesan yang jelas jika kartu sudah tidak aktif so that saya tidak bingung melihat error teknis. | Should |

### Epic B: Manajemen Merchant & Link (Admin)

| ID | User Story | Prioritas |
| --- | --- | --- |
| US-03 | As an **admin**, I want to login dengan aman so that hanya saya yang dapat mengubah tautan. | Must |
| US-04 | As an **admin**, I want to menambah, mengubah, dan menonaktifkan merchant so that data klien saya tertata. | Must |
| US-05 | As an **admin**, I want to membuat link baru dengan slug khusus dan target URL untuk sebuah merchant so that kartu baru dapat segera dicetak. | Must |
| US-06 | As an **admin**, I want to mengubah target URL sebuah link so that kartu yang sudah tercetak otomatis mengarah ke tujuan yang benar. | Must |
| US-07 | As an **admin**, I want to mengaktifkan/menjeda/mengarsipkan link so that saya dapat menghentikan kartu merchant yang berhenti berlangganan. | Must |
| US-08 | As an **admin**, I want to divalidasi otomatis saat memasukkan target URL (format dan domain Google) so that saya tidak menyimpan tautan yang salah atau berbahaya. | Must |
| US-09 | As an **admin**, I want to menguji (preview) target URL sebelum atau sesudah disimpan so that saya yakin tujuan sudah benar. | Should |
| US-10 | As an **admin**, I want to melihat riwayat perubahan target URL so that saya bisa melacak dan membatalkan kesalahan. | Should |

### Epic C: QR Generator (Admin)

| ID | User Story | Prioritas |
| --- | --- | --- |
| US-11 | As an **admin**, I want to melihat pratinjau QR untuk setiap link so that saya dapat memastikan QR sesuai slug. | Must |
| US-12 | As an **admin**, I want to mengunduh QR dalam PNG resolusi tinggi dan SVG so that file siap dikirim ke percetakan. | Must |

### Epic D: Analytics (Admin)

| ID | User Story | Prioritas |
| --- | --- | --- |
| US-13 | As an **admin**, I want to melihat total scan/tap per link dan per merchant so that saya dapat membuktikan nilai layanan kepada merchant. | Must |
| US-14 | As an **admin**, I want to membedakan scan QR dan tap NFC so that saya tahu media mana yang paling efektif. | Should |
| US-15 | As an **admin**, I want to melihat tren harian dalam rentang waktu tertentu so that saya dapat mengidentifikasi lonjakan atau kartu yang tidak terpakai. | Should |
| US-16 | As an **admin**, I want to mengekspor data scan ke CSV so that saya dapat membuat laporan untuk merchant. | Could |

## 4. Functional Requirements

Prioritas menggunakan skema MoSCoW (M = Must, S = Should, C = Could).

### 4.1 Redirect Engine

**Endpoint publik:** `GET /r/[slug]` (Next.js App Router, Route Handler `app/r/[slug]/route.ts`). Namespace `/r/` dipilih agar tidak bentrok dengan rute aplikasi seperti `/admin` dan `/login`.

**Alur logika:**

1. Terima request, baca `slug` dari path dan parameter `s` dari query string (`qr` atau `nfc`) sebagai penanda sumber.
2. Normalisasi slug: huruf kecil, trim. Tolak jika tidak sesuai pola `^[a-z0-9]+(-[a-z0-9]+)*$` atau panjang di luar 3–40 karakter (respons 404 tanpa menyentuh database).
3. Query ke tabel `links` (join status merchant) berdasarkan `slug` terindeks unik.
4. Evaluasi status dan kirim respons sesuai tabel di bawah.
5. Secara **asinkron** (tidak memblokir respons) catat event scan.

| ID | Requirement | Prioritas |
| --- | --- | --- |
| FR-RE-01 | Slug dicocokkan secara *case-insensitive* melalui normalisasi ke huruf kecil; query string tambahan diabaikan pada pencocokan. | M |
| FR-RE-02 | Link berstatus `active` milik merchant aktif dibalas **HTTP 302** dengan header `Location` berisi `target_url`. | M |
| FR-RE-03 | Respons redirect wajib membawa `Cache-Control: no-store` agar browser, CDN, atau proxy tidak menyimpan tujuan lama. Dilarang memakai 301/308 karena akan di-cache permanen. | M |
| FR-RE-04 | Pencatatan scan dijalankan di luar jalur kritis (`after()` dari `next/server` atau `waitUntil`). Kegagalan pencatatan tidak boleh menggagalkan atau memperlambat redirect. | M |
| FR-RE-05 | Slug tidak ditemukan: tampilkan halaman 404 bermerek dengan pesan ramah. | M |
| FR-RE-06 | Link berstatus `paused`/`archived` atau merchant nonaktif: tampilkan halaman informasi “Tautan tidak aktif” dengan HTTP 410. | S |
| FR-RE-07 | Jika database tidak dapat dijangkau, tampilkan halaman error sederhana (HTTP 503) dan kirim alert ke admin. | S |
| FR-RE-08 | Tambahkan header `X-Robots-Tag: noindex` dan `Referrer-Policy: no-referrer` pada respons redirect. | S |
| FR-RE-09 | Redirect hanya ke URL `https` yang lolos validasi allowlist domain pada saat penyimpanan **dan** diverifikasi ulang saat runtime sebelum mengirim `Location`. | M |

**Matriks respons:**

| Kondisi | Status HTTP | Perilaku |
| --- | --- | --- |
| Slug valid, link `active`, merchant aktif | 302 | Redirect ke `target_url`, catat scan |
| Format slug tidak valid / tidak ditemukan | 404 | Halaman “Tautan tidak ditemukan” |
| Link `paused`/`archived` atau merchant nonaktif | 410 | Halaman “Tautan tidak aktif” |
| Rate limit terlampaui | 429 | Pesan singkat, coba lagi nanti |
| Gangguan database | 503 | Halaman error + alert |

**Catatan tentang sumber (QR vs NFC):** QR memuat `…/r/slug?s=qr`, sedangkan chip NFC ditulis dengan `…/r/slug?s=nfc`. Tanpa parameter, sumber dicatat `unknown`. Slug yang sama dipakai untuk satu kartu fisik, sehingga satu link mewakili satu kartu (QR + NFC).

### 4.2 Admin Dashboard

Rute dilindungi di bawah `/admin/*`; autentikasi menggunakan Supabase Auth (email + password), dengan pemeriksaan sesi di `middleware.ts` dan di setiap Server Action/Route Handler.

| ID | Requirement | Prioritas |
| --- | --- | --- |
| FR-AD-01 | Login/logout admin dengan Supabase Auth. Akses ditolak untuk akun tanpa `role = admin` pada tabel `profiles`. Registrasi publik dinonaktifkan. | M |
| FR-AD-02 | **Merchant CRUD:** tambah, lihat, ubah (nama, kontak, catatan, Google Place ID opsional), nonaktifkan. Hapus permanen hanya jika merchant tidak memiliki link (penghapusan lunak lewat `is_active`). | M |
| FR-AD-03 | **Link CRUD:** buat link (merchant, slug, label, target URL), ubah target URL dan label, ubah status (`active`/`paused`/`archived`). | M |
| FR-AD-04 | **Slug immutable setelah dibuat.** Slug tercetak pada kartu sehingga mengubahnya akan merusak kartu. Untuk “menghapus”, gunakan arsip, bukan hapus; slug yang diarsipkan tidak dapat dipakai ulang. | M |
| FR-AD-05 | Aturan slug: 3–40 karakter, huruf kecil, angka, tanda hubung tunggal; unik secara global; tidak boleh termasuk daftar terlarang (misalnya `admin`, `api`, `login`, `r`, `_next`, `static`). Cek ketersediaan *real-time* saat mengetik. | M |
| FR-AD-06 | Validasi target URL: wajib `https`, maksimum 2048 karakter, host harus ada di allowlist yang dapat dikonfigurasi (awal: `search.google.com`, `www.google.com`, `google.com`, `maps.google.com`, `maps.app.goo.gl`, `g.page`, `g.co`). Validasi dengan `zod` di sisi server. | M |
| FR-AD-07 | Daftar link dengan pencarian (nama merchant/slug), filter status, dan pengurutan; menampilkan total scan ringkas per baris. | M |
| FR-AD-08 | Tombol “Uji tautan” yang membuka target URL pada tab baru. | S |
| FR-AD-09 | Riwayat perubahan target URL (siapa, kapan, nilai lama → baru) dengan opsi pulihkan ke versi sebelumnya. | S |
| FR-AD-10 | Pembantu Place ID: admin memasukkan Google Place ID, sistem menyusun URL `https://search.google.com/local/writereview?placeid=<PLACE_ID>`. | S |
| FR-AD-11 | Konfirmasi (dialog) sebelum mengubah target URL link `active` dan sebelum menjeda/mengarsipkan link. | S |
| FR-AD-12 | Antarmuka responsif untuk penggunaan di ponsel. | S |

**Kriteria penerimaan utama (FR-AD-03 + FR-RE-02):** setelah admin menyimpan target URL baru, permintaan berikutnya ke `/r/[slug]` mengembalikan `Location` baru dalam ≤ 5 detik tanpa pembersihan cache manual.

### 4.3 QR Generator

QR dirender di sisi klien dengan `qrcode.react` pada Client Component (`'use client'`). **QR hanya mengkodekan short-link** (bukan target URL), sehingga QR yang sama tetap valid selamanya.

| ID | Requirement | Prioritas |
| --- | --- | --- |
| FR-QR-01 | Isi QR: `https://<DOMAIN_APLIKASI>/r/<slug>?s=qr`. Domain dibaca dari environment variable `NEXT_PUBLIC_SHORT_DOMAIN`, bukan dari hard-code. | M |
| FR-QR-02 | Pratinjau QR tampil pada halaman detail link dan dalam modal dari daftar link. | M |
| FR-QR-03 | Unduh **PNG** resolusi tinggi (minimum 1200 × 1200 px) dengan latar putih opak dan *quiet zone* ≥ 4 modul. | M |
| FR-QR-04 | Unduh **SVG** (vektor) untuk pencetakan skala besar tanpa kehilangan ketajaman. | M |
| FR-QR-05 | Tingkat koreksi kesalahan default **Q**; **H** jika admin menambahkan logo di tengah. Logo opsional maksimal ±20% area QR. | S |
| FR-QR-06 | Nama file unduhan konsisten: `qr-<slug>.png` / `qr-<slug>.svg`. | M |
| FR-QR-07 | Kontras warna: modul gelap di atas latar terang. Pengaturan warna kustom diizinkan hanya bila rasio kontras memadai. | C |
| FR-QR-08 | Unduh massal (ZIP) untuk beberapa link sekaligus. | C |
| FR-QR-09 | Tampilkan juga string URL NFC (`…?s=nfc`) dengan tombol salin, untuk dipakai saat menulis chip NFC (tipe NDEF URI). | S |

**Catatan teknis:** gunakan `QRCodeCanvas` untuk ekspor PNG (`canvas.toBlob`) dan `QRCodeSVG` untuk ekspor SVG (serialisasi elemen). Karena `qrcode.react` murni sisi klien, tidak ada beban komputasi di server.

### 4.4 Analytics Tracker

| ID | Requirement | Prioritas |
| --- | --- | --- |
| FR-AN-01 | Setiap redirect sukses mencatat satu baris pada `scan_events`: `link_id`, waktu, sumber (`qr`/`nfc`/`unknown`), tipe perangkat, OS, negara, penanda bot. | M |
| FR-AN-02 | Tidak menyimpan IP mentah maupun identitas pribadi. Negara diambil dari header geolokasi Vercel (`x-vercel-ip-country`). | M |
| FR-AN-03 | Filter bot/crawler dasar berdasarkan User-Agent; event bot tetap tercatat dengan `is_bot = true` dan tidak dihitung pada metrik. | S |
| FR-AN-04 | Dashboard menampilkan: total scan/tap (seluruh waktu, 7 hari, 30 hari), per link, per merchant. | M |
| FR-AN-05 | Pemecahan sumber QR vs NFC dan grafik tren harian dengan rentang waktu yang dapat dipilih. | S |
| FR-AN-06 | Metrik dihitung lewat query SQL/RPC teragregasi (bukan menarik semua baris ke klien). | M |
| FR-AN-07 | Ekspor CSV event atau ringkasan harian. | C |

**Definisi metrik:** *scan/tap* = satu permintaan redirect berstatus 302 non-bot. Sistem tidak menjamin penghitungan pengguna unik pada MVP (pemindaian ulang oleh orang yang sama tetap dihitung).

## 5. Non-Functional Requirements

### 5.1 Performa

- **Waktu proses redirect:** p50 < 100 ms dan p95 < 300 ms (diukur di sisi server, di luar latensi jaringan pengguna). Target pengalaman pengguna: halaman Google Maps mulai dimuat < 1 detik setelah scan pada jaringan 4G.
- Jalur kritis hanya berisi **satu** query ber-indeks (`links.slug`) dan pengiriman header 302. Tidak ada render HTML, tidak ada query tambahan, tidak ada penulisan sinkron.
- Region eksekusi fungsi Vercel diset sedekat mungkin dengan database (mis. `sin1` Singapura) dan **proyek Supabase dibuat di region Singapura (`ap-southeast-1`)** karena mayoritas pengguna berada di Indonesia. Pilihan runtime (Edge vs Node.js) diputuskan lewat benchmark pada Milestone 1.
- Gunakan pustaka seminimal mungkin pada route redirect (hindari impor besar) agar *cold start* kecil.
- **Strategi cache:** pada MVP tidak ada cache sehingga perubahan langsung efektif. Jika benchmark menunjukkan latensi database tidak memadai, tambahkan cache sisi server (mis. Upstash Redis/Vercel Edge Config) dengan *write-through invalidation* saat admin menyimpan perubahan, dengan TTL maksimum 5 detik agar tetap memenuhi syarat “real-time”.

### 5.2 Ketersediaan & Keandalan

- Target ketersediaan endpoint redirect 99,9% per bulan.
- **Gunakan paket Supabase berbayar (Pro) untuk produksi.** Proyek paket gratis dapat di-*pause* otomatis saat tidak aktif, yang akan mematikan seluruh kartu fisik.
- Pencatatan analytics bersifat *best effort*; kegagalan tidak memengaruhi redirect.
- Pencadangan database otomatis harian (bawaan Supabase) dan ekspor berkala tabel `links` sebagai cadangan independen.
- **Domain adalah aset kritis.** Seluruh kartu bergantung pada satu domain; wajib didaftarkan atas nama agensi, auto-renew aktif, dan masa registrasi multi-tahun.
- Uptime monitoring eksternal (mis. UptimeRobot/Better Stack) pada slug uji dengan alert ke email/WhatsApp admin.

### 5.3 Keamanan

- HTTPS wajib dengan HSTS; seluruh traffic HTTP dialihkan ke HTTPS.
- **Pencegahan open redirect:** target URL hanya dapat diatur oleh admin terautentikasi, divalidasi terhadap allowlist domain, dan diverifikasi ulang saat runtime. Parameter query tidak pernah menentukan tujuan.
- **Supabase RLS aktif pada seluruh tabel.** Tidak ada kebijakan untuk peran `anon`. Route redirect memakai `SUPABASE_SERVICE_ROLE_KEY` yang hanya hidup di environment variable server (tidak pernah memakai prefiks `NEXT_PUBLIC_` dan tidak pernah dikirim ke klien).
- Akses admin melalui Supabase Auth; sesi dicek di middleware **dan** di tiap Server Action. Otorisasi berbasis `profiles.role`. Dianjurkan mengaktifkan MFA untuk akun admin.
- Seluruh input divalidasi di server (`zod`); query menggunakan parameter terikat (klien Supabase), tanpa SQL string mentah.
- **Rate limiting** pada `/r/*` (mis. 120 permintaan/menit/IP, longgar karena satu IP kafe dapat dipakai banyak pelanggan) melalui Vercel WAF atau Upstash Ratelimit. Rate limit lebih ketat pada halaman login.
- Seluruh perubahan penting dicatat pada audit trail (`link_target_history`).
- Secret dikelola lewat Vercel Environment Variables; tidak ada secret di repositori.

### 5.4 Privasi

- Tidak ada penyimpanan IP, cookie pelacak, atau identitas pribadi pelanggan. Hanya metrik agregat dan atribut perangkat kasar.
- Redirect tidak menampilkan halaman perantara dan tidak memuat skrip pihak ketiga.
- Kebijakan retensi: `scan_events` mentah disimpan 12 bulan, setelahnya hanya ringkasan harian.

### 5.5 Skalabilitas

- **Estimasi beban awal:** 100–500 link × rata-rata 300–1.000 scan/bulan ≈ 30.000–500.000 event/bulan. Beban ini sangat ringan bagi satu instance PostgreSQL dan fungsi serverless Vercel yang menskalakan otomatis.
- Indeks: unik pada `links.slug`; komposit `(link_id, scanned_at)` pada `scan_events`.
- Jika pertumbuhan melampaui ±5 juta baris event: buat tabel agregat harian (`link_stats_daily`) via cron (`pg_cron`), terapkan partisi per bulan pada `scan_events`, dan hapus data mentah lama.
- Rute redirect bersifat *stateless* sehingga dapat diskalakan horizontal tanpa perubahan arsitektur.

### 5.6 Observability & Maintainability

- Log terstruktur pada Vercel untuk setiap redirect gagal/404/503; pantau tingkat 404 sebagai indikator kartu rusak.
- Pelacakan galat (mis. Sentry) untuk dashboard dan route redirect.
- Linting, TypeScript strict, dan tes otomatis untuk fungsi validasi slug, validasi URL, dan route redirect.
- Dokumentasi README: setup lokal, variabel lingkungan, skema database, dan prosedur *rollback*.

## 6. High-Level Data Flow

### 6.1 Alur Scan/Tap Pelanggan

```
Pelanggan ──scan QR / tap NFC──► Ponsel membuka  https://go.domainanda.id/r/kopi-senja-tebet?s=qr
                                         │
                                         ▼
                         Vercel (Next.js Route Handler /r/[slug])
                           1. Validasi & normalisasi slug
                           2. Query Supabase: SELECT target_url, status
                              FROM links JOIN merchants WHERE slug = $1
                           3. Evaluasi status
                                │                     │
                          active│                     │not found / inactive
                                ▼                     ▼
                  HTTP 302 + Location: target_url   Halaman 404 / 410
                  Cache-Control: no-store
                                │
              (asinkron, setelah respons dikirim)
                                └──► INSERT scan_events (link_id, source, device, os, country, is_bot)
                                ▼
                Ponsel mengikuti redirect ke Google Maps
                → Form ulasan Google terbuka untuk pelanggan
```

**Rincian langkah:**

1. Pelanggan memindai QR dengan kamera atau men-tap kartu NFC (NDEF URI record); ponsel membuka short-link dalam browser.
2. Permintaan masuk ke Vercel, dan route `/r/[slug]` memvalidasi format slug.
3. Route melakukan satu query ke Supabase (PostgREST/`supabase-js`) berdasarkan `slug` ber-indeks unik.
4. Jika ditemukan dan aktif, server mengirim **302** dengan `Location` = `target_url` dan `Cache-Control: no-store`.
5. Setelah respons terkirim, fungsi asinkron (`after()`/`waitUntil`) menulis satu baris `scan_events`.
6. Browser mengikuti redirect; pelanggan melihat form ulasan Google Maps. Seluruh proses idealnya tidak terasa lebih dari sekejap.

### 6.2 Alur Perubahan Tujuan oleh Admin

1. Admin login, membuka link merchant, dan mengubah target URL.
2. Server Action memvalidasi sesi, peran, dan URL (zod + allowlist).
3. Dalam satu transaksi: `UPDATE links SET target_url = …` dan `INSERT link_target_history`.
4. Cache (jika diaktifkan pada fase lanjutan) diinvalidasi.
5. Scan berikutnya langsung mengarah ke tujuan baru; kartu fisik tidak berubah.

### 6.3 Alur Pembuatan QR

Admin membuka detail link → komponen klien merender QR dari string short-link → admin mengunduh PNG/SVG → file dikirim ke percetakan, dan string NFC disalin untuk ditulis ke chip (disarankan memakai tag NTAG213/215 yang dikunci setelah penulisan agar tidak dapat ditimpa).

## 7. Database Schema Requirements

Database: Supabase PostgreSQL. Seluruh tabel di skema `public` dengan **RLS diaktifkan** dan tanpa kebijakan untuk `anon`. Akses admin lewat kebijakan berbasis `profiles.role = 'admin'`; route redirect memakai service role di sisi server.

### 7.1 Ringkasan Tabel

| Tabel | Fungsi |
| --- | --- |
| `profiles` | Peran pengguna admin (terhubung ke `auth.users`). |
| `merchants` | Data klien F&B. |
| `links` | Short-link: slug, target URL, status; satu link mewakili satu kartu/outlet. |
| `link_target_history` | Audit perubahan target URL. |
| `scan_events` | Catatan mentah setiap scan/tap. |
| `link_stats_daily` *(fase lanjutan)* | Agregat harian untuk skala besar. |

### 7.2 DDL Acuan

```sql
-- Enum
create type link_status as enum ('active', 'paused', 'archived');
create type scan_source as enum ('qr', 'nfc', 'unknown');
create type user_role   as enum ('admin', 'operator');

-- Profil admin
create table profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  role       user_role not null default 'admin',
  full_name  text,
  created_at timestamptz not null default now()
);

-- Merchant
create table merchants (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  contact_name    text,
  contact_phone   text,
  google_place_id text,
  notes           text,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Link / kartu
create table links (
  id          uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references merchants(id) on delete restrict,
  slug        text not null unique
              check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
                     and char_length(slug) between 3 and 40),
  label       text,
  target_url  text not null
              check (target_url ~* '^https://' and char_length(target_url) <= 2048),
  status      link_status not null default 'active',
  created_by  uuid references auth.users(id),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index links_merchant_id_idx on links (merchant_id);
create index links_status_idx on links (status);

-- Riwayat perubahan target
create table link_target_history (
  id             bigint generated always as identity primary key,
  link_id        uuid not null references links(id) on delete cascade,
  old_target_url text,
  new_target_url text not null,
  changed_by     uuid references auth.users(id),
  changed_at     timestamptz not null default now()
);
create index lth_link_id_idx on link_target_history (link_id, changed_at desc);

-- Event scan
create table scan_events (
  id          bigint generated always as identity primary key,
  link_id     uuid not null references links(id) on delete cascade,
  scanned_at  timestamptz not null default now(),
  source      scan_source not null default 'unknown',
  device_type text,      -- mobile | tablet | desktop | other
  os          text,      -- ios | android | other
  country     text,      -- kode ISO-2 dari header geolokasi
  is_bot      boolean not null default false
);
create index scan_events_link_time_idx on scan_events (link_id, scanned_at desc);
create index scan_events_time_idx on scan_events (scanned_at);
```

### 7.3 Catatan Implementasi

- **Trigger `updated_at`** pada `merchants` dan `links`.
- **Trigger/transaksi riwayat:** perubahan `links.target_url` otomatis menulis ke `link_target_history`.
- **Daftar slug terlarang** divalidasi di lapisan aplikasi (dan opsional lewat tabel `reserved_slugs`).
- **Fungsi RPC agregasi** (contoh `get_link_stats(p_from, p_to)`) mengembalikan total scan per link, per sumber, dan per hari dengan `is_bot = false`, sehingga dashboard tidak menarik baris mentah.
- **Hapus lunak:** link dan merchant tidak dihapus permanen jika sudah punya event; gunakan `status`/`is_active`.
- **Retensi:** job terjadwal (`pg_cron`) merangkum dan menghapus `scan_events` yang lebih tua dari 12 bulan.
- **Migrasi:** seluruh perubahan skema dikelola lewat Supabase CLI (`supabase/migrations`) dan disimpan di repositori.

## 8. MVP Milestones

Estimasi berikut diasumsikan untuk satu developer *full-stack* bekerja penuh waktu; total ±4 minggu hingga rilis produksi.

| Fase | Durasi | Cakupan | Kriteria Selesai (Exit Criteria) |
| --- | --- | --- | --- |
| **M0: Fondasi** | 2–3 hari | Inisialisasi Next.js (App Router, TypeScript), proyek Supabase (region Singapura), repositori, deploy Vercel, domain pendek + SSL, environment variables, struktur migrasi. | Aplikasi kosong live pada domain pendek; migrasi pertama berjalan. |
| **M1: Redirect Engine & Skema Inti** | 4–5 hari | Tabel `merchants`, `links`, `scan_events`, RLS; route `/r/[slug]` lengkap (302, 404, 410, no-store); seed data uji; benchmark latensi dan penentuan runtime. | Slug uji mengarah ke Google Maps; p95 < 300 ms; perubahan `target_url` langsung efektif; tes otomatis lulus. |
| **M2: Auth & Admin CRUD** | 5–6 hari | Supabase Auth, middleware, `profiles`; halaman merchant dan link (CRUD, validasi zod, aturan slug, allowlist URL, ubah status, uji tautan); riwayat perubahan. | Admin dapat onboarding merchant + link end-to-end; akun non-admin ditolak; validasi menolak URL tidak sah. |
| **M3: QR Generator** | 2–3 hari | Komponen `qrcode.react`, pratinjau, unduh PNG ≥ 1200 px dan SVG, salin URL NFC. | QR hasil unduhan berhasil dipindai pada iOS & Android dan membuka slug yang benar; uji cetak awal pada ukuran kartu nyata. |
| **M4: Analytics Tracker** | 3–4 hari | Pencatatan asinkron (`after()`), filter bot, atribut perangkat/negara, RPC agregasi, kartu ringkasan, grafik harian, split QR vs NFC. | Total scan akurat terhadap uji manual; pencatatan gagal tidak memengaruhi redirect; dashboard memuat < 2 detik. |
| **M5: Hardening & Peluncuran** | 3–4 hari | Rate limiting, header keamanan, monitoring uptime, Sentry, pencadangan, peningkatan Supabase ke paket Pro, uji beban ringan, dokumentasi, uji coba pada 2–3 merchant pilot, tes NFC (NTAG) pada berbagai ponsel. | Checklist keamanan lulus; alert aktif; pilot berjalan tanpa insiden; siap cetak batch produksi. |

**Pasca-MVP (roadmap):** portal read-only untuk merchant, peran operator, ekspor CSV, cache edge dengan invalidasi, agregat harian, pelaporan otomatis (PDF/email) per merchant, dan kemungkinan custom domain per merchant.

## 9. Risiko, Asumsi & Pertanyaan Terbuka

| Risiko / Asumsi | Dampak | Mitigasi |
| --- | --- | --- |
| Domain pendek kedaluwarsa atau hilang | Seluruh kartu fisik mati | Daftarkan atas nama agensi, auto-renew, registrasi multi-tahun, pengingat kalender |
| Supabase di-pause atau down | Redirect gagal | Paket Pro, monitoring uptime, halaman 503 informatif, evaluasi cache pada fase lanjutan |
| Format tautan review Google berubah | Tujuan tidak berfungsi | Mudah diganti di dashboard; allowlist dapat dikonfigurasi; uji tautan berkala |
| Slug dapat ditebak | Pihak lain dapat memicu scan palsu yang menggelembungkan metrik | Rate limiting, filter bot; slug yang lebih acak sebagai opsi untuk klien tertentu |
| Chip NFC ditulis dengan URL salah dan tidak dapat diubah | Kartu tidak berfungsi | Prosedur tulis standar dari string yang disalin dashboard, uji sebelum *lock*, hanya kunci setelah verifikasi |
| Kompatibilitas NFC antar-ponsel | Sebagian pelanggan gagal tap | QR tetap menjadi jalur cadangan pada setiap kartu; sertakan petunjuk “scan atau tap” pada desain |

**Pertanyaan terbuka untuk dikonfirmasi sebelum M1:**

1. Domain pendek apa yang akan dipakai, dan apakah sudah dimiliki?
2. Apakah satu merchant dengan banyak outlet memerlukan satu slug per outlet (rekomendasi: ya, satu link per kartu/outlet)?
3. Apakah laporan performa untuk merchant perlu dikirim otomatis pada fase berikutnya?
4. Apakah diperlukan halaman fallback bermerek agensi (logo, kontak) pada halaman 404/410?
