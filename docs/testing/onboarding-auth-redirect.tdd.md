# Onboarding authentication redirect — TDD evidence

## User journey

An unauthenticated firm administrator completes the onboarding wizard. The
profile draft is retained locally, the user is redirected to login, and no
protected firm profile is written until the user has a valid session.

## RED → GREEN evidence

| Stage | Command | Result |
| --- | --- | --- |
| RED | `npm test -- --run tests/v4/onboarding-completion.test.ts` | New 401 test failed because `OnboardingAuthenticationRequiredError` did not exist. |
| GREEN | `npm test -- --run tests/v4/onboarding-completion.test.ts` | 3/3 tests passed. |
| Type safety | `npm run typecheck` | Passed. |
| Production build | `npm run build` | Passed. |

## Guarantees

| # | Guarantee | Test |
| --- | --- | --- |
| 1 | A successful protected profile save persists the returned profile and enters the workspace. | `onboarding-completion.test.ts` successful-save case |
| 2 | A rejected save never persists data or navigates to the workspace. | `onboarding-completion.test.ts` rejected-save case |
| 3 | A 401 onboarding save is classified as an authentication requirement, not a network failure. | `onboarding-completion.test.ts` unauthenticated-save case |

## Known scope

The browser follows the login redirect after the client stores the draft; the
authenticated save remains protected by the existing API middleware.
