begin;
create function pg_temp.check_invite(value boolean, message text) returns void language plpgsql as $$
begin if value is distinct from true then raise exception 'FAILED: %', message; end if; end;
$$;
insert into auth.users(id, is_anonymous) values
  ('bbbbbbbb-0000-4000-8000-000000000001', true),
  ('bbbbbbbb-0000-4000-8000-000000000002', true),
  ('bbbbbbbb-0000-4000-8000-000000000003', true),
  ('bbbbbbbb-0000-4000-8000-000000000004', true);
insert into jeju_private.trip_access(trip_id, password_hash, invitation_only)
  values('invite-test', extensions.crypt('old-code', extensions.gen_salt('bf', 4)), true),
  ('invite-other', extensions.crypt('old-code', extensions.gen_salt('bf', 4)), true);
insert into jeju_private.participant_invitations(trip_id, slot, token_hash, expires_at) values
  ('invite-test', 1, encode(extensions.digest(repeat('A', 43), 'sha256'), 'hex'), now() + interval '1 day'),
  ('invite-test', 2, encode(extensions.digest(repeat('B', 43), 'sha256'), 'hex'), now() + interval '1 day'),
  ('invite-test', 3, encode(extensions.digest(repeat('C', 43), 'sha256'), 'hex'), now() - interval '1 day'),
  ('invite-other', 1, encode(extensions.digest(repeat('D', 43), 'sha256'), 'hex'), now() + interval '1 day');

set local role anon;
select pg_temp.check_invite(not has_function_privilege('public.jeju_claim_invitation(text,text,text)', 'EXECUTE'), 'public callers cannot claim');
reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', 'bbbbbbbb-0000-4000-8000-000000000001', true);
select pg_temp.check_invite(not has_table_privilege('jeju_private.participant_invitations', 'SELECT'), 'invite hashes are private');
select pg_temp.check_invite(not has_function_privilege('jeju_private.join_with_password(text,text,text)', 'EXECUTE'), 'legacy implementation is not callable');
select pg_temp.check_invite((select count(*) = 0 from public.jeju_live_locations), 'uninvited anonymous user sees nothing');
select pg_temp.check_invite(public.jeju_join_trip('invite-test', 'Rider A', 'old-code')->>'reason' = 'invitation_required', 'common password cannot bypass personal invite');
select pg_temp.check_invite(public.jeju_claim_invitation('invite-test', repeat('D', 43), 'Rider A')->>'reason' = 'invalid_invitation', 'other-trip token rejected');
select pg_temp.check_invite((public.jeju_claim_invitation('invite-test', repeat('A', 43), 'Rider A')->>'ok')::boolean, 'first browser claims its invite');
select pg_temp.check_invite((public.jeju_claim_invitation('invite-test', repeat('A', 43), 'Rider A')->>'ok')::boolean, 'same browser retries idempotently');
select pg_temp.check_invite(public.jeju_claim_invitation('invite-test', repeat('B', 43), 'Rider A')->>'reason' = 'already_registered', 'one invite per browser');
select pg_temp.check_invite((public.jeju_invitation_status('invite-test')->>'ok')::boolean, 'valid membership status');
select set_config('invite_test.share_a', public.jeju_start_sharing('invite-test')::text, true);
select pg_temp.check_invite(public.jeju_publish_location('invite-test', current_setting('invite_test.share_a')::uuid, 33.5, 126.5, 10, now()), 'invited owner publishes');

select set_config('request.jwt.claim.sub', 'bbbbbbbb-0000-4000-8000-000000000002', true);
select pg_temp.check_invite(public.jeju_claim_invitation('invite-test', repeat('A', 43), 'Rider B')->>'reason' = 'already_used', 'second browser cannot steal used QR');
select pg_temp.check_invite(public.jeju_claim_invitation('invite-test', repeat('C', 43), 'Rider B')->>'reason' = 'expired', 'expired invite rejected');
select pg_temp.check_invite(public.jeju_claim_invitation('invite-test', repeat('B', 43), 'Rider A')->>'reason' = 'name_taken', 'duplicate name does not consume QR');
select pg_temp.check_invite((public.jeju_claim_invitation('invite-test', repeat('B', 43), 'Rider B')->>'ok')::boolean, 'second personal invite works');
select pg_temp.check_invite((select count(*) = 1 from public.jeju_live_locations where trip_id = 'invite-test'), 'invited participant reads same-trip location');
select pg_temp.check_invite(not public.jeju_publish_location('invite-test', current_setting('invite_test.share_a')::uuid, 34, 127, 10, now()), 'cannot overwrite another person');

reset role;
update jeju_private.participant_invitations set expires_at = now() - interval '1 second' where trip_id = 'invite-test' and slot = 1;
set local role authenticated;
select pg_temp.check_invite((select count(*) = 0 from public.jeju_live_locations where trip_id = 'invite-test'), 'expired participant hidden from other members');
select set_config('request.jwt.claim.sub', 'bbbbbbbb-0000-4000-8000-000000000001', true);
select pg_temp.check_invite((select count(*) = 0 from public.jeju_live_locations), 'expired viewer has no GPS access');
do $$ begin
  perform public.jeju_start_sharing('invite-test'); raise exception 'Expired user shared';
exception when insufficient_privilege then null; end $$;
reset role;
update jeju_private.participant_invitations set expires_at = now() + interval '1 day' where trip_id = 'invite-test' and slot = 1;
set local role authenticated;
select public.jeju_leave_trip('invite-test');
select pg_temp.check_invite((select count(*) = 0 from public.jeju_live_locations), 'old JWT loses access after connection removal');
select pg_temp.check_invite(public.jeju_claim_invitation('invite-test', repeat('A', 43), 'Rider A')->>'reason' = 'revoked', 'disconnect permanently revokes link');
reset role;
select pg_temp.check_invite((select latitude is null and not sharing from public.jeju_live_locations where trip_id = 'invite-test' and user_id = 'bbbbbbbb-0000-4000-8000-000000000001'), 'disconnect wipes last position');
insert into jeju_private.participant_invitations(trip_id, slot, token_hash, expires_at)
  values('invite-test', 1, encode(extensions.digest(repeat('E', 43), 'sha256'), 'hex'), now() + interval '1 day');
set local role authenticated;
select set_config('request.jwt.claim.sub', 'bbbbbbbb-0000-4000-8000-000000000003', true);
select pg_temp.check_invite((public.jeju_claim_invitation('invite-test', repeat('E', 43), 'Rider A')->>'ok')::boolean, 'operator reissue permits new browser and reused name');
select set_config('request.jwt.claim.sub', 'bbbbbbbb-0000-4000-8000-000000000004', true);
do $$ begin for i in 1..5 loop perform public.jeju_claim_invitation('invite-test', repeat('Z', 43), 'Rider D'); end loop; end $$;
select pg_temp.check_invite(public.jeju_claim_invitation('invite-other', repeat('D', 43), 'Rider D')->>'reason' = 'rate_limited', 'five failed attempts lock for 15 minutes');
reset role;
update jeju_private.join_attempts set retry_at = now() - interval '1 second' where user_id = 'bbbbbbbb-0000-4000-8000-000000000004';
set local role authenticated;
select pg_temp.check_invite((public.jeju_claim_invitation('invite-other', repeat('D', 43), 'Rider D')->>'ok')::boolean, 'cooldown expiry restores invite claim');
select pg_temp.check_invite((select count(*) = 0 from public.jeju_live_locations where trip_id = 'invite-test'), 'separate trip stays private');
reset role;
rollback;
