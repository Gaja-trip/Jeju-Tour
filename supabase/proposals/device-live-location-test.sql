-- Requires the unapproved participant_device_auth proposal; use only in isolated tests.
begin;

create function pg_temp.check_true(value boolean, message text)
returns void language plpgsql as $$
begin
  if value is distinct from true then raise exception 'FAILED: %', message; end if;
end;
$$;

insert into auth.users(id, email, email_confirmed_at) values
  ('aaaaaaaa-0000-4000-8000-000000000001', 'location-a@example.test', now()),
  ('aaaaaaaa-0000-4000-8000-000000000002', 'location-b@example.test', now()),
  ('aaaaaaaa-0000-4000-8000-000000000003', 'location-c@example.test', null);
insert into auth.users(id, is_anonymous) values ('aaaaaaaa-0000-4000-8000-000000000004', true);
insert into jeju_private.trip_access(trip_id, password_hash) values
  ('location-test', extensions.crypt('test-passcode', extensions.gen_salt('bf', 4))),
  ('location-other', extensions.crypt('other-passcode', extensions.gen_salt('bf', 4)));
insert into public.jeju_participants(trip_id, user_id, display_name)
  values ('location-other', 'aaaaaaaa-0000-4000-8000-000000000002', 'Other trip');
insert into public.jeju_live_locations(trip_id, user_id, sharing, share_id, latitude, longitude, accuracy, recorded_at)
  values ('location-other', 'aaaaaaaa-0000-4000-8000-000000000002', true, gen_random_uuid(), 33, 126, 10, now());

set local role anon;
select pg_temp.check_true(not has_table_privilege('public.jeju_live_locations', 'SELECT'), 'anonymous location read denied');
select pg_temp.check_true(not has_function_privilege('public.jeju_join_trip(text,text,text)', 'EXECUTE'), 'anonymous join denied');
reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', 'aaaaaaaa-0000-4000-8000-000000000001', true);
select pg_temp.check_true((select count(*) = 0 from public.jeju_live_locations), 'non-member sees no locations');
select pg_temp.check_true(not has_table_privilege('public.jeju_participants', 'INSERT'), 'direct self-enrollment denied');
select pg_temp.check_true(not has_table_privilege('public.jeju_live_locations', 'UPDATE'), 'direct location mutation denied');
select pg_temp.check_true((public.jeju_join_trip('location-test', 'Rider A', 'wrong')->>'ok')::boolean = false, 'wrong passcode rejected');
select pg_temp.check_true((public.jeju_join_trip('location-test', 'Rider A', 'test-passcode')->>'ok')::boolean, 'verified participant can join');
select set_config('jeju_test.share_a', public.jeju_start_sharing('location-test')::text, true);
select pg_temp.check_true(public.jeju_publish_location('location-test', current_setting('jeju_test.share_a')::uuid, 33.5, 126.5, 10, now()), 'owner can publish');
select pg_temp.check_true((select count(*) = 1 from public.jeju_live_locations), 'another trip is isolated');

do $$ begin
  perform public.jeju_publish_location('location-test', current_setting('jeju_test.share_a')::uuid, 100, 126.5, 10, now());
  raise exception 'Invalid latitude accepted';
exception when sqlstate '22023' then null;
end $$;
do $$ begin
  perform public.jeju_publish_location('location-test', current_setting('jeju_test.share_a')::uuid, 33.5, 126.5, 10, now() - interval '3 minutes');
  raise exception 'Stale GPS accepted';
exception when sqlstate '22023' then null;
end $$;

select set_config('request.jwt.claim.sub', 'aaaaaaaa-0000-4000-8000-000000000002', true);
select pg_temp.check_true((select count(*) = 0 from public.jeju_live_locations where trip_id = 'location-test'), 'other-trip member cannot read this trip');
do $$ begin
  perform public.jeju_start_sharing('location-test');
  raise exception 'Non-member started sharing';
exception when insufficient_privilege then null;
end $$;
do $$ begin
  for i in 1..5 loop
    perform public.jeju_join_trip('location-test', 'Rider B', 'wrong');
  end loop;
