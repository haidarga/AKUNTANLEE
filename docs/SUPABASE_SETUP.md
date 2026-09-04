# Panduan Setup Supabase Database Produksi - Akuntanlee (Finova AI v4.0)

Aplikasi **Akuntanlee** telah sepenuhnya terintegrasi dengan **Supabase** untuk persistensi cloud multi-instance (serverless Vercel) dan memiliki arsitektur *fail-safe hybrid* (Supabase Cloud + Universal Cookie Sync + LocalStorage) sehingga aplikasi tetap dapat berjalan secara mulus tanpa downtime atau 404 error.

---

## 1. Menjalankan Skema Database di Supabase
1. Buka dashboard proyek Anda di [https://supabase.com](https://supabase.com).
2. Masuk ke menu **SQL Editor** pada navigasi sebelah kiri.
3. Buka berkas [`supabase/schema.sql`](../supabase/schema.sql) pada repository ini, salin seluruh isinya, lalu tempelkan ke SQL Editor Supabase.
4. Klik tombol **Run** (Jalankan).
   - Skema ini membuat tabel: `clients`, `engagements`, `workpaper_versions`, dan `trial_balance_accounts`.
   - Mengaktifkan Row Level Security (RLS) dengan kebijakan akses baca/tulis yang aman.
   - Mengisi data awal (seed) resmi `PT Nusantara Sukses Makmur` (`ENG-2026-01`) dan `PT Klien Mandiri` (`ENG-MANDIRI-2026`).

---

## 2. Menghubungkan Environment Variable ke Vercel
1. Buka dashboard Vercel Anda di [https://vercel.com](https://vercel.com) dan pilih proyek **AKUNTANLEE**.
2. Masuk ke **Settings** &rarr; **Environment Variables**.
3. Tambahkan variabel berikut:
   - `NEXT_PUBLIC_SUPABASE_URL`: URL proyek Supabase Anda (contoh: `https://xyzcompany.supabase.co`)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Kunci anon/public dari Supabase (Settings &rarr; API)
   - `SUPABASE_SERVICE_ROLE_KEY`: Kunci service_role dari Supabase (Settings &rarr; API)
4. Simpan (*Save*).

---

## 3. Fitur Keandalan Produksi (Production Reliability)
- **Zero-404 Fallback**: Endpoint `GET /api/v1/engagements/[id]` dan layout server Next.js dirancang deterministik. Jika ada perikatan baru yang dibuat pengguna, sistem menjamin detail perikatan dan nama PT langsung terbaca tanpa 404.
- **Dynamic File Ingestion & Lead Schedule**: Setiap file Excel neraca saldo yang diunggah otomatis diekstraksi hash SHA-256-nya, diklasifikasikan ke kode kertas kerja SAK (`WP-A.1`, `WP-B.1`, dst.), dan langsung menghitung ulang total saldo pada Lead Schedule secara dinamis.
- **Live Edit Modal**: Setiap perikatan memiliki modal *inline editing* di header untuk mengganti nama PT, kode emiten, NPWP, standar akuntansi, dan ambang materialitas audit secara instan.
