# FINOVA AI v3.0 — Advisory Intelligence Edition
> **AI Operating System for Accounting & Financial Advisory**
> *Automate the work. Elevate the judgment.*

FINOVA AI transforms fragmented client accounting data into review-ready workpapers, deterministic Indonesian tax calculations, standards-aware evidence-linked conclusions, prioritized advisory insights, and editable client reports—while keeping professional judgment and final sign-off with licensed practitioners.

---

## Core Architecture & Engine Layers

1. **Client & Engagement Hub**: Multi-tenant firm isolation (tested across KAP Tanudiredja & KAP Siddharta), progressive engagement setup, and team assignments.
2. **Client Portal & PBC**: Isolated guest flow with secure tokens, upload checklist (`Required`, `Uploaded`, `Needs Replacement`, `Accepted`), and file replacement feedback.
3. **Smart Document Hub**: Deterministic table extraction, cell coordinate tracking, confidence scoring, and evidence drawer inspector.
4. **AI Workpaper Engine**: COA normalization to SAK Indonesia, auto-mapping with confidence scoring, ambiguous mapping review queue (`2199-00 Akun Penampungan`), manual overrides, and tie-out validation (TB vs FS vs Workpapers).
5. **Deterministic Tax Calculation Engine**:
   - **PPh 21 TER**: PP 58/2023 & PMK 168/2023 monthly brackets (Kategori A, B, C) and December annual Pasal 17 reconciliation.
   - **PPh 23**: 2% withholding on services/rentals with 100% surcharge (4%) for entities without NPWP.
   - **PPN**: Faktur Pajak Masukan vs Keluaran reconciliation (UU HPP 11%) with rate discrepancy detection.
   - **Fiscal Reconciliation**: P&L commercial profit -> positive/negative adjustments (SE-27/PJ.22/1986, PMK 66/2023, PP 131/2000) -> PKP -> Corporate Tax 22% -> Tax credits -> PPh Pasal 29 underpayment.
6. **Standards & Compliance Layer**: Verified official corpus records for PSAK 1, SPAP SA 520, SPAP SA 315, UU HPP No. 7/2021, and PMK 168/2023.
7. **Review, QC & Findings**: State machine (`Draft` -> `Needs Review` -> `Approved` -> `Locked`), inline comments, clearance notes, lock/reopen authorization, and CCCER findings format.
8. **Advanced Analytics & Advisory Intelligence**:
   - 4-Level Model: Descriptive -> Diagnostic -> Predictive -> Prescriptive.
   - Explicit claim grounding: Confirmed Fact vs Likely Driver vs Hypothesis vs Scenario.
9. **Report Composer**: Executive Advisory Memo and audit findings drafted exclusively from approved engagement data, with export/print capability.
10. **Immutable Audit Trail**: Chronological event logging with actor, role, timestamp, entity, and action.

---

## Quick Start & Local Execution

### Prerequisites
- Node.js 18+ (tested on Node v22.23.2)
- npm 10+

### Installation & Test Suite
```bash
# 1. Install dependencies
npm install

# 2. Run unit & integration test suites (18 tests)
npm test

# 3. Verify TypeScript strict types
npm run typecheck

# 4. Build production bundle
npm run build

# 5. Start production server on port 3005 (or custom port)
PORT=3005 npm start
```

### Accessing the System
- **Main Application**: [http://localhost:3005](http://localhost:3005)
- **Active Engagement (PT Nusantara Sukses Makmur FY 2025)**: [http://localhost:3005/engagements/ENG-2025-01](http://localhost:3005/engagements/ENG-2025-01)
- **Client Guest PBC Portal**: [http://localhost:3005/portal/pbc/token-nsm-tb2025-secure](http://localhost:3005/portal/pbc/token-nsm-tb2025-secure)

---

## Live Demo Personas (Role Switcher in Header)
- **Partner**: Bambang Hendrawan, SE, Ak, CA, CPA (`partner`)
- **Senior Manager**: Siti Rahmawati, M.Ak, CPA (`manager`)
- **Senior Field Auditor**: Ahmad Pratama, S.Ak (`senior`)
- **Junior Associate**: Dewi Lestari, S.Ak (`preparer`)
- **Tax Specialist**: Rizky Ramadhan, BKP (`tax_consultant`)
- **Client Guest**: Budi Hartono, Finance Director (`client_guest`)
