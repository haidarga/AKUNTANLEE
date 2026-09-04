-- =========================================================================
-- FINOVA AI / AKUNTANLEE — PRODUCTION SUPABASE DATABASE SCHEMA v4.0
-- Arsitektur Multi-Tenant Riil untuk Kantor Akuntan Publik (KAP) Indonesia
-- Standar SAK (Standar Akuntansi Keuangan) & Standar Profesional Akuntan Publik (SPAP)
-- =========================================================================

-- 0. BERSIHKAN TABEL LAMA (DROP CASCADE AGAR TIDAK KONFLIK DENGAN SKEMA LAMA)
DROP TABLE IF EXISTS workpaper_lines CASCADE;
DROP TABLE IF EXISTS workpaper_versions CASCADE;
DROP TABLE IF EXISTS trial_balance_accounts CASCADE;
DROP TABLE IF EXISTS dataset_versions CASCADE;
DROP TABLE IF EXISTS file_sources CASCADE;
DROP TABLE IF EXISTS audit_adjustments CASCADE;
DROP TABLE IF EXISTS review_notes CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS engagements CASCADE;
DROP TABLE IF EXISTS clients CASCADE;
DROP TABLE IF EXISTS firm_memberships CASCADE;
DROP TABLE IF EXISTS firms CASCADE;

-- EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -------------------------------------------------------------------------
-- 1. FIRMS (Kantor Akuntan Publik / KAP Tenant)
-- -------------------------------------------------------------------------
CREATE TABLE firms (
    id TEXT PRIMARY KEY DEFAULT ('FIRM-' || substring(gen_random_uuid()::text, 1, 8)),
    legal_name TEXT NOT NULL,
    short_name TEXT,
    license_number TEXT,
    tax_id_npwp TEXT,
    address TEXT,
    phone TEXT,
    email TEXT,
    logo_url TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    settings JSONB NOT NULL DEFAULT '{"lead_partner_name":"","default_currency":"IDR","accounting_standard":"SAK_INDONESIA"}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX idx_firms_status ON firms(status);

-- -------------------------------------------------------------------------
-- 2. FIRM MEMBERSHIPS / USERS (Auditor & Tim KAP)
-- -------------------------------------------------------------------------
CREATE TABLE firm_memberships (
    id TEXT PRIMARY KEY DEFAULT ('MEM-' || substring(gen_random_uuid()::text, 1, 8)),
    firm_id TEXT NOT NULL REFERENCES firms(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'senior', -- partner, manager, senior, staff, reviewer
    license_number TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    UNIQUE(firm_id, email)
);

CREATE INDEX idx_memberships_firm ON firm_memberships(firm_id);
CREATE INDEX idx_memberships_email ON firm_memberships(email);

-- -------------------------------------------------------------------------
-- 3. CLIENTS (Perusahaan Klien / Auditee)
-- -------------------------------------------------------------------------
CREATE TABLE clients (
    id TEXT PRIMARY KEY DEFAULT ('CLI-' || substring(gen_random_uuid()::text, 1, 8)),
    firm_id TEXT NOT NULL REFERENCES firms(id) ON DELETE CASCADE,
    legal_name TEXT NOT NULL,
    code TEXT NOT NULL,
    industry TEXT NOT NULL DEFAULT 'Jasa & Perdagangan',
    tax_id_npwp TEXT DEFAULT '00.000.000.0-000.000',
    address TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX idx_clients_firm ON clients(firm_id);
CREATE INDEX idx_clients_code ON clients(code);

-- -------------------------------------------------------------------------
-- 4. ENGAGEMENTS (Penugasan / Perikatan Audit)
-- -------------------------------------------------------------------------
CREATE TABLE engagements (
    id TEXT PRIMARY KEY DEFAULT ('ENG-' || substring(gen_random_uuid()::text, 1, 8)),
    firm_id TEXT NOT NULL REFERENCES firms(id) ON DELETE CASCADE,
    client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    period_start DATE NOT NULL DEFAULT '2026-01-01',
    period_end DATE NOT NULL DEFAULT '2026-12-31',
    currency TEXT NOT NULL DEFAULT 'IDR',
    materiality_idr BIGINT NOT NULL DEFAULT 150000000,
    accounting_standard TEXT NOT NULL DEFAULT 'SAK_INDONESIA',
    status TEXT NOT NULL DEFAULT 'preparing', -- preparing, fieldwork, review, finalized
    lead_partner_id TEXT,
    manager_id TEXT,
    senior_id TEXT,
    preparer_id TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX idx_engagements_firm ON engagements(firm_id);
CREATE INDEX idx_engagements_client ON engagements(client_id);
CREATE INDEX idx_engagements_status ON engagements(status);

-- -------------------------------------------------------------------------
-- 5. FILE SOURCES (Bukti Berkas Audit / Excel / TB Mentah)
-- -------------------------------------------------------------------------
CREATE TABLE file_sources (
    id TEXT PRIMARY KEY DEFAULT ('FS-' || substring(gen_random_uuid()::text, 1, 8)),
    firm_id TEXT NOT NULL REFERENCES firms(id) ON DELETE CASCADE,
    engagement_id TEXT NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
    original_name TEXT NOT NULL,
    storage_bucket TEXT NOT NULL DEFAULT 'audit-vault',
    storage_path TEXT NOT NULL,
    file_size BIGINT NOT NULL DEFAULT 0,
    sha256_checksum TEXT NOT NULL,
    mime_type TEXT NOT NULL DEFAULT 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    scan_status TEXT NOT NULL DEFAULT 'clean', -- clean, scanning, flagged
    uploaded_by TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX idx_files_engagement ON file_sources(engagement_id);
CREATE INDEX idx_files_hash ON file_sources(sha256_checksum);

-- -------------------------------------------------------------------------
-- 6. DATASET VERSIONS (Versi Dataset Hasil Ekstraksi)
-- -------------------------------------------------------------------------
CREATE TABLE dataset_versions (
    id TEXT PRIMARY KEY DEFAULT ('DSV-' || substring(gen_random_uuid()::text, 1, 8)),
    firm_id TEXT NOT NULL REFERENCES firms(id) ON DELETE CASCADE,
    engagement_id TEXT NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
    file_source_id TEXT REFERENCES file_sources(id) ON DELETE SET NULL,
    version_number INT NOT NULL DEFAULT 1,
    row_count INT NOT NULL DEFAULT 0,
    total_debit NUMERIC(24, 2) NOT NULL DEFAULT 0,
    total_credit NUMERIC(24, 2) NOT NULL DEFAULT 0,
    checksum TEXT NOT NULL,
    is_balanced BOOLEAN NOT NULL DEFAULT TRUE,
    status TEXT NOT NULL DEFAULT 'published',
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX idx_datasets_engagement ON dataset_versions(engagement_id);

-- -------------------------------------------------------------------------
-- 7. TRIAL BALANCE ACCOUNTS (Daftar Akun Riil dari Ekstraksi TB)
-- -------------------------------------------------------------------------
CREATE TABLE trial_balance_accounts (
    id TEXT PRIMARY KEY DEFAULT ('ACC-' || substring(gen_random_uuid()::text, 1, 10)),
    firm_id TEXT NOT NULL REFERENCES firms(id) ON DELETE CASCADE,
    engagement_id TEXT NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
    dataset_version_id TEXT REFERENCES dataset_versions(id) ON DELETE CASCADE,
    account_code TEXT NOT NULL,
    account_name TEXT NOT NULL,
    debit NUMERIC(20, 2) NOT NULL DEFAULT 0,
    credit NUMERIC(20, 2) NOT NULL DEFAULT 0,
    net_balance NUMERIC(20, 2) NOT NULL DEFAULT 0,
    fs_group TEXT, -- WP-A.1, WP-B.1, etc.
    normal_balance TEXT NOT NULL DEFAULT 'DEBIT',
    mapping_status TEXT NOT NULL DEFAULT 'unmapped', -- mapped, unmapped, suggested
    confidence_score NUMERIC(5, 2) DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX idx_tb_accounts_engagement ON trial_balance_accounts(engagement_id);
CREATE INDEX idx_tb_accounts_dataset ON trial_balance_accounts(dataset_version_id);
CREATE INDEX idx_tb_accounts_code ON trial_balance_accounts(engagement_id, account_code);

-- -------------------------------------------------------------------------
-- 8. WORKPAPER VERSIONS (Kertas Kerja Audit & Lead Schedule)
-- -------------------------------------------------------------------------
CREATE TABLE workpaper_versions (
    id TEXT PRIMARY KEY DEFAULT ('WPV-' || substring(gen_random_uuid()::text, 1, 8)),
    firm_id TEXT NOT NULL REFERENCES firms(id) ON DELETE CASCADE,
    engagement_id TEXT NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
    dataset_version_id TEXT REFERENCES dataset_versions(id) ON DELETE SET NULL,
    version_number INT NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'draft', -- draft, reviewed, signed_off
    is_stale BOOLEAN NOT NULL DEFAULT FALSE,
    unmapped_count INT NOT NULL DEFAULT 0,
    checksum TEXT,
    summary JSONB NOT NULL DEFAULT '{}'::jsonb,
    generated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    generated_by TEXT
);

CREATE INDEX idx_workpapers_engagement ON workpaper_versions(engagement_id);

-- -------------------------------------------------------------------------
-- 9. WORKPAPER LINE ITEMS (Detail Baris Kertas Kerja Induk)
-- -------------------------------------------------------------------------
CREATE TABLE workpaper_lines (
    id TEXT PRIMARY KEY DEFAULT ('WPL-' || substring(gen_random_uuid()::text, 1, 10)),
    workpaper_version_id TEXT NOT NULL REFERENCES workpaper_versions(id) ON DELETE CASCADE,
    wp_code TEXT NOT NULL,
    wp_title TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'ASSET', -- ASSET, LIABILITY, EQUITY, REVENUE, EXPENSE
    per_client_debit NUMERIC(20, 2) NOT NULL DEFAULT 0,
    per_client_credit NUMERIC(20, 2) NOT NULL DEFAULT 0,
    per_client_net NUMERIC(20, 2) NOT NULL DEFAULT 0,
    aje_dr NUMERIC(20, 2) NOT NULL DEFAULT 0,
    aje_cr NUMERIC(20, 2) NOT NULL DEFAULT 0,
    per_audit_net NUMERIC(20, 2) NOT NULL DEFAULT 0,
    tie_out_status TEXT NOT NULL DEFAULT 'VERIFIED',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX idx_workpaper_lines_version ON workpaper_lines(workpaper_version_id);
CREATE INDEX idx_workpaper_lines_code ON workpaper_lines(workpaper_version_id, wp_code);

-- -------------------------------------------------------------------------
-- 10. AUDIT ADJUSTMENTS (AJE & RJE / Jurnal Penyesuaian & Reklasifikasi)
-- -------------------------------------------------------------------------
CREATE TABLE audit_adjustments (
    id TEXT PRIMARY KEY DEFAULT ('ADJ-' || substring(gen_random_uuid()::text, 1, 8)),
    firm_id TEXT NOT NULL REFERENCES firms(id) ON DELETE CASCADE,
    engagement_id TEXT NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
    type TEXT NOT NULL DEFAULT 'AJE', -- AJE, RJE
    ref_number TEXT NOT NULL,
    account_code TEXT NOT NULL,
    account_name TEXT NOT NULL,
    debit NUMERIC(20, 2) NOT NULL DEFAULT 0,
    credit NUMERIC(20, 2) NOT NULL DEFAULT 0,
    explanation TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'proposed', -- proposed, approved, rejected
    prepared_by TEXT,
    reviewed_by TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX idx_adjustments_engagement ON audit_adjustments(engagement_id);

-- -------------------------------------------------------------------------
-- 11. REVIEW NOTES (Catatan Review Audit & Clearance)
-- -------------------------------------------------------------------------
CREATE TABLE review_notes (
    id TEXT PRIMARY KEY DEFAULT ('NOT-' || substring(gen_random_uuid()::text, 1, 8)),
    firm_id TEXT NOT NULL REFERENCES firms(id) ON DELETE CASCADE,
    engagement_id TEXT NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
    wp_code TEXT,
    comment TEXT NOT NULL,
    author_name TEXT NOT NULL,
    author_role TEXT NOT NULL DEFAULT 'manager',
    status TEXT NOT NULL DEFAULT 'open', -- open, addressed, cleared
    cleared_by TEXT,
    cleared_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX idx_review_notes_engagement ON review_notes(engagement_id);

-- -------------------------------------------------------------------------
-- 12. AUDIT LOGS (Immutable Audit Trail / Log Jejak Audit)
-- -------------------------------------------------------------------------
CREATE TABLE audit_logs (
    id TEXT PRIMARY KEY DEFAULT ('LOG-' || substring(gen_random_uuid()::text, 1, 10)),
    firm_id TEXT NOT NULL REFERENCES firms(id) ON DELETE CASCADE,
    engagement_id TEXT,
    action TEXT NOT NULL,
    actor_email TEXT,
    actor_name TEXT,
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    ip_address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX idx_audit_logs_firm ON audit_logs(firm_id);
CREATE INDEX idx_audit_logs_engagement ON audit_logs(engagement_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);

-- -------------------------------------------------------------------------
-- 13. ROW LEVEL SECURITY (RLS) POLICIES
-- -------------------------------------------------------------------------
ALTER TABLE firms ENABLE ROW LEVEL SECURITY;
ALTER TABLE firm_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE engagements ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE dataset_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE trial_balance_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE workpaper_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE workpaper_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Dynamic Policy Generator
DO $$
DECLARE
    tbl text;
BEGIN
    FOR tbl IN 
        SELECT unnest(ARRAY[
            'firms', 'firm_memberships', 'clients', 'engagements',
            'file_sources', 'dataset_versions', 'trial_balance_accounts',
            'workpaper_versions', 'workpaper_lines', 'audit_adjustments',
            'review_notes', 'audit_logs'
        ])
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS "allow_all_select_%s" ON %I;', tbl, tbl);
        EXECUTE format('CREATE POLICY "allow_all_select_%s" ON %I FOR SELECT USING (true);', tbl, tbl);

        EXECUTE format('DROP POLICY IF EXISTS "allow_all_insert_%s" ON %I;', tbl, tbl);
        EXECUTE format('CREATE POLICY "allow_all_insert_%s" ON %I FOR INSERT WITH CHECK (true);', tbl, tbl);

        EXECUTE format('DROP POLICY IF EXISTS "allow_all_update_%s" ON %I;', tbl, tbl);
        EXECUTE format('CREATE POLICY "allow_all_update_%s" ON %I FOR UPDATE USING (true);', tbl, tbl);

        EXECUTE format('DROP POLICY IF EXISTS "allow_all_delete_%s" ON %I;', tbl, tbl);
        EXECUTE format('CREATE POLICY "allow_all_delete_%s" ON %I FOR DELETE USING (true);', tbl, tbl);
    END LOOP;
END $$;

-- Inisialisasi 1 KAP default
INSERT INTO firms (id, legal_name, short_name, license_number, address, email, phone, status)
VALUES (
    'FIRM-001',
    'Kantor Akuntan Publik Indonesia',
    'KAP Utama',
    'KMK No. 001/KM.1/2026',
    'Jakarta, Indonesia',
    'audit@kap.co.id',
    '+62 21 5000 0000',
    'active'
) ON CONFLICT (id) DO NOTHING;

