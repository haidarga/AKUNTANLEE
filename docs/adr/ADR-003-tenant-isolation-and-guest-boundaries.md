# ADR-003: Multi-Tenant Firm Isolation and Scoped Client Guest Boundaries

## Status
Accepted

## Context
Accounting firms (KAPs) handle confidential financial records across competing corporate clients. Data leaks across firms or unintended exposure of internal audit notes to client guests represent catastrophic compliance failures.

## Decision
1. Tenant isolation is enforced at the server and data layer using `validateTenantAccess(userFirmId, resource)`. Cross-firm access attempts throw `TenantSecurityError` and return 403 Forbidden.
2. Client Guests authenticate via scoped access tokens (`/portal/pbc/[token]`), exposing only their assigned PBC checklist and file upload controls. Internal workpapers, audit comments, and review points are completely hidden from guest views.

## Consequences
- Negative tenant access tests pass with 100% boundary verification.
- Complete privacy preservation conforming to professional auditor confidentiality standards.
