create or replace function public.request_to_join_match(p_match_id uuid, p_message text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  match_row public.matches;
  existing_status public.join_request_status;
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  if p_message is not null and char_length(p_message) > 500 then raise exception 'message_too_long'; end if;

  select * into match_row from public.matches where id = p_match_id for update;
  if not found then raise exception 'match_not_found'; end if;
  if match_row.host_id = auth.uid() then raise exception 'host_cannot_request'; end if;
  if match_row.status <> 'open' or match_row.participant_count >= match_row.max_players then raise exception 'match_not_open'; end if;
  if exists(select 1 from public.match_participants where match_id = p_match_id and user_id = auth.uid() and removed_at is null) then raise exception 'already_participant'; end if;

  select status into existing_status from public.match_join_requests where match_id = p_match_id and user_id = auth.uid();
  if existing_status in ('pending', 'accepted') then raise exception 'request_already_active'; end if;
  if existing_status = 'rejected' then raise exception 'request_previously_rejected'; end if;

  insert into public.match_join_requests(match_id, user_id, message, status, responded_at)
  values(p_match_id, auth.uid(), p_message, 'pending', null)
  on conflict(match_id, user_id) do update
  set message = excluded.message, status = 'pending', responded_at = null, updated_at = now();

  insert into public.notifications(recipient_id, actor_id, type, title, match_id, profile_id)
  values(match_row.host_id, auth.uid(), 'join_request', 'New request to join ' || match_row.title, match_row.id, auth.uid());
end
$$;

create or replace function public.leave_match(p_match_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  match_row public.matches;
begin
  select * into match_row from public.matches where id = p_match_id for update;
  if not found then raise exception 'match_not_found'; end if;
  if match_row.status not in ('open', 'full') then raise exception 'match_not_active'; end if;

  update public.match_participants
  set removed_at = now()
  where match_id = p_match_id and user_id = auth.uid() and removed_at is null;
  if not found then raise exception 'not_an_active_participant'; end if;

  update public.match_join_requests
  set status = 'cancelled', responded_at = now()
  where match_id = p_match_id and user_id = auth.uid() and status = 'accepted';

  update public.matches
  set participant_count = greatest(1, participant_count - 1), status = 'open'
  where id = p_match_id;

  insert into public.notifications(recipient_id, actor_id, type, title, match_id, profile_id)
  values(match_row.host_id, auth.uid(), 'participant_left', 'A player left ' || match_row.title, match_row.id, auth.uid());
end
$$;

revoke all on function public.request_to_join_match(uuid, text) from public, anon;
revoke all on function public.leave_match(uuid) from public, anon;
grant execute on function public.request_to_join_match(uuid, text) to authenticated;
grant execute on function public.leave_match(uuid) to authenticated;
