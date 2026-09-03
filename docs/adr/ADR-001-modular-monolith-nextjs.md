# ADR-001: Modular Monolith Architecture using Next.js & TypeScript

## Status
Accepted

## Context
FINOVA AI v3.0 requires an Indonesia-first operating system for accounting and financial advisory, integrating client intake, document extraction, workpaper preparation, deterministic tax calculations, review workflows, advanced analytics, and reporting. We evaluated a split FastAPI + Next.js microservices setup vs. a modular monolith in Next.js (App Router) + TypeScript.

## Decision
We implemented a production-oriented modular monolith in Next.js (App Router) with TypeScript. All domain packages (`@finova/tax-engine`, `@finova/workpaper-engine`, `@finova/standards-corpus`, `@finova/security`) reside within `src/lib/` as decoupled modules with strict interfaces and zero circular dependencies.

## Consequences
- Single codebase with end-to-end type safety between database, business logic, API routes, and UI components.
- Zero CORS overhead and instant local development via standard `npm run dev` or `npm run build && npm start`.
- Easy migration to distributed services or dedicated Python workers if asynchronous document OCR pipelines require high-throughput GPU scaling in the future.
