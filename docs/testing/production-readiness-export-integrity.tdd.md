# Production Readiness — Export Integrity & Engagement Isolation

## Source

Journeys were derived from the live FINOVA failure reproduced on 2026-09-04: a custom Cakrawala engagement generated correct on-screen totals but downloaded the seeded NSM workbook.

## User journeys

- As an audit partner, I download the exact workbook generated from the active engagement so another client's data can never appear in my file.
- As an auditor using the Mandiri workspace, I see only the active client's identity, balances, and source hash.
- As an advisory user, I receive analysis only from available workpaper data; missing comparative or manufacturing data is disclosed instead of fabricated.
- As a production operator, I require authenticated access and keep evaluator shortcuts disabled unless demo mode is explicitly enabled.

## RED → GREEN evidence

| Guarantee | Test target | RED evidence | GREEN evidence |
|---|---|---|---|
| Custom export returns its exact XLSX bytes | `tests/v4/export-download-integrity.test.ts` | `contentBase64` was undefined | Response carries the generated buffer as base64 and the browser downloads that payload |
| Unknown export cannot fall back to NSM | `tests/v4/export-download-integrity.test.ts` | unknown ID returned HTTP 200 with the first artifact | unknown ID returns HTTP 404 |
| Mandiri is not bound to SRI | `tests/v4/custom-engagement-isolation.test.ts` | seeded engagement used `CLI-002` / SRI | migrated to dedicated `CLI-MANDIRI` / `MNDR` |
| Custom workpapers contain no demo comparatives | `tests/v4/custom-engagement-isolation.test.ts` | WP-A.1 received Rp4.2B fixture comparative | comparative and variance fields remain empty unless explicitly supplied |
| Copilot stays inside active engagement context | `tests/v4/custom-engagement-isolation.test.ts` | Cakrawala query returned NSM Rp34.55B narrative | response contains only the supplied Cakrawala context |
| Production authentication fails closed | `tests/v4/production-auth-boundary.test.ts` | arbitrary keys and unauthenticated protected paths received partner access | demo keys require explicit demo mode; pages redirect to login and APIs return 401 |

## Validation

- `npm test` — 21 files, 66 tests passed.
- `npm run typecheck` — passed.
- `npm run lint` — passed with warnings and zero errors.
- `npm run build` — Next.js production build passed.

## Known operational requirements

- `AUTH_SECRET`, Supabase variables, and AI provider variables must be configured in Vercel; secrets must never be committed.
- The previously committed AI key must be rotated at its provider because removing it from the current tree does not erase Git history.
- Demo mode must remain `false` for firm/customer environments.
