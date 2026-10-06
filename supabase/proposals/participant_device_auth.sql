-- Not applied. Explicit approval is required before enabling device authentication.
begin;

-- Display names label devices; authorization always uses the signed-in user ID.
drop index public.jeju_participant_names;

create or replace function jeju_private.join_trip(p_trip_id text, p_name text, p_password text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := auth.uid();
  v_hash text;
  v_attempt jeju_private.join_attempts;
  v_member public.jeju_participants;
begin
  if v_user is null or not exists (
    select 1 from auth.users where id = v_user and (email_confirmed_at is not null or is_anonymous)
  ) then
    raise exception 'Authenticated device or verified email required' using errcode = '42501';
  end if;
  if p_name is null or char_length(btrim(p_name)) not between 1 and 30 then
    return jsonb_build_object('ok', false, 'reason', 'invalid_name');
  end if;
  perform pg_advisory_xact_lock(hashtextextended(v_user::text, 0));
  insert into jeju_private.join_attempts(user_id) values (v_user) on conflict do nothing;
  select * into v_attempt from jeju_private.join_attempts where user_id = v_user;
  if v_attempt.failures >= 5 and v_attempt.retry_at > now() then
    return jsonb_build_object('ok', false, 'reason', 'rate_limited');
  end if;
  if v_attempt.retry_at <= now() then
    update jeju_private.join_attempts set failures = 0, retry_at = now() + interval '15 minutes' where user_id = v_user;
  end if;
  select password_hash into v_hash from jeju_private.trip_access where trip_id = p_trip_id and enabled;
  if v_hash is null or p_password is null or octet_length(p_password) > 72
    or extensions.crypt(p_password, v_hash) is distinct from v_hash then
    update jeju_private.join_attempts set failures = failures + 1 where user_id = v_user;
    return jsonb_build_object('ok', false, 'reason', 'invalid_password');
  end if;
  select * into v_member from public.jeju_participants where trip_id = p_trip_id and user_id = v_user;
  if found and not v_member.enabled then
    return jsonb_build_object('ok', false, 'reason', 'disabled');
  end if;
  insert into public.jeju_participants(trip_id, user_id, display_name)
    values (p_trip_id, v_user, btrim(p_name))
    on conflict (trip_id, user_id) do update set display_name = excluded.display_name;
  update jeju_private.join_attempts set failures = 0 where user_id = v_user;
  return jsonb_build_object('ok', true);
end;
$$;

create function jeju_private.leave_trip(p_trip_id text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'Authentication required' using errcode = '42501'; end if;
  perform jeju_private.stop_sharing(p_trip_id, null);
  update public.jeju_participants set enabled = false
    where trip_id = p_trip_id and user_id = auth.uid();
end;
$$;

create function public.jeju_leave_trip(p_trip_id text)
returns void language sql security invoker set search_path = '' as $$
  select jeju_private.leave_trip(p_trip_id);
$$;

revoke all on function jeju_private.leave_trip(text) from public, anon, authenticated;
revoke all on function public.jeju_leave_trip(text) from public, anon, authenticated;
grant execute on function jeju_private.leave_trip(text) to authenticated;
grant execute on function public.jeju_leave_trip(text) to authenticated;

commit;
