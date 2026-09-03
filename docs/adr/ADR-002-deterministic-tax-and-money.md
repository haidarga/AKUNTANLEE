# ADR-002: Deterministic Tax Calculation and Integer Currency Precision

## Status
Accepted

## Context
In financial advisory and tax compliance, floating-point arithmetic errors (e.g. IEEE 754 precision drift) and probabilistic LLM hallucinations are catastrophic. Tax calculations must be legally defensible and reproducible across rule versions.

## Decision
1. All monetary values are represented as whole Rupiah integers (`number`/`bigint`) or fixed-precision arithmetic, completely eliminating floating-point drift.
2. The Tax Engine (`pph21-ter.ts`, `pph23.ts`, `ppn.ts`, `fiscal-reconciliation.ts`) runs purely deterministic algorithms with versioned rule IDs (`RULE-PPH21-TER-2024`, `RULE-REKON-FISKAL-UU-HPP-2022`, etc.) and effective dates.
3. AI/LLM layers generate explanatory narrative and hypotheses, but are strictly barred from calculating arithmetic values.

## Consequences
- Guaranteed mathematical reproducibility of tax liability and tie-outs.
- Full auditability conforming to Indonesian tax law (UU HPP No. 7/2021, PP 58/2023, PMK 168/2023).
