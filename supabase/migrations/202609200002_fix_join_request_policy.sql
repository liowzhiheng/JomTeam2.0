drop policy if exists requests_user_create on public.match_join_requests;

create policy requests_user_create
on public.match_join_requests
for insert
to authenticated
with check (
  user_id = auth.uid()
  and status = 'pending'
  and not exists (
    select 1
    from public.matches m
    where m.id = match_join_requests.match_id
      and (
        m.host_id = auth.uid()
        or m.status not in ('open', 'full')
        or m.participant_count >= m.max_players
      )
  )
  and not exists (
    select 1
    from public.match_participants participant
    where participant.match_id = match_join_requests.match_id
      and participant.user_id = auth.uid()
      and participant.removed_at is null
  )
);
