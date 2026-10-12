create table public.jeju_course_posts (
  id uuid primary key default gen_random_uuid(),
  trip_id text not null references jeju_private.trip_access(trip_id) on delete cascade,
  user_id uuid not null references auth.users(id),
  kind text not null check (kind in ('photo','accident')),
  day text not null check (day in ('day1','day2','day3','day4')),
  title text not null check (char_length(title) between 1 and 80),
  note text not null default '' check (char_length(note) <= 2000),
  author text not null default '' check (char_length(author) <= 40),
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  photos jsonb not null default '[]' check (jsonb_typeof(photos)='array' and jsonb_array_length(photos)<=3),
  state text not null default 'pending' check (state in ('pending','ready','failed')),
  request_id text not null check (request_id ~ '^[a-zA-Z0-9_-]{16,100}$'),
  request_hash text not null check (request_hash ~ '^[a-f0-9]{64}$'),
  lease_id uuid not null default gen_random_uuid(),
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (user_id,request_id),
  check (kind <> 'photo' or jsonb_array_length(photos)>0)
);
create index jeju_course_posts_trip_day on public.jeju_course_posts(trip_id,day,created_at desc) where state='ready';
create index jeju_course_posts_user_created on public.jeju_course_posts(user_id,created_at);
alter table public.jeju_course_posts enable row level security;
revoke all on public.jeju_course_posts from anon,authenticated;
grant select (id,trip_id,kind,day,title,note,author,latitude,longitude,photos,created_at) on public.jeju_course_posts to anon,authenticated;
grant all on public.jeju_course_posts to service_role;
-- Published course photos are intentionally viewable on the public tour site.
-- Private participant GPS and invitation tables keep their existing policies.
create policy jeju_course_posts_public_read on public.jeju_course_posts for select to anon,authenticated using (state='ready');

insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('jeju-course-photos','jeju-course-photos',true,8388608,array['image/jpeg','image/png','image/webp']);
-- No browser INSERT/UPDATE/DELETE policies: the authenticated Edge Function owns uploads.

grant usage on schema jeju_private to service_role;
grant select on jeju_private.trip_access,jeju_private.participant_invitations to service_role;

create function public.jeju_reserve_course_post(p_trip_id text,p_user_id uuid,p_request_id text,p_hash text,p_entry jsonb,p_photos jsonb)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare v_post public.jeju_course_posts; v_id uuid; v_photos jsonb;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text,0));
  if not exists (
    select 1 from public.jeju_participants m
    join jeju_private.trip_access t on t.trip_id=m.trip_id
    join jeju_private.participant_invitations i on i.trip_id=m.trip_id and i.claimed_by=m.user_id
    where m.trip_id=p_trip_id and m.user_id=p_user_id and m.enabled and t.enabled
      and not i.revoked and i.expires_at>now()
  ) then raise exception 'course_membership_required' using errcode='42501'; end if;
  select * into v_post from public.jeju_course_posts where user_id=p_user_id and request_id=p_request_id for update;
  if found then
    if v_post.request_hash<>p_hash or v_post.trip_id<>p_trip_id then raise exception 'course_request_conflict' using errcode='23505'; end if;
    if v_post.state='ready' then return to_jsonb(v_post)||jsonb_build_object('duplicate',true); end if;
    if v_post.state='pending' and v_post.updated_at>now()-interval '5 minutes' then
      raise exception 'course_upload_processing' using errcode='P0001';
    end if;
    update public.jeju_course_posts set state='pending',lease_id=gen_random_uuid(),updated_at=now() where id=v_post.id returning * into v_post;
    return to_jsonb(v_post)||jsonb_build_object('duplicate',false);
  end if;
  if (select count(*) from public.jeju_course_posts where user_id=p_user_id and created_at>now()-interval '10 minutes')>=20
     or (select count(*) from public.jeju_course_posts where user_id=p_user_id and created_at>now()-interval '1 day')>=200 then
    raise exception 'course_upload_rate_limit' using errcode='P0001';
  end if;
  v_id:=gen_random_uuid();
  select coalesce(jsonb_agg(value-'ext'||jsonb_build_object('path',p_trip_id||'/'||v_id::text||'/'||(value->>'id')||'.'||(value->>'ext')) order by ord),'[]')
    into v_photos from jsonb_array_elements(p_photos) with ordinality as f(value,ord);
  insert into public.jeju_course_posts(id,trip_id,user_id,kind,day,title,note,author,latitude,longitude,photos,request_id,request_hash)
    values(v_id,p_trip_id,p_user_id,p_entry->>'kind',p_entry->>'day',p_entry->>'title',p_entry->>'note',p_entry->>'author',
      (p_entry->>'latitude')::double precision,(p_entry->>'longitude')::double precision,v_photos,p_request_id,p_hash)
    returning * into v_post;
  return to_jsonb(v_post)||jsonb_build_object('duplicate',false);
end;
$$;
revoke all on function public.jeju_reserve_course_post(text,uuid,text,text,jsonb,jsonb) from public,anon,authenticated;
grant execute on function public.jeju_reserve_course_post(text,uuid,text,text,jsonb,jsonb) to service_role;
