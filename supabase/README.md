# Jeju participant locations

## Release

Production: https://jeju-gaja.vercel.app/course.html?panel=participants

Supabase project: `rcsbfdnzxlihxngytwfa`. Base migration
`20261006124303_jeju_participant_live_locations.sql` is already applied;
the filename matches server history. Do not reapply it.
Participant tables, latest-location storage, RLS, RPCs and Realtime are live.
No client secret or service-role key is included in public assets.

Previous frontend release on 2026-10-06 used existing Vercel project `jeju-tour`, scope
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

## Personal Invitation Release (Active)

The user requested personal invitation-link / QR authentication on 2026-10-07.
Migration `20261006204913_participant_invitations.sql` is applied and matches
remote history. Transactional invitation tests passed locally and remotely.
Public RPCs remain SECURITY INVOKER; invite hashes are private and have no client
table grants. `invitation_only` is enabled for `jeju-gaja`; the common passcode
cannot grant location access. The old `proposals/` device/passcode alternative was
not applied and must not be used for this release.

The local and production frontend use `authMode: "invite"`. Final deployment
`dpl_jeZ2dhXHHuHfhtXKiktighzEAbrh` at
https://jeju-tour-nl6lxaq1k-rokafap2-3990s-projects.vercel.app
was promoted to https://jeju-gaja.vercel.app on 2026-10-07. Desktop, 390px and
320px mobile checks passed, including scrolling and panel collapse/reopen.
The public-only release is `.test-output/site-release-STyu85`; 40 static files,
no private invitation data. Unit tests: 25 passed. Mocked email, device and
invitation DOM flows passed; no automatic account creation or GPS on QR open.

Eight private QR PNGs were generated and decoded successfully in
`.private/jeju-invites-2026-10-06T20-49-41-139Z/`. The folder's `index.html` is
the operator-only distribution sheet. Raw tokens stay in ignored private files;
only SHA256 hashes appear in its `register.sql`. All eight invitations are
registered and unclaimed at release. Expiry: 2026-10-21 05:49:19 KST.

The user approved enabling Supabase Anonymous Sign-ins, first-browser binding,
and 14-day access. Anonymous Sign-ins is enabled; existing email settings were
preserved. The eight hashes were registered once. Production public-file and
private-source exclusion checks passed. Two isolated anonymous test clients
passed concurrent single-use claims, actual Realtime delivery, own-only writes,
stop clearing GPS and old-JWT denial after connection removal. All tagged test
users/trips were removed; no real participant QR was consumed. A confirmed
Realtime readiness timing gap was fixed by waiting for the Postgres `system`
ready event rather than treating the WebSocket SUBSCRIBED signal as ready.
The frontend refreshes on ready and every 15 seconds to recover missed events.

Invitations are one-time claims bound to an authenticated browser identity, not
hardware IDs or verified legal identities. First recipient to register wins;
send one link privately to each participant, never the complete sheet. Other
devices or cleared browser data require an operator reissue. Expiry/revocation
is checked in database RLS for both the viewer and the location owner. Device
disconnect revokes membership and wipes GPS even if an old JWT remains valid.
Sharing still requires consent and a user click. The private my-location icon
remains separate. Anonymous signup abuse is rate-limited by Supabase; CAPTCHA
is recommended for future public-scale use but was not configured in this task.

Install test-only pinned packages via
`npm install --prefix .test-output/invite-tools --save-exact qrcode@1.5.4 jsqr@1.4.0 pngjs@7.0.0 @supabase/supabase-js@2.117.2`.
`scripts/create-invitations.mjs <expiry-ISO>` generates a new private pack.
`tests/invitation-live-check.mjs --prepare` creates two tagged test-only anonymous
users and prints registration SQL for a separate synthetic trip. Register that
SQL, then run `--check`; `--cleanup-sql` prints narrowly scoped cleanup SQL for
only those tagged test users and that trip. Never consume real participant QR
codes for tests. Live two-client integration passed; actual phone GPS reception
was not tested. Mocked GPS/consent/watch lifecycle tests passed.

## Current Production Authentication

The deployed frontend uses **personal invitation QR / links**, without email.
Site URL is `https://jeju-gaja.vercel.app`; the allowed callback is
`https://jeju-gaja.vercel.app/course.html?panel=participants`.
Custom SMTP is NOT configured and is not needed for personal invitations.
Existing email authentication remains available at the Supabase project level
but is not the site's participant login flow. Real-phone authenticated GPS
reception has not been verified.

The name + trip passcode device-auth alternative passed isolated tests, but its
remote application was rejected by automatic review pending explicit approval.
The old common-password frontend device mode is NOT active; personal-invite
mode is active and Anonymous Sign-ins was approved for that distinct workflow.
The unapproved SQL and separate tests are in `proposals/`, outside migration history.
Do not apply the proposal or enable Anonymous Sign-ins without approval.

## Access Rules

- A valid, unused personal invitation grants membership to the first authenticated browser.
- Only enabled same-trip participants can read positions. No direct client writes.
- RPCs derive the owner from `auth.uid()`; clients cannot write another user's GPS.
- Sharing requires consent and a user click. Only the latest position is stored.
- Stop clears coordinates and invalidates the sharing session, rejecting late writes.
- Positions older than two minutes disappear; background tracking is not guaranteed.
- Five failed invitation attempts cause a 15-minute cooldown per authenticated browser account.
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
