alter table public.matches drop constraint matches_host_id_fkey;
alter table public.matches alter column host_id drop not null;
alter table public.matches
  add constraint matches_host_id_fkey foreign key (host_id) references public.profiles(id) on delete set null;

create or replace view public.match_discovery
with (security_invoker = true)
as
select
  m.*,
  coalesce(p.first_name || ' ' || p.last_name, 'Deleted user') as host_name,
  p.profile_image_path as host_avatar_url,
  m.cover_image_path as cover_url,
  to_tsvector('simple', m.title || ' ' || m.location || ' ' || m.sport) as search_document
from public.matches m
left join public.profiles p on p.id = m.host_id
where m.status in ('open', 'full', 'completed', 'cancelled');

create or replace function public.prepare_user_deletion(p_user_id uuid)
returns text[]
language plpgsql
security definer
set search_path = ''
as $$
declare
  cover_paths text[];
begin
  select coalesce(array_agg(cover_image_path) filter (where cover_image_path is not null), '{}')
  into cover_paths
  from public.matches
  where host_id = p_user_id and status in ('draft', 'open', 'full');

  update public.matches m
  set participant_count = greatest(1, m.participant_count - 1),
      status = case when m.status = 'full' then 'open'::public.match_status else m.status end
  where m.status in ('open', 'full')
    and m.host_id is distinct from p_user_id
    and exists (
      select 1 from public.match_participants participant
      where participant.match_id = m.id
        and participant.user_id = p_user_id
        and participant.removed_at is null
    );

  delete from public.matches
  where host_id = p_user_id and status in ('draft', 'open', 'full');

  update public.matches
  set host_id = null
  where host_id = p_user_id and status in ('completed', 'cancelled');

  return cover_paths;
end
$$;

revoke all on function public.prepare_user_deletion(uuid) from public, anon, authenticated;
grant execute on function public.prepare_user_deletion(uuid) to service_role;
