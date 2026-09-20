create or replace function public.complete_match(p_match_id uuid)
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
  if match_row.status not in ('open', 'full') then raise exception 'match_not_active'; end if;
  if now() < match_row.starts_at + make_interval(mins => match_row.duration_minutes) then raise exception 'match_not_finished'; end if;

  update public.matches set status = 'completed' where id = p_match_id;
  update public.match_join_requests set status = 'cancelled', responded_at = now() where match_id = p_match_id and status = 'pending';

  insert into public.notifications(recipient_id, actor_id, type, title, match_id)
  select participant.user_id, auth.uid(), 'match_completed', match_row.title || ' was marked completed', match_row.id
  from public.match_participants participant
  where participant.match_id = match_row.id and participant.removed_at is null and participant.user_id <> auth.uid();
end
$$;

revoke all on function public.complete_match(uuid) from public, anon;
grant execute on function public.complete_match(uuid) to authenticated;

alter table public.match_messages replica identity full;
