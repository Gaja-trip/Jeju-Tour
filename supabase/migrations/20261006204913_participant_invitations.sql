begin;

alter table jeju_private.trip_access add column invitation_only boolean not null default false;
create table jeju_private.participant_invitations (
  id uuid primary key default gen_random_uuid(),
  trip_id text not null references jeju_private.trip_access(trip_id),
  slot smallint not null check (slot between 1 and 8),
  token_hash text not null unique check (token_hash ~ '^[a-f0-9]{64}$'),
  expires_at timestamptz not null,
  revoked boolean not null default false,
  claimed_by uuid references auth.users(id) on delete set null,
  claimed_at timestamptz,
  created_at timestamptz not null default now()
);
create unique index jeju_invite_active_slot on jeju_private.participant_invitations(trip_id, slot) where not revoked;
create unique index jeju_invite_active_user on jeju_private.participant_invitations(trip_id, claimed_by)
  where not revoked and claimed_by is not null;
alter table jeju_private.participant_invitations enable row level security;
revoke all on jeju_private.participant_invitations from public, anon, authenticated;

-- Reissued invitations may reuse the old, disabled participant's display name.
drop index public.jeju_participant_names;
create unique index jeju_participant_names on public.jeju_participants(trip_id, lower(btrim(display_name))) where enabled;

