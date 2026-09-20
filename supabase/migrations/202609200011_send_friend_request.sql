create or replace function public.send_friend_request(p_recipient_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  if p_recipient_id = auth.uid() then raise exception 'cannot_friend_yourself'; end if;
  if not exists(select 1 from public.profiles where id = p_recipient_id and status = 'active') then raise exception 'player_not_available'; end if;
  if exists(select 1 from public.friendships where user_id = least(auth.uid(), p_recipient_id) and friend_id = greatest(auth.uid(), p_recipient_id)) then raise exception 'already_friends'; end if;
  if exists(select 1 from public.friend_requests where status = 'pending' and least(sender_id, recipient_id) = least(auth.uid(), p_recipient_id) and greatest(sender_id, recipient_id) = greatest(auth.uid(), p_recipient_id)) then raise exception 'request_already_pending'; end if;

  insert into public.friend_requests(sender_id, recipient_id, status)
  values(auth.uid(), p_recipient_id, 'pending')
  on conflict(sender_id, recipient_id) do update
  set status = 'pending', updated_at = now();

  insert into public.notifications(recipient_id, actor_id, type, title, profile_id)
  values(p_recipient_id, auth.uid(), 'friend_request', 'You received a friend request', auth.uid());
end
$$;

revoke all on function public.send_friend_request(uuid) from public, anon;
grant execute on function public.send_friend_request(uuid) to authenticated;
