create or replace function public.remove_match_participant(p_match_id uuid, p_user_id uuid)
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
  if match_row.host_id <> auth.uid() then raise exception 'not_authorized'; end if;
  if p_user_id = match_row.host_id then raise exception 'host_cannot_be_removed'; end if;
  if match_row.status not in ('open', 'full') then raise exception 'match_not_active'; end if;

  update public.match_participants
  set removed_at = now()
  where match_id = p_match_id and user_id = p_user_id and removed_at is null;
  if not found then raise exception 'not_an_active_participant'; end if;

  update public.match_join_requests
  set status = 'cancelled', responded_at = now()
  where match_id = p_match_id and user_id = p_user_id and status = 'accepted';

  update public.matches
  set participant_count = greatest(1, participant_count - 1), status = 'open'
  where id = p_match_id;

  insert into public.notifications(recipient_id, actor_id, type, title, match_id)
  values(p_user_id, auth.uid(), 'participant_removed', 'You were removed from ' || match_row.title, match_row.id);
end
$$;

revoke all on function public.remove_match_participant(uuid, uuid) from public, anon;
grant execute on function public.remove_match_participant(uuid, uuid) to authenticated;
