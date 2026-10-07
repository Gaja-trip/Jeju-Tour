begin;

-- Expose only active participant color slots, never invitation secrets.
create function jeju_private.participant_slots(p_trip_id text)
returns table(user_id uuid, slot smallint)
language plpgsql stable security definer set search_path = '' as $$
begin
  if auth.uid() is null or not jeju_private.is_participant(p_trip_id) then
    raise exception 'Participant access required' using errcode = '42501';
  end if;
  return query
    select i.claimed_by, i.slot
    from jeju_private.participant_invitations i
    where i.trip_id = p_trip_id and not i.revoked and i.expires_at > now()
      and i.claimed_by is not null
      and jeju_private.is_active_member(p_trip_id, i.claimed_by)
    order by i.slot;
end;
$$;

create function public.jeju_participant_slots(p_trip_id text)
returns table(user_id uuid, slot smallint)
language sql stable security invoker set search_path = '' as $$
  select * from jeju_private.participant_slots(p_trip_id);
$$;

revoke all on function jeju_private.participant_slots(text), public.jeju_participant_slots(text)
  from public, anon, authenticated;
grant execute on function jeju_private.participant_slots(text), public.jeju_participant_slots(text)
  to authenticated;

commit;
