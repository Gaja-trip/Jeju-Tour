begin;
create function pg_temp.check_slots(value boolean, message text) returns void language plpgsql as $$
begin if value is distinct from true then raise exception 'FAILED: %', message; end if; end;
$$;
insert into auth.users(id, is_anonymous)
  select ('cccccccc-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid, true from generate_series(1, 9) n;
insert into jeju_private.trip_access(trip_id, password_hash, invitation_only)
  values('slot-test', extensions.crypt('test', extensions.gen_salt('bf', 4)), true),
    ('slot-other', extensions.crypt('test', extensions.gen_salt('bf', 4)), true);
insert into public.jeju_participants(trip_id, user_id, display_name)
  select 'slot-test', ('cccccccc-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid, 'Rider ' || n
  from generate_series(1, 8) n;
insert into jeju_private.participant_invitations(trip_id, slot, token_hash, expires_at, claimed_by)
  select 'slot-test', n, encode(extensions.digest('slot-test-' || n, 'sha256'), 'hex'), now() + interval '1 day',
    ('cccccccc-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid from generate_series(1, 8) n;

set local role anon;
select pg_temp.check_slots(not has_function_privilege('public.jeju_participant_slots(text)', 'EXECUTE'), 'unsigned callers cannot read slots');
reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '', true);
do $$ begin
  perform public.jeju_participant_slots('slot-test'); raise exception 'Missing UID allowed';
exception when insufficient_privilege then null; end $$;
select set_config('request.jwt.claim.sub', 'cccccccc-0000-4000-8000-000000000009', true);
do $$ begin
  perform public.jeju_participant_slots('slot-test'); raise exception 'Outsider allowed';
exception when insufficient_privilege then null; end $$;
select set_config('request.jwt.claim.sub', 'cccccccc-0000-4000-8000-000000000001', true);
select pg_temp.check_slots((select count(*) = 8 and count(distinct slot) = 8 from public.jeju_participant_slots('slot-test')), 'all eight fixed slots returned');
select pg_temp.check_slots((select slot = 8 from public.jeju_participant_slots('slot-test') where user_id = 'cccccccc-0000-4000-8000-000000000008'), 'identity maps to its invitation slot');
select pg_temp.check_slots(not has_table_privilege('jeju_private.participant_invitations', 'SELECT'), 'invite secrets remain private');
do $$ begin
  perform public.jeju_participant_slots('slot-other'); raise exception 'Cross-trip read allowed';
exception when insufficient_privilege then null; end $$;
reset role;
update jeju_private.participant_invitations set revoked = true where trip_id = 'slot-test' and slot = 2;
update jeju_private.participant_invitations set expires_at = now() - interval '1 second' where trip_id = 'slot-test' and slot = 3;
update public.jeju_participants set enabled = false where trip_id = 'slot-test' and user_id = 'cccccccc-0000-4000-8000-000000000004';
set local role authenticated;
select pg_temp.check_slots((select count(*) = 5 and min(slot) = 1 and max(slot) = 8 from public.jeju_participant_slots('slot-test')), 'revoked expired disabled subjects excluded without renumbering');
select set_config('request.jwt.claim.sub', 'cccccccc-0000-4000-8000-000000000002', true);
do $$ begin
  perform public.jeju_participant_slots('slot-test'); raise exception 'Revoked viewer allowed';
exception when insufficient_privilege then null; end $$;
select set_config('request.jwt.claim.sub', 'cccccccc-0000-4000-8000-000000000003', true);
do $$ begin
  perform public.jeju_participant_slots('slot-test'); raise exception 'Expired viewer allowed';
exception when insufficient_privilege then null; end $$;
reset role;
rollback;
