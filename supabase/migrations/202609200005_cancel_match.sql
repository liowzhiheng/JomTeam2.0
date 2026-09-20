create or replace function public.cancel_match(p_match_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  match_row public.matches;
begin
  select * into match_row
  from public.matches
  where id = p_match_id
  for update;

  if not found then
    raise exception 'match_not_found';
  end if;
  if match_row.host_id <> auth.uid() then
    raise exception 'not_authorized';
  end if;
  if match_row.status in ('completed', 'cancelled') then
    raise exception 'match_already_closed';
  end if;

  insert into public.notifications(recipient_id, actor_id, type, title, match_id)
  select recipients.user_id, auth.uid(), 'match_cancelled', match_row.title || ' was cancelled', match_row.id
  from (
    select user_id from public.match_participants where match_id = match_row.id and removed_at is null
    union
    select user_id from public.match_join_requests where match_id = match_row.id and status = 'pending'
  ) recipients
  where recipients.user_id <> auth.uid();

  update public.match_join_requests
  set status = 'cancelled', responded_at = now()
  where match_id = match_row.id and status = 'pending';

  update public.matches
  set status = 'cancelled'
  where id = match_row.id;
end
$$;

revoke all on function public.cancel_match(uuid) from public, anon;
grant execute on function public.cancel_match(uuid) to authenticated;
