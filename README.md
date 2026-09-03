# FINOVA AI v4.0 (AKUNTANLEE)
> **Sistem Operasi Kertas Kerja Finansial & Atestasi Audit Berstandar Akuntansi Indonesia (SAK)**  
> *Deterministic Accounting Engine • Hybrid Semantic AI • Institutional KAP Standards*

[![Tests](https://img.shields.io/badge/tests-19%20passed-0F8F7A.svg)](tests/v4)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict%20Zero--Error-102A32.svg)](tsconfig.json)
[![Next.js](https://img.shields.io/badge/Next.js-16.3-black.svg)](package.json)
[![SAK](https://img.shields.io/badge/Standards-SAK%20%2F%20PSAK%2010-0F8F7A.svg)](#)

---

## 🏛️ Gambaran Umum (Overview)

**FINOVA AI v4.0 (AKUNTANLEE)** adalah platform otomasi kertas kerja audit (*audit workpaper operating system*) yang dirancang khusus untuk Kantor Akuntan Publik (KAP) di Indonesia (**KAP Tanudiredja, Wibisana, Rintis & Rekan**). 

Platform ini mengeliminasi kesalahan manusiawi di Excel, menjamin nol halusinasi angka melalui pemisahan tegas antara **Semantic AI** dan **Deterministic Math Engine**, serta menyediakan jejak audit berpenanda tangan kriptografis SHA-256 yang siap diinspeksi oleh regulator (IAPI & OJK).

---

## ⚡ Fitur Utama (Core Highlights)

1. **Spreadsheet Audit Interaktif (`AuditSpreadsheet`)**:
   - Navigasi sel keyboard penuh (`↑↓←→`, `Tab`, `Enter`).
   - Indikator koordinat aktif dan baris formula real-time: `[SEL WP-A.1] fx =SUM(TB!WP-A.1_Accounts)`.
   - Ring fokus hijau sage (`#0F8F7A`) dan drawer jejak bukti (*Evidence Lineage*) yang terbuka via klik ganda.

2. **Jembatan Laba Bersih Visual (`FinancialWaterfallChart`)**:
   - Diagram dekomposisi interaktif berbasis SVG:  
     `Pendapatan Usaha (Rp 52,4M)` $\rightarrow$ `HPP (-Rp 35,95M)` $\rightarrow$ `Laba Kotor (Rp 16,45M)` $\rightarrow$ `OPEX (-Rp 12,2M)` $\rightarrow$ `Laba Bersih (Rp 4,25M)`.
   - Tie-out 100% tervalidasi masuk ke Ekuitas Kertas Kerja (*WP-E.2 Saldo Laba Ditahan*).

3. **FINOVA AI Semantic Reasoning Inspector**:
   - Model AI pemahaman semantik untuk membedah akun ambigu (seperti `2199-00 Akun Penampungan Selisih Kurs Sementara`).
   - Rujukan kepatuhan standar akuntansi **PSAK 10 / SAK Entitas Privat** dengan tombol 1-click rekomendasi reklasifikasi ke pos Laba Rugi (`WP-F.4`).

4. **Mesin Unggah Berkas Nyata (SheetJS & Web Crypto API)**:
   - Mampu membaca biner spreadsheet `.xlsx` / `.csv` nyata di browser tanpa mengeksekusi makro (*Macro Guard*).
   - Menghitung hash SHA-256 unik saat berkas tiba untuk menjamin integritas bukti audit (*Immutable Source Vault*).

5. **Kalkulasi Deterministik (Zero-Float Guarantee)**:
   - Seluruh kalkulasi Rupiah dihitung menggunakan integer murni tanpa pembulatan mengambang (*Zero Floating-Point Error*).
   - Selisih neraca Rp 0: $\text{Aset } (\text{Rp } 34,55\text{M}) = \text{Liabilitas } (\text{Rp } 12,36\text{M}) + \text{Ekuitas } (\text{Rp } 22,19\text{M})$.

6. **Pusat Ekspor XLSX Resmi Berpenanda Tangan Digital**:
   - Memproduksi workbook resmi multi-sheet:
     - **Sheet 1 (`Lead Schedule`)**: Kertas Kerja Induk Neraca & Laba Rugi komparatif berformula baku.
     - **Sheet 2 (`Manifest`)**: Tanda tangan digital Audit Partner, timestamp, dan hash SHA-256.
   - Dilindungi gerbang kelayakan pra-ekspor (*Pre-Flight Eligibility Gate*) dan verifikasi baca ulang kriptografi (*read-back verification*).

---

## 🛠️ Panduan Menjalankan Sistem (Quickstart)

### Prasyarat:
- Node.js v18+ atau v20+
- npm / yarn / pnpm

### Langkah Instalasi:

```bash
# 1. Clone repositori
git clone https://github.com/haidarga/AKUNTANLEE.git
cd AKUNTANLEE

# 2. Instal dependensi
npm install

# 3. Jalankan automated test suite (19 tests)
npm test

# 4. Jalankan typecheck TypeScript
npm run typecheck

# 5. Jalankan server pengembangan
npm run dev -p 3008
```

Akses aplikasi di browser pada: **`http://localhost:3008`**

---

## 👥 Matriks Peran Pengguna (RBAC Persona)

| Persona | Nama | Jabatan | Otoritas Kunci |
|---|---|---|---|
| **Audit Partner** | Bambang Hendrawan, CPA | Signing Partner | Otoritas finalisasi, ekspor resmi XLSX, pembukaan perikatan. |
| **Engagement Manager** | Siti Rahmawati, CA | Manager | Review kertas kerja, persetujuan massal, kelola memori kantor. |
| **Senior In-Charge** | Ahmad Pratama, S.Ak | Field Senior | Eksekusi normalisasi impor, override pemetaan, rekalkulasi kertas kerja. |
| **Preparer** | Budi Santoso, S.Ak | Junior Associate | Unggah berkas sumber, verifikasi baris TB, dokumentasi catatan kerja. |

---

## 📂 Struktur Repositori

```
├── src/
│   ├── app/
│   │   ├── admin/mappings/         # Memori Pemetaan Kantor Terpusat
│   │   ├── api/v1/                 # Endpoints REST API (Engagements, Workpapers, Exports)
│   │   ├── engagements/
│   │   │   ├── [id]/
│   │   │   │   ├── overview/       # Ringkasan Perikatan & Neraca Seimbang
│   │   │   │   ├── files/          # Ingestion Berkas & Brankas SHA-256
│   │   │   │   ├── imports/        # Konfigurasi Normalisasi Skema Impor
│   │   │   │   ├── mapping/        # Ruang Kerja Pemetaan Akun SAK & AI Inspector
│   │   │   │   ├── workpaper/      # Kertas Kerja Induk & Spreadsheet Interaktif
│   │   │   │   └── exports/        # Pusat Ekspor XLSX Resmi
│   │   │   └── new/                # Inisiasi Perikatan Baru
│   │   ├── login/                  # Persona Switcher Internal KAP
│   │   └── page.tsx                # Daftar Perikatan Aktif
│   ├── components/v4/
│   │   ├── spreadsheet/            # AuditSpreadsheet (Formula bar, keyboard nav)
│   │   ├── visuals/                # FinancialWaterfallChart, IsometricWorkbookPreview
│   │   └── EvidenceDrawerV4.tsx    # Laci Jejak Bukti Sumber
│   ├── lib/
│   │   ├── db/repo-v4.ts           # State Repository dengan Persistensi Disk Atomik
│   │   ├── decimal.ts              # Mesin Aritmatika Integer Rupiah (Zero Float)
│   │   ├── importer/               # Parser Skema Trial Balance
│   │   ├── exporter/               # Generator Workbook XLSX Berlisensi Resmi
│   │   └── workpaper/engine.ts     # Mesin Agregasi Kertas Kerja Induk SAK
│   └── types/domain-v4.ts          # Kontrak Tipe Data Domain Release 0.1
├── tests/v4/                       # 19 Unit & Integration Tests (Vitest)
└── data/                           # Seed Persistensi State Kertas Kerja
```

---

## ⚖️ Lisensi & Kepatuhan
Dikembangkan untuk kepatuhan standar atestasi perikatan akuntan publik di Indonesia (Standar Profesional Akuntan Publik - SPAP, IAPI, SAK & SAK EP).
