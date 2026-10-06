begin;

create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;
create schema if not exists jeju_private;
revoke all on schema jeju_private from public, anon, authenticated;
grant usage on schema jeju_private to authenticated;

create table jeju_private.trip_access (
  trip_id text primary key,
  password_hash text not null,
  enabled boolean not null default true
);

create table jeju_private.join_attempts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  failures integer not null default 0,
  retry_at timestamptz not null default now()
);

create table public.jeju_participants (
  trip_id text not null references jeju_private.trip_access(trip_id),
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null check (char_length(btrim(display_name)) between 1 and 30),
  enabled boolean not null default true,
  joined_at timestamptz not null default now(),
  primary key (trip_id, user_id)
);

create unique index jeju_participant_names on public.jeju_participants (trip_id, lower(btrim(display_name)));
create index jeju_participant_user on public.jeju_participants (user_id);

create table public.jeju_live_locations (
  trip_id text not null,
  user_id uuid not null,
  share_id uuid,
  sharing boolean not null default false,
  latitude double precision check (latitude between -90 and 90),
  longitude double precision check (longitude between -180 and 180),
  accuracy double precision check (accuracy between 0 and 10000),
  recorded_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (trip_id, user_id),
  foreign key (trip_id, user_id) references public.jeju_participants(trip_id, user_id) on delete cascade,
  check ((latitude is null) = (longitude is null)),
  check (sharing or (latitude is null and longitude is null and share_id is null))
);

create function jeju_private.is_participant(p_trip_id text)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.jeju_participants p
    join jeju_private.trip_access t using (trip_id)
    where p.trip_id = p_trip_id and p.user_id = (select auth.uid()) and p.enabled and t.enabled
  );
$$;

alter table public.jeju_participants enable row level security;
alter table public.jeju_live_locations enable row level security;
alter table jeju_private.trip_access enable row level security;
alter table jeju_private.join_attempts enable row level security;
revoke all on all tables in schema jeju_private from public, anon, authenticated;
revoke all on public.jeju_participants, public.jeju_live_locations from public, anon, authenticated;
grant select on public.jeju_participants, public.jeju_live_locations to authenticated;

create policy jeju_participants_read on public.jeju_participants for select to authenticated
  using (user_id = (select auth.uid()) or (enabled and jeju_private.is_participant(trip_id)));
create policy jeju_locations_read on public.jeju_live_locations for select to authenticated
  using (jeju_private.is_participant(trip_id)
    and (latitude is null or updated_at > now() - interval '2 minutes')
    and exists (select 1 from public.jeju_participants p
      where p.trip_id = jeju_live_locations.trip_id and p.user_id = jeju_live_locations.user_id and p.enabled));

