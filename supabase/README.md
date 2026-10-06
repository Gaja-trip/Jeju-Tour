# Jeju participant locations

## Release

Production: https://jeju-gaja.vercel.app/course.html?panel=participants

Supabase project: `rcsbfdnzxlihxngytwfa`. Base migration
`20261006124303_jeju_participant_live_locations.sql` is already applied;
the filename matches server history. Do not reapply it.
Participant tables, latest-location storage, RLS, RPCs and Realtime are live.
No client secret or service-role key is included in public assets.

Frontend deployed on 2026-10-06 to existing Vercel project `jeju-tour`, scope
`rokafap2-3990s-projects`, deployment `dpl_5pUYMxLSUWsnkwfMP1Yft1acyeg5`.
Production domain is unchanged. The latest V5.6 notice image was preserved.
Desktop, 390px and 320px mobile checks confirmed map tiles, the location panel and
collapse/reopen controls. Public asset and private-file exclusion checks passed.
The local source was refreshed to V5.6 during work; only location additions were
restored from the tested release. These edits have not been pushed to GitHub.

## Personal Location

The lower-right Lucide location icon toggles a separate, local-only GPS watch.
No login is required and no Supabase RPC or coordinate storage is used by it.
The user's browser location permission is still required. Turning off removes
the position and accuracy circle and cancels that watch; it does not alter the
participant-sharing consent or its separate GPS session. Closing the page stops
the personal watch. The first fix is centered in the unobstructed map area.
Mobile controls sit above the open or collapsed bottom panel, with 44px targets.
Real-device GPS reception was not tested; mocked GPS lifecycle checks passed.

## Stashed Changes Cleanup

The GitHub Desktop stash `e72c0d2d8c6819dc02a7ad9df4e235884a129f44` was compared
with current source. Existing location features and the V5.6 notice image were
identical. The missing remote-access test was restored; additional validation
cases were merged. Current deployment packaging and release notes were kept.
Supabase CLI temporary cache was excluded, not promoted to source.

After tests and backup verification the duplicate stash entry was removed.
Original contents remain recoverable from `refs/backup/stashed-changes-20261006`
and `.test-output/stashed-changes-20261006.bundle` (verified complete history).
Inspect this backup before recovering specific files; do not blindly apply it
over current changes. No source changes were committed or pushed by this task.

## Remaining Authentication Setup

The deployed frontend uses **email** authentication, matching the applied rules.
Site URL is `https://jeju-gaja.vercel.app`; the allowed callback is
`https://jeju-gaja.vercel.app/course.html?panel=participants`.
Custom SMTP is NOT configured. Supabase's default email service cannot deliver
login links to ordinary participants outside the organization.
General participant login therefore still needs SMTP or an approved alternative.
Real-phone authenticated GPS sharing has not been verified.

The name + trip passcode device-auth alternative passed isolated tests, but its
remote application was rejected by automatic review pending explicit approval.
Anonymous Sign-ins is NOT enabled and frontend device mode is NOT active.
The unapproved SQL and separate tests are in `proposals/`, outside migration history.
Do not apply the proposal or enable Anonymous Sign-ins without approval.

## Access Rules

- A verified email and the private bcrypt-hashed trip passcode grant membership.
- Only enabled same-trip participants can read positions. No direct client writes.
- RPCs derive the owner from `auth.uid()`; clients cannot write another user's GPS.
- Sharing requires consent and a user click. Only the latest position is stored.
- Stop clears coordinates and invalidates the sharing session, rejecting late writes.
- Positions older than two minutes disappear; background tracking is not guaranteed.
- Five failed passcode attempts cause a 15-minute cooldown per verified account.
- Static trip pages remain public; this feature does not password-protect all pages.

## Validation And Deployment

`npm test` covers location publishing plus existing photo API behavior.
`supabase/tests/live-location.sql` checks ownership, isolation, revocation, stale GPS,
stop races and rate limits in a rolled-back transaction. It passed on the target
database and locally. Do not run proposal-specific tests against the current server.

`node tests/location-deployment-check.mjs` checks the production screen and excludes
private files; it sends no emails or coordinates. `npm run prepare:site` creates
an ignored public-only Vercel Build Output package. Link the returned directory to
the existing project, then deploy with `--prebuilt`; never upload the entire repo.
Preserve source edits before a future Git-based deployment.

Existing Supabase `public.rls_auto_enable()` event-trigger EXECUTE warnings were
not changed. New public RPCs are SECURITY INVOKER; private tables have RLS and no
client policies by design.

References: [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security),
[Realtime](https://supabase.com/docs/guides/realtime/postgres-changes),
[Custom SMTP](https://supabase.com/docs/guides/auth/auth-smtp).