create function jeju_private.is_active_member(p_trip_id text, p_user_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select auth.uid() is not null and exists (
    select 1 from public.jeju_participants p join jeju_private.trip_access t using(trip_id)
    where p.trip_id = p_trip_id and p.user_id = p_user_id and p.enabled and t.enabled
      and (not t.invitation_only or exists (
        select 1 from jeju_private.participant_invitations i
        where i.trip_id = p_trip_id and i.claimed_by = p_user_id and not i.revoked and i.expires_at > now()
      ))
  );
$$;
create or replace function jeju_private.is_participant(p_trip_id text)
returns boolean language sql stable security definer set search_path = '' as $$
  select jeju_private.is_active_member(p_trip_id, (select auth.uid()));
$$;

drop policy jeju_participants_read on public.jeju_participants;
create policy jeju_participants_read on public.jeju_participants for select to authenticated using (
  user_id = (select auth.uid()) or
  (jeju_private.is_participant(trip_id) and jeju_private.is_active_member(trip_id, user_id))
);
drop policy jeju_locations_read on public.jeju_live_locations;
create policy jeju_locations_read on public.jeju_live_locations for select to authenticated using (
  jeju_private.is_participant(trip_id) and jeju_private.is_active_member(trip_id, user_id)
  and (latitude is null or updated_at > now() - interval '2 minutes')
);

-- The old password implementation is no longer directly executable by clients.
alter function jeju_private.join_trip(text, text, text) rename to join_with_password;
revoke all on function jeju_private.join_with_password(text, text, text) from public, anon, authenticated;
create function jeju_private.join_trip(p_trip_id text, p_name text, p_password text)
returns jsonb language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'Authentication required' using errcode = '42501'; end if;
  if exists (select 1 from jeju_private.trip_access where trip_id = p_trip_id and invitation_only) then
    return jsonb_build_object('ok', false, 'reason', 'invitation_required');
  end if;
  return jeju_private.join_with_password(p_trip_id, p_name, p_password);
end;
$$;

create function jeju_private.claim_invitation(p_trip_id text, p_token text, p_name text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := auth.uid();
  v_invite jeju_private.participant_invitations;
  v_attempt jeju_private.join_attempts;
  v_reason text;
begin
  if v_user is null or not exists (select 1 from auth.users where id = v_user and (is_anonymous or email_confirmed_at is not null)) then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  if p_name is null or char_length(btrim(p_name)) not between 1 and 30 then
    return jsonb_build_object('ok', false, 'reason', 'invalid_name');
  end if;
  perform pg_advisory_xact_lock(hashtextextended(v_user::text, 0));
  insert into jeju_private.join_attempts(user_id) values(v_user) on conflict do nothing;
  select * into v_attempt from jeju_private.join_attempts where user_id = v_user;
  if v_attempt.failures >= 5 and v_attempt.retry_at > now() then
    return jsonb_build_object('ok', false, 'reason', 'rate_limited');
  end if;
  if v_attempt.retry_at <= now() then
    update jeju_private.join_attempts set failures = 0, retry_at = now() + interval '15 minutes' where user_id = v_user;
  end if;
  if p_token is not null and p_token ~ '^[A-Za-z0-9_-]{43}$' then
    select * into v_invite from jeju_private.participant_invitations
    where trip_id = p_trip_id and token_hash = encode(extensions.digest(p_token, 'sha256'), 'hex') for update;
  end if;
  if v_invite.id is null or not exists (select 1 from jeju_private.trip_access where trip_id = p_trip_id and enabled and invitation_only) then
    v_reason := 'invalid_invitation';
  elsif v_invite.revoked then v_reason := 'revoked';
  elsif v_invite.expires_at <= now() then v_reason := 'expired';
  elsif v_invite.claimed_at is not null and v_invite.claimed_by is distinct from v_user then v_reason := 'already_used';
  elsif exists (select 1 from jeju_private.participant_invitations where trip_id = p_trip_id and claimed_by = v_user and not revoked and id <> v_invite.id) then
    v_reason := 'already_registered';
  elsif exists (select 1 from public.jeju_participants where trip_id = p_trip_id and user_id = v_user and not enabled) then
    v_reason := 'disabled';
  end if;
  if v_reason is not null then
    update jeju_private.join_attempts set failures = failures + 1 where user_id = v_user;
    return jsonb_build_object('ok', false, 'reason', v_reason);
  end if;
  begin
    insert into public.jeju_participants(trip_id, user_id, display_name)
      values(p_trip_id, v_user, btrim(p_name)) on conflict(trip_id, user_id) do nothing;
  exception when unique_violation then
    return jsonb_build_object('ok', false, 'reason', 'name_taken');
  end;
  update jeju_private.participant_invitations set claimed_by = v_user, claimed_at = coalesce(claimed_at, now()) where id = v_invite.id;
  update jeju_private.join_attempts set failures = 0 where user_id = v_user;
  return jsonb_build_object('ok', true, 'slot', v_invite.slot, 'expires_at', v_invite.expires_at);
end;
$$;

create function jeju_private.invitation_status(p_trip_id text)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_invite jeju_private.participant_invitations;
begin
  if auth.uid() is null then raise exception 'Authentication required' using errcode = '42501'; end if;
  select * into v_invite from jeju_private.participant_invitations
    where trip_id = p_trip_id and claimed_by = auth.uid() order by created_at desc limit 1;
  return jsonb_build_object('ok', jeju_private.is_participant(p_trip_id), 'slot', v_invite.slot,
    'expires_at', v_invite.expires_at, 'reason', case
      when v_invite.id is null then 'invitation_required'
      when v_invite.revoked then 'revoked'
      when v_invite.expires_at <= now() then 'expired'
      else 'disabled' end);
end;
$$;

create function jeju_private.leave_trip(p_trip_id text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'Authentication required' using errcode = '42501'; end if;
  perform jeju_private.stop_sharing(p_trip_id, null);
  update public.jeju_participants set enabled = false where trip_id = p_trip_id and user_id = auth.uid();
  update jeju_private.participant_invitations set revoked = true where trip_id = p_trip_id and claimed_by = auth.uid();
end;
$$;

create function public.jeju_claim_invitation(p_trip_id text, p_token text, p_name text)
returns jsonb language sql security invoker set search_path = '' as $$
  select jeju_private.claim_invitation(p_trip_id, p_token, p_name);
$$;
create function public.jeju_invitation_status(p_trip_id text)
returns jsonb language sql security invoker set search_path = '' as $$
  select jeju_private.invitation_status(p_trip_id);
$$;
create function public.jeju_leave_trip(p_trip_id text)
returns void language sql security invoker set search_path = '' as $$
  select jeju_private.leave_trip(p_trip_id);
$$;

revoke all on function jeju_private.is_active_member(text, uuid), jeju_private.join_trip(text, text, text),
  jeju_private.claim_invitation(text, text, text), jeju_private.invitation_status(text), jeju_private.leave_trip(text)
  from public, anon, authenticated;
grant execute on function jeju_private.is_active_member(text, uuid), jeju_private.join_trip(text, text, text),
  jeju_private.claim_invitation(text, text, text), jeju_private.invitation_status(text), jeju_private.leave_trip(text) to authenticated;
revoke all on function public.jeju_claim_invitation(text, text, text), public.jeju_invitation_status(text), public.jeju_leave_trip(text)
  from public, anon, authenticated;
grant execute on function public.jeju_claim_invitation(text, text, text), public.jeju_invitation_status(text), public.jeju_leave_trip(text) to authenticated;

commit;
