# Member access recovery — October 16, 2026

## Incident and evidence

An existing contributor reported the account-unavailable screen after resetting a password. Access later recovered. Read-only production checks established that the account was active and retained moderator and scorekeeper roles. The deployed source matched main at ba9dd1e67067d9f602d2bdc8bb8d0aa70fcbbacb.

During 09:00–09:40 America/Chicago, all 260 recorded REST requests returned HTTP 200. The password update succeeded at 09:30:12, password sign-ins succeeded at 09:30:29 and 09:33:35, and recorded status reads succeeded. A repeated recovery-email request was rate limited earlier; that does not explain the account-status screen. Existing application logs did not record the failed status check. A local timeout or transport failure remains possible, not proven. No credentials, tokens, IP addresses, or member identifiers are retained in this report.

## Candidate

- Preserve the three-second status-read budget, one request per check, existing suspension policy, and fail-closed authorization.
- Log a fixed event, fixed failure category, and elapsed milliseconds for failed status reads. Never log provider text, URLs, user IDs, request bodies, email addresses or tokens. Session-check failure uses a fixed category.
- Replace the prefetchable account link with an explicit POST action that authenticates the current caller and performs one fresh status read. It cannot accept a target identity or prior mutation payload.
- Disable the button and show checking feedback while the POST is pending. A repeated failure returns clear feedback and a contact address; success navigates to the account page after invalidation. No automatic retry, score submission, password update, or Pick ’Em write is performed by this action.
- Password-reset implementation, database schema, production configuration and roles are unchanged.

## Verification

- Eight focused tests pass: one-attempt failure and recovery, active access, suspension and missing rows, network error, diagnostic redaction, three-second timeout, recovery action authentication/authorization, and mocked password update followed by interrupted access and recovery.
- The recovery-action tests execute the real actions with mocked Next.js boundaries and Supabase client. They do not establish a live email/CAPTCHA/authentication end-to-end result.
- Typecheck, targeted ESLint and diff whitespace checks pass.
- Optimized webpack build and 67 prebuild tests pass using a synthetic local Supabase URL/key, with no production data dependency. Existing social-image width/height warnings are unrelated.
- Browser fixture added for the real button at 390px and 1280px: keyboard activation, pending/disabled state, manual retry and no automatic checks. Execution blocked because Chromium is absent and its download fails with invalid ZIP responses. This fixture uses a simulated check endpoint and is not a live Server Action verification.
- Review checked server authorization, session preservation, absence of mutation replay, fixed log fields, client boundary size, native form behavior and pending-state accessibility. No independent agent review was performed.

## Release status

Not released. No production migrations or configuration changes are required. Browser verification and an isolated authenticated preview remain outstanding. This improves recovery and diagnosis; it does not establish or eliminate the original transient cause.

Commands:

```sh
node --experimental-test-module-mocks --import tsx --test lib/member-recovery-action.test.mts lib/member-status.test.ts
npx tsc --noEmit
npx eslint lib/member-status.ts lib/member-status.test.ts lib/member-recovery-action.test.mts app/account-unavailable scripts/test-member-access-browser.mjs
node scripts/test-member-access-browser.mjs
```
