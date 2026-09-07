# Canonical workpaper hydration — TDD report

## Risk addressed

After a financial source file was uploaded successfully, server-rendered pages and
client-side pages could calculate separate transient workpaper versions. The result
was inconsistent balances, evidence IDs, and export eligibility after navigation.

## RED

`tests/v4/dynamic-client-e2e.test.ts` now creates an arbitrary client, imports a
16-account trial balance, then requires `GET /api/v1/engagements/:id/files` to
match the canonical server calculation for totals, lines, and validation checks.
The test failed before the fix because the route independently recalculated a
different transient workpaper payload.

## GREEN

The files endpoint now returns `getEngagementServerData()` directly with a
no-store response. Workpaper identities are derived from engagement, dataset,
mapping, and normalized account inputs rather than the current time. Therefore a
refresh preserves the same evidence-link identity until financial inputs change.

The KAP profile API also writes through to Supabase/Postgres when configured and
returns a failure instead of claiming success from Vercel's temporary filesystem.
This closes the production onboarding path that previously depended on SQLite.

## Verification

- `npm test -- --run tests/v4/dynamic-client-e2e.test.ts` — pass
- `npm test -- --run tests/v4/sqlite.test.ts` — pass in isolation
- `npm run typecheck` — pass
- `npm run build` — pass

The full parallel test run currently has one pre-existing shared-SQLite test
isolation failure (`sqlite.test.ts` sees zero of its 50 records when other suites
overwrite the single application-state row). It passes in isolation; this change
does not alter the SQLite persistence code.
