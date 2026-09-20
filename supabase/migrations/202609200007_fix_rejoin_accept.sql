create or replace function public.accept_match_join_request(p_request_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  request_row public.match_join_requests;
  match_row public.matches;
begin
  select * into request_row
  from public.match_join_requests
  where id = p_request_id
  for update;

  if not found or request_row.status <> 'pending' then
    raise exception 'request_not_pending';
  end if;

  select * into match_row
  from public.matches
  where id = request_row.match_id
  for update;

  if match_row.host_id <> auth.uid() then
    raise exception 'not_authorized';
  end if;
  if match_row.status not in ('open', 'full') or match_row.participant_count >= match_row.max_players then
    raise exception 'match_full_or_closed';
  end if;

  insert into public.match_participants(match_id, user_id, joined_at, removed_at)
  values(match_row.id, request_row.user_id, now(), null)
  on conflict(match_id, user_id) do update
  set joined_at = now(), removed_at = null
  where public.match_participants.removed_at is not null;

  if not found then
    raise exception 'already_participant';
  end if;

  update public.match_join_requests
  set status = 'accepted', responded_at = now()
  where id = request_row.id;

  update public.matches
  set participant_count = participant_count + 1,
      status = case when participant_count + 1 >= max_players then 'full'::public.match_status else 'open'::public.match_status end
  where id = match_row.id;

  insert into public.notifications(recipient_id, actor_id, type, title, match_id)
  values(request_row.user_id, auth.uid(), 'join_accepted', 'Your join request was accepted', match_row.id);
end
$$;

revoke all on function public.accept_match_join_request(uuid) from public, anon;
grant execute on function public.accept_match_join_request(uuid) to authenticated;