end $$;
select pg_temp.check_true(public.jeju_join_trip('location-test', 'Rider B', 'test-passcode')->>'reason' = 'rate_limited', 'five failed attempts persist and rate limit');
reset role;
update jeju_private.join_attempts set retry_at = now() - interval '1 second';
set local role authenticated;
select pg_temp.check_true((public.jeju_join_trip('location-test', 'Rider A', 'test-passcode')->>'ok')::boolean, 'display names do not replace user identity');
select pg_temp.check_true((public.jeju_join_trip('location-test', 'Rider B', 'test-passcode')->>'ok')::boolean, 'second verified participant joins');
select set_config('jeju_test.share_b', public.jeju_start_sharing('location-test')::text, true);
select pg_temp.check_true(not public.jeju_publish_location('location-test', current_setting('jeju_test.share_a')::uuid, 34, 127, 10, now()), 'cannot use another participant sharing session');
select pg_temp.check_true((select latitude = 33.5 from public.jeju_live_locations where trip_id = 'location-test' and user_id = 'aaaaaaaa-0000-4000-8000-000000000001'), 'other participant position unchanged');

select set_config('request.jwt.claim.sub', 'aaaaaaaa-0000-4000-8000-000000000001', true);
select public.jeju_stop_sharing('location-test', current_setting('jeju_test.share_a')::uuid);
select pg_temp.check_true(not public.jeju_publish_location('location-test', current_setting('jeju_test.share_a')::uuid, 34, 127, 10, now()), 'delayed request cannot revive stopped sharing');
select pg_temp.check_true((select latitude is null and not sharing from public.jeju_live_locations where trip_id = 'location-test' and user_id = auth.uid()), 'stop clears coordinates');
select set_config('jeju_test.share_a', public.jeju_start_sharing('location-test')::text, true);
select public.jeju_publish_location('location-test', current_setting('jeju_test.share_a')::uuid, 33.5, 126.5, 10, now());
reset role;
update public.jeju_live_locations set updated_at = now() - interval '3 minutes'
  where trip_id = 'location-test' and user_id = 'aaaaaaaa-0000-4000-8000-000000000001';
set local role authenticated;
select set_config('request.jwt.claim.sub', 'aaaaaaaa-0000-4000-8000-000000000002', true);
select pg_temp.check_true((select count(*) = 0 from public.jeju_live_locations where trip_id = 'location-test' and user_id = 'aaaaaaaa-0000-4000-8000-000000000001'), 'RLS hides stale coordinates');
reset role;
update public.jeju_live_locations set updated_at = now() where trip_id = 'location-test';
update public.jeju_participants set enabled = false where trip_id = 'location-test' and user_id = 'aaaaaaaa-0000-4000-8000-000000000001';
set local role authenticated;
select pg_temp.check_true((select count(*) = 0 from public.jeju_live_locations where trip_id = 'location-test' and user_id = 'aaaaaaaa-0000-4000-8000-000000000001'), 'revoked participant location is hidden');
select set_config('request.jwt.claim.sub', 'aaaaaaaa-0000-4000-8000-000000000001', true);
select pg_temp.check_true((select count(*) = 0 from public.jeju_live_locations), 'revoked participant cannot read any positions');
select pg_temp.check_true(public.jeju_join_trip('location-test', 'Rider A', 'test-passcode')->>'reason' = 'disabled', 'revoked membership cannot re-enroll');
do $$ begin
  perform public.jeju_start_sharing('location-test');
  raise exception 'Revoked participant started sharing';
exception when insufficient_privilege then null;
end $$;
select set_config('request.jwt.claim.sub', 'aaaaaaaa-0000-4000-8000-000000000003', true);
do $$ begin
  perform public.jeju_join_trip('location-test', 'Rider C', 'test-passcode');
  raise exception 'Unverified email joined';
exception when insufficient_privilege then null;
end $$;

select set_config('request.jwt.claim.sub', 'aaaaaaaa-0000-4000-8000-000000000004', true);
select pg_temp.check_true((select count(*) = 0 from public.jeju_live_locations), 'device account has no access before passcode');
select pg_temp.check_true((public.jeju_join_trip('location-test', 'Guest', 'test-passcode')->>'ok')::boolean, 'device account joins with passcode');
select set_config('jeju_test.share_guest', public.jeju_start_sharing('location-test')::text, true);
select pg_temp.check_true(public.jeju_publish_location('location-test', current_setting('jeju_test.share_guest')::uuid, 33.5, 126.5, 10, now()), 'guest publishes only their own position');
select public.jeju_leave_trip('location-test');
select pg_temp.check_true((select count(*) = 0 from public.jeju_live_locations), 'leaving revokes reads for an existing token');
select pg_temp.check_true(public.jeju_join_trip('location-test', 'Guest', 'test-passcode')->>'reason' = 'disabled', 'left device cannot reuse old identity');
reset role;
select pg_temp.check_true((select latitude is null and not sharing from public.jeju_live_locations where trip_id = 'location-test' and user_id = 'aaaaaaaa-0000-4000-8000-000000000004'), 'leaving clears stored GPS');
rollback;

select 'Participant authorization and location checks passed; test data rolled back' as result;
