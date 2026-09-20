create or replace function public.reject_match_join_request(p_request_id uuid)
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
  where id = request_row.match_id;

  if match_row.host_id <> auth.uid() then
    raise exception 'not_authorized';
  end if;

  update public.match_join_requests
  set status = 'rejected', responded_at = now()
  where id = request_row.id;

  insert into public.notifications(recipient_id, actor_id, type, title, match_id)
  values(request_row.user_id, auth.uid(), 'join_rejected', 'Your join request was declined', match_row.id);
end
$$;

revoke all on function public.reject_match_join_request(uuid) from public, anon;
grant execute on function public.reject_match_join_request(uuid) to authenticated;
