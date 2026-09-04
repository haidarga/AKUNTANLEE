# Onboarding redirect and Vercel storage — TDD evidence

## User journeys

1. As a KAP user, I can apply my onboarding profile and land in the engagement workspace.
2. As a production user on Vercel, profile persistence writes only to the writable runtime data directory.

## RED / GREEN evidence

| Guarantee | Test | RED evidence | GREEN evidence |
| --- | --- | --- | --- |
| Successful profile save persists the profile then immediately enters `/engagements`; a rejected save does neither | `tests/v4/onboarding-completion.test.ts` | Missing `completeOnboarding` module failed to import | 2 tests pass after `completeOnboarding` was added and wired to `router.replace` |
| Vercel's compatibility state mirror is inside `/tmp/finova_data` | `tests/v4/vercel-state-mirror.test.ts` | `getStateMirrorPath` was not exported | Test passes after the SQLite mirror uses `DATA_DIR` |

## Validation

- `npx vitest run tests/v4/onboarding-completion.test.ts tests/v4/vercel-state-mirror.test.ts` — 3 passed.
- `npm run typecheck` — passed.
- `npm test` — 23 test files / 70 tests passed.
- Live Chrome check: onboarding confirmation returned to the engagement directory with the configured KAP identity visible.

## Known scope

The Vercel runtime directory is writable but ephemeral between cold starts. Durable multi-tenant persistence still requires a managed database migration; this change prevents read-only filesystem failures for the current demo/evaluation workflow.