-- Membership and location writes are limited to RPCs that derive identity from auth.uid().
create function jeju_private.join_trip(p_trip_id text, p_name text, p_password text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := auth.uid();
  v_hash text;
  v_attempt jeju_private.join_attempts;
  v_member public.jeju_participants;
begin
  if v_user is null or not exists (
    select 1 from auth.users where id = v_user and email_confirmed_at is not null
  ) then
    raise exception 'Email verification required' using errcode = '42501';
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
  begin
    insert into public.jeju_participants(trip_id, user_id, display_name)
      values (p_trip_id, v_user, btrim(p_name)) on conflict (trip_id, user_id) do nothing;
  exception when unique_violation then
    return jsonb_build_object('ok', false, 'reason', 'name_taken');
  end;
  update jeju_private.join_attempts set failures = 0 where user_id = v_user;
  return jsonb_build_object('ok', true);
end;
$$;

create function jeju_private.start_sharing(p_trip_id text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_share uuid := gen_random_uuid();
begin
  if not jeju_private.is_participant(p_trip_id) then
    raise exception 'Participant access required' using errcode = '42501';
  end if;
  insert into public.jeju_live_locations(trip_id, user_id, share_id, sharing)
    values (p_trip_id, auth.uid(), v_share, true)
    on conflict (trip_id, user_id) do update set
      share_id = v_share, sharing = true, latitude = null, longitude = null,
      accuracy = null, recorded_at = null, updated_at = now();
  return v_share;
end;
$$;

create function jeju_private.publish_location(
  p_trip_id text, p_share_id uuid, p_latitude double precision, p_longitude double precision,
  p_accuracy double precision, p_recorded_at timestamptz
)
returns boolean language plpgsql security definer set search_path = '' as $$
begin
  if not jeju_private.is_participant(p_trip_id) then
    raise exception 'Participant access required' using errcode = '42501';
  end if;
  if p_latitude is null or p_longitude is null or p_accuracy is null or p_recorded_at is null
    or not (p_latitude between -90 and 90) or not (p_longitude between -180 and 180)
    or not (p_accuracy between 0 and 10000)
    or not (p_recorded_at between now() - interval '2 minutes' and now() + interval '30 seconds') then
    raise exception 'Invalid or expired position' using errcode = '22023';
  end if;
  update public.jeju_live_locations set
    latitude = p_latitude, longitude = p_longitude, accuracy = p_accuracy,
    recorded_at = p_recorded_at, updated_at = now()
    where trip_id = p_trip_id and user_id = auth.uid() and sharing and share_id = p_share_id
      and (recorded_at is null or recorded_at < p_recorded_at);
  return found or exists (
    select 1 from public.jeju_live_locations
    where trip_id = p_trip_id and user_id = auth.uid() and sharing and share_id = p_share_id
  );
end;
$$;

create function jeju_private.stop_sharing(p_trip_id text, p_share_id uuid default null)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'Authentication required' using errcode = '42501'; end if;
  update public.jeju_live_locations set
    sharing = false, share_id = null, latitude = null, longitude = null,
    accuracy = null, recorded_at = null, updated_at = now()
    where trip_id = p_trip_id and user_id = auth.uid() and (p_share_id is null or share_id = p_share_id);
end;
$$;

-- Exposed RPCs run as the caller; privileged implementations stay in the private schema.
create function public.jeju_join_trip(p_trip_id text, p_name text, p_password text)
returns jsonb language sql security invoker set search_path = '' as $$
  select jeju_private.join_trip(p_trip_id, p_name, p_password);
$$;

create function public.jeju_start_sharing(p_trip_id text)
returns uuid language sql security invoker set search_path = '' as $$
  select jeju_private.start_sharing(p_trip_id);
$$;

create function public.jeju_publish_location(
  p_trip_id text, p_share_id uuid, p_latitude double precision, p_longitude double precision,
  p_accuracy double precision, p_recorded_at timestamptz
)
returns boolean language sql security invoker set search_path = '' as $$
  select jeju_private.publish_location(p_trip_id, p_share_id, p_latitude, p_longitude, p_accuracy, p_recorded_at);
$$;

create function public.jeju_stop_sharing(p_trip_id text, p_share_id uuid default null)
returns void language sql security invoker set search_path = '' as $$
  select jeju_private.stop_sharing(p_trip_id, p_share_id);
$$;

revoke all on all functions in schema jeju_private from public, anon, authenticated;
grant execute on function jeju_private.join_trip(text, text, text) to authenticated;
grant execute on function jeju_private.start_sharing(text) to authenticated;
grant execute on function jeju_private.publish_location(text, uuid, double precision, double precision, double precision, timestamptz) to authenticated;
grant execute on function jeju_private.stop_sharing(text, uuid) to authenticated;
grant execute on function jeju_private.is_participant(text) to authenticated;
revoke all on function public.jeju_join_trip(text, text, text) from public, anon;
revoke all on function public.jeju_start_sharing(text) from public, anon;
revoke all on function public.jeju_publish_location(text, uuid, double precision, double precision, double precision, timestamptz) from public, anon;
revoke all on function public.jeju_stop_sharing(text, uuid) from public, anon;
grant execute on function public.jeju_join_trip(text, text, text) to authenticated;
grant execute on function public.jeju_start_sharing(text) to authenticated;
grant execute on function public.jeju_publish_location(text, uuid, double precision, double precision, double precision, timestamptz) to authenticated;
grant execute on function public.jeju_stop_sharing(text, uuid) to authenticated;

insert into jeju_private.trip_access(trip_id, password_hash)
  values ('jeju-gaja', extensions.crypt('tamna', extensions.gen_salt('bf', 10)))
  on conflict (trip_id) do nothing;

do $$
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'jeju_live_locations') then
    alter publication supabase_realtime add table public.jeju_live_locations;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'jeju_participants') then
    alter publication supabase_realtime add table public.jeju_participants;
  end if;
end;
$$;

commit;
