-- =========================================================================
-- AKUNTANLEE / FINOVA AI - PRODUCTION SUPABASE DATABASE SCHEMA
-- Standar SAK Indonesia & Sistem Manajemen Audit KAP
-- =========================================================================

-- Enable UUID extension if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -------------------------------------------------------------------------
-- 1. CLIENTS (Klien / Perusahaan Auditee)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS clients (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL DEFAULT 'TENANT-001',
    legal_name TEXT NOT NULL,
    code TEXT NOT NULL,
    industry TEXT NOT NULL DEFAULT 'Manufaktur & Fabrikasi',
    tax_id_npwp TEXT DEFAULT '01.234.567.8-012.000',
    address TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_clients_tenant ON clients(tenant_id);
CREATE INDEX IF NOT EXISTS idx_clients_code ON clients(code);

-- -------------------------------------------------------------------------
-- 2. ENGAGEMENTS (Penugasan / Perikatan Audit)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS engagements (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL DEFAULT 'TENANT-001',
    client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    period_start DATE NOT NULL DEFAULT '2026-01-01',
    period_end DATE NOT NULL DEFAULT '2026-12-31',
    currency TEXT NOT NULL DEFAULT 'IDR',
    materiality_idr BIGINT NOT NULL DEFAULT 250000000,
    accounting_standard TEXT NOT NULL DEFAULT 'SAK_INDONESIA',
    status TEXT NOT NULL DEFAULT 'preparing',
    lead_partner_id TEXT DEFAULT 'USR-PARTNER-01',
    manager_id TEXT DEFAULT 'USR-MANAGER-01',
    senior_id TEXT DEFAULT 'USR-SENIOR-01',
    preparer_id TEXT DEFAULT 'USR-PREPARER-01',
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_engagements_tenant ON engagements(tenant_id);
CREATE INDEX IF NOT EXISTS idx_engagements_client ON engagements(client_id);
CREATE INDEX IF NOT EXISTS idx_engagements_status ON engagements(status);

-- -------------------------------------------------------------------------
-- 3. WORKPAPER VERSIONS (Versi Kertas Kerja & Lead Schedule)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS workpaper_versions (
    id TEXT PRIMARY KEY,
    engagement_id TEXT NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
    dataset_version_id TEXT,
    mapping_set_id TEXT,
    version_number INT NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'draft',
    is_stale BOOLEAN NOT NULL DEFAULT FALSE,
    unmapped_count INT NOT NULL DEFAULT 0,
    checksum TEXT DEFAULT 'sha256:0000000000000000000000000000000000000000000000000000000000000000',
    summary JSONB DEFAULT '{}'::jsonb,
    generated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    generated_by TEXT DEFAULT 'USR-PARTNER-01'
);

CREATE INDEX IF NOT EXISTS idx_wp_versions_engagement ON workpaper_versions(engagement_id);

-- -------------------------------------------------------------------------
-- 4. TRIAL BALANCE ACCOUNTS (Daftar Akun Hasil Ekstraksi Excel/TB)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS trial_balance_accounts (
    id TEXT PRIMARY KEY,
    engagement_id TEXT NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
    account_code TEXT NOT NULL,
    account_name TEXT NOT NULL,
    debit NUMERIC(20, 2) NOT NULL DEFAULT 0,
    credit NUMERIC(20, 2) NOT NULL DEFAULT 0,
    net_balance NUMERIC(20, 2) NOT NULL DEFAULT 0,
    fs_group TEXT,
    mapping_status TEXT NOT NULL DEFAULT 'mapped',
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_tb_accounts_engagement ON trial_balance_accounts(engagement_id);

-- -------------------------------------------------------------------------
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- -------------------------------------------------------------------------
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE engagements ENABLE ROW LEVEL SECURITY;
ALTER TABLE workpaper_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE trial_balance_accounts ENABLE ROW LEVEL SECURITY;

-- Allow public / anon and authenticated read & write
CREATE POLICY "Allow public read on clients" ON clients FOR SELECT USING (true);
CREATE POLICY "Allow public insert on clients" ON clients FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on clients" ON clients FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on clients" ON clients FOR DELETE USING (true);

CREATE POLICY "Allow public read on engagements" ON engagements FOR SELECT USING (true);
CREATE POLICY "Allow public insert on engagements" ON engagements FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on engagements" ON engagements FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on engagements" ON engagements FOR DELETE USING (true);

CREATE POLICY "Allow public read on workpaper_versions" ON workpaper_versions FOR SELECT USING (true);
CREATE POLICY "Allow public insert on workpaper_versions" ON workpaper_versions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on workpaper_versions" ON workpaper_versions FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on workpaper_versions" ON workpaper_versions FOR DELETE USING (true);

CREATE POLICY "Allow public read on trial_balance_accounts" ON trial_balance_accounts FOR SELECT USING (true);
CREATE POLICY "Allow public insert on trial_balance_accounts" ON trial_balance_accounts FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on trial_balance_accounts" ON trial_balance_accounts FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on trial_balance_accounts" ON trial_balance_accounts FOR DELETE USING (true);

-- -------------------------------------------------------------------------
-- 6. DEFAULT SEED DATA
-- -------------------------------------------------------------------------
INSERT INTO clients (id, tenant_id, legal_name, code, industry, tax_id_npwp, status)
VALUES
  ('CLI-001', 'TENANT-001', 'PT Nusantara Sukses Makmur', 'NSM', 'Manufaktur & Fabrikasi', '01.234.567.8-012.000', 'active'),
  ('CLI-002', 'TENANT-001', 'PT Klien Mandiri (Klien Anda)', 'MNDR', 'Jasa & Perdagangan', '02.345.678.9-013.000', 'active')
ON CONFLICT (id) DO UPDATE SET
  legal_name = EXCLUDED.legal_name,
  code = EXCLUDED.code,
  tax_id_npwp = EXCLUDED.tax_id_npwp;

INSERT INTO engagements (id, tenant_id, client_id, name, period_start, period_end, currency, materiality_idr, accounting_standard, status)
VALUES
  ('ENG-2026-01', 'TENANT-001', 'CLI-001', 'Audit Laporan Keuangan Tahunan FY 2026', '2026-01-01', '2026-12-31', 'IDR', 500000000, 'SAK_INDONESIA', 'fieldwork'),
  ('ENG-MANDIRI-2026', 'TENANT-001', 'CLI-002', 'Kertas Kerja Audit Mandiri FY 2026', '2026-01-01', '2026-12-31', 'IDR', 250000000, 'SAK_INDONESIA', 'preparing')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  materiality_idr = EXCLUDED.materiality_idr;
