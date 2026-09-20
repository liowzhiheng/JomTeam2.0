create extension if not exists pgcrypto;
create schema if not exists private;

create type public.user_role as enum ('user','admin');
create type public.user_status as enum ('active','deactivated');
create type public.gender_type as enum ('female','male','non_binary','prefer_not_to_say');
create type public.skill_level as enum ('beginner','intermediate','advanced','all_levels');
create type public.match_status as enum ('draft','open','full','completed','cancelled');
create type public.join_request_status as enum ('pending','accepted','rejected','cancelled');
create type public.friend_request_status as enum ('pending','accepted','rejected','cancelled');
create type public.feedback_status as enum ('unread','read');
create type public.notification_type as enum ('join_request','join_accepted','join_rejected','join_cancelled','participant_removed','participant_left','match_updated','match_cancelled','match_completed','friend_request','friend_accepted','chat_activity','system');

create table public.profiles (
 id uuid primary key references auth.users(id) on delete cascade, first_name text not null check(char_length(first_name) between 1 and 80), last_name text not null check(char_length(last_name) between 1 and 80), gender public.gender_type, birth_date date, status public.user_status not null default 'active', biography text check(char_length(biography)<=1000), location text, interests text[] not null default '{}', preferred_sports text[] not null default '{}', skill_level public.skill_level not null default 'all_levels', availability text, profile_image_path text, last_active_at timestamptz not null default now(), average_rating numeric(3,2) not null default 0 check(average_rating between 0 and 5), rating_count integer not null default 0 check(rating_count>=0), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.profile_private (user_id uuid primary key references public.profiles(id) on delete cascade, phone text, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.user_roles (user_id uuid primary key references auth.users(id) on delete cascade, role public.user_role not null default 'user', created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.matches (id uuid primary key default gen_random_uuid(), host_id uuid not null references public.profiles(id) on delete restrict, title text not null check(char_length(title) between 3 and 80), sport text not null, skill_level public.skill_level not null, max_players integer not null check(max_players between 2 and 100), participant_count integer not null default 1 check(participant_count>=1 and participant_count<=max_players), location text not null, starts_at timestamptz not null, duration_minutes integer not null check(duration_minutes between 30 and 480), description text check(char_length(description)<=1000), cover_image_path text, status public.match_status not null default 'draft', created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.match_join_requests (id uuid primary key default gen_random_uuid(), match_id uuid not null references public.matches(id) on delete cascade, user_id uuid not null default auth.uid() references public.profiles(id) on delete cascade, message text check(char_length(message)<=500), status public.join_request_status not null default 'pending', responded_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(match_id,user_id));
create table public.match_participants (match_id uuid not null references public.matches(id) on delete cascade, user_id uuid not null references public.profiles(id) on delete cascade, joined_at timestamptz not null default now(), removed_at timestamptz, primary key(match_id,user_id));
create table public.match_messages (id uuid primary key default gen_random_uuid(), match_id uuid not null references public.matches(id) on delete cascade, sender_id uuid not null default auth.uid() references public.profiles(id) on delete cascade, body text not null check(char_length(trim(body)) between 1 and 1000), created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.friend_requests (id uuid primary key default gen_random_uuid(), sender_id uuid not null default auth.uid() references public.profiles(id) on delete cascade, recipient_id uuid not null references public.profiles(id) on delete cascade, status public.friend_request_status not null default 'pending', created_at timestamptz not null default now(), updated_at timestamptz not null default now(), check(sender_id<>recipient_id), unique(sender_id,recipient_id));
create table public.friendships (user_id uuid not null references public.profiles(id) on delete cascade, friend_id uuid not null references public.profiles(id) on delete cascade, created_at timestamptz not null default now(), primary key(user_id,friend_id), check(user_id<friend_id));
create table public.player_ratings (id uuid primary key default gen_random_uuid(), match_id uuid not null references public.matches(id) on delete cascade, rater_id uuid not null default auth.uid() references public.profiles(id) on delete cascade, rated_user_id uuid not null references public.profiles(id) on delete cascade, rating smallint not null check(rating between 1 and 5), comment text check(char_length(comment)<=1000), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), check(rater_id<>rated_user_id), unique(match_id,rater_id,rated_user_id));
create table public.feedback (id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid() references public.profiles(id) on delete cascade, title text not null check(char_length(title) between 3 and 120), description text not null check(char_length(description) between 3 and 2000), rating smallint not null check(rating between 1 and 5), status public.feedback_status not null default 'unread', created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.notifications (id uuid primary key default gen_random_uuid(), recipient_id uuid not null references public.profiles(id) on delete cascade, actor_id uuid references public.profiles(id) on delete set null, type public.notification_type not null, title text not null, body text, match_id uuid references public.matches(id) on delete cascade, profile_id uuid references public.profiles(id) on delete cascade, read_at timestamptz, created_at timestamptz not null default now());
create table public.activity_logs (id bigint generated always as identity primary key, actor_id uuid references public.profiles(id) on delete set null, action text not null, entity_type text not null, entity_id uuid, metadata jsonb not null default '{}', created_at timestamptz not null default now());

create index matches_discovery_idx on public.matches(status,starts_at,sport,skill_level);
create index matches_host_idx on public.matches(host_id,starts_at desc);
create index matches_search_idx on public.matches using gin(to_tsvector('simple',title||' '||location||' '||sport));
create index join_requests_match_status_idx on public.match_join_requests(match_id,status,created_at);
create index join_requests_user_idx on public.match_join_requests(user_id,status);
create index participants_user_idx on public.match_participants(user_id,joined_at desc) where removed_at is null;
create index messages_match_created_idx on public.match_messages(match_id,created_at desc);
create index friend_requests_recipient_idx on public.friend_requests(recipient_id,status,created_at desc);
create unique index friend_requests_pending_pair_idx on public.friend_requests(least(sender_id,recipient_id),greatest(sender_id,recipient_id)) where status='pending';
create index ratings_target_idx on public.player_ratings(rated_user_id,created_at desc);
create index notifications_recipient_idx on public.notifications(recipient_id,read_at,created_at desc);
create index activity_created_idx on public.activity_logs(created_at desc);

create function private.is_admin() returns boolean language sql stable security definer set search_path='' as $$ select exists(select 1 from public.user_roles where user_id=auth.uid() and role='admin') $$;
revoke all on function private.is_admin() from public; grant execute on function private.is_admin() to authenticated;
create function private.is_match_member(p_match uuid,p_user uuid default auth.uid()) returns boolean language sql stable security definer set search_path='' as $$ select exists(select 1 from public.matches where id=p_match and host_id=p_user) or exists(select 1 from public.match_participants where match_id=p_match and user_id=p_user and removed_at is null) $$;
revoke all on function private.is_match_member(uuid,uuid) from public; grant execute on function private.is_match_member(uuid,uuid) to authenticated;
create function private.touch_updated_at() returns trigger language plpgsql set search_path='' as $$ begin new.updated_at=now(); return new; end $$;
create trigger profiles_updated before update on public.profiles for each row execute function private.touch_updated_at();
create trigger roles_updated before update on public.user_roles for each row execute function private.touch_updated_at();
create trigger matches_updated before update on public.matches for each row execute function private.touch_updated_at();
create trigger join_requests_updated before update on public.match_join_requests for each row execute function private.touch_updated_at();
create trigger friend_requests_updated before update on public.friend_requests for each row execute function private.touch_updated_at();
create trigger ratings_updated before update on public.player_ratings for each row execute function private.touch_updated_at();
create trigger feedback_updated before update on public.feedback for each row execute function private.touch_updated_at();

create function private.handle_new_user() returns trigger language plpgsql security definer set search_path='' as $$ begin insert into public.profiles(id,first_name,last_name,gender,birth_date) values(new.id,coalesce(new.raw_user_meta_data->>'first_name','Player'),coalesce(new.raw_user_meta_data->>'last_name',''),nullif(new.raw_user_meta_data->>'gender','')::public.gender_type,nullif(new.raw_user_meta_data->>'birth_date','')::date); insert into public.profile_private(user_id,phone) values(new.id,new.raw_user_meta_data->>'phone'); insert into public.user_roles(user_id) values(new.id); return new; end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function private.handle_new_user();

create function public.accept_match_join_request(p_request_id uuid) returns void language plpgsql security definer set search_path='' as $$ declare r public.match_join_requests; m public.matches; begin select * into r from public.match_join_requests where id=p_request_id for update; if not found or r.status<>'pending' then raise exception 'request_not_pending'; end if; select * into m from public.matches where id=r.match_id for update; if m.host_id<>auth.uid() then raise exception 'not_authorized'; end if; if m.status not in ('open','full') or m.participant_count>=m.max_players then raise exception 'match_full_or_closed'; end if; insert into public.match_participants(match_id,user_id) values(m.id,r.user_id) on conflict do nothing; if not found then raise exception 'already_participant'; end if; update public.match_join_requests set status='accepted',responded_at=now() where id=r.id; update public.matches set participant_count=participant_count+1,status=case when participant_count+1>=max_players then 'full'::public.match_status else 'open'::public.match_status end where id=m.id; insert into public.notifications(recipient_id,actor_id,type,title,match_id) values(r.user_id,auth.uid(),'join_accepted','Your join request was accepted',m.id); end $$;
revoke all on function public.accept_match_join_request(uuid) from public,anon; grant execute on function public.accept_match_join_request(uuid) to authenticated;

create function public.accept_friend_request(p_request_id uuid) returns void language plpgsql security definer set search_path='' as $$ declare r public.friend_requests; a uuid; b uuid; begin select * into r from public.friend_requests where id=p_request_id for update; if not found or r.status<>'pending' or r.recipient_id<>auth.uid() then raise exception 'invalid_friend_request'; end if; a=least(r.sender_id,r.recipient_id);b=greatest(r.sender_id,r.recipient_id);insert into public.friendships(user_id,friend_id) values(a,b) on conflict do nothing;update public.friend_requests set status='accepted' where id=r.id;insert into public.notifications(recipient_id,actor_id,type,title,profile_id) values(r.sender_id,auth.uid(),'friend_accepted','Your friend request was accepted',auth.uid());end $$;
revoke all on function public.accept_friend_request(uuid) from public,anon; grant execute on function public.accept_friend_request(uuid) to authenticated;

create function private.validate_rating() returns trigger language plpgsql security definer set search_path='' as $$ begin if not exists(select 1 from public.matches m where m.id=new.match_id and m.status='completed' and private.is_match_member(m.id,new.rater_id) and private.is_match_member(m.id,new.rated_user_id)) then raise exception 'rating_not_eligible';end if;return new;end $$;
create trigger validate_rating before insert or update on public.player_ratings for each row execute function private.validate_rating();
create function private.refresh_rating() returns trigger language plpgsql security definer set search_path='' as $$ declare target uuid:=coalesce(new.rated_user_id,old.rated_user_id); begin update public.profiles p set average_rating=coalesce((select round(avg(rating)::numeric,2) from public.player_ratings where rated_user_id=target),0),rating_count=(select count(*) from public.player_ratings where rated_user_id=target) where id=target;return coalesce(new,old);end $$;
create trigger rating_aggregate after insert or update or delete on public.player_ratings for each row execute function private.refresh_rating();

alter table public.profiles enable row level security; alter table public.profile_private enable row level security; alter table public.user_roles enable row level security; alter table public.matches enable row level security; alter table public.match_join_requests enable row level security; alter table public.match_participants enable row level security; alter table public.match_messages enable row level security; alter table public.friend_requests enable row level security; alter table public.friendships enable row level security; alter table public.player_ratings enable row level security; alter table public.feedback enable row level security; alter table public.notifications enable row level security; alter table public.activity_logs enable row level security;

create policy profiles_public_read on public.profiles for select to authenticated using(status='active' or id=auth.uid() or private.is_admin());
create policy profiles_own_update on public.profiles for update to authenticated using(id=auth.uid()) with check(id=auth.uid());
create policy profile_private_own_read on public.profile_private for select to authenticated using(user_id=auth.uid() or private.is_admin());
create policy profile_private_own_update on public.profile_private for update to authenticated using(user_id=auth.uid() or private.is_admin()) with check(user_id=auth.uid() or private.is_admin());
create policy roles_own_read on public.user_roles for select to authenticated using(user_id=auth.uid() or private.is_admin());
create policy matches_read on public.matches for select to authenticated using(status<>'draft' or host_id=auth.uid() or private.is_admin());
create policy matches_create on public.matches for insert to authenticated with check(host_id=auth.uid() and exists(select 1 from public.profiles where id=auth.uid() and status='active'));
create policy matches_host_update on public.matches for update to authenticated using(host_id=auth.uid() or private.is_admin()) with check(host_id=auth.uid() or private.is_admin());
create policy matches_host_delete on public.matches for delete to authenticated using(host_id=auth.uid() or private.is_admin());
create policy requests_involved_read on public.match_join_requests for select to authenticated using(user_id=auth.uid() or exists(select 1 from public.matches m where m.id=match_id and m.host_id=auth.uid()) or private.is_admin());
create policy requests_user_create on public.match_join_requests for insert to authenticated with check(user_id=auth.uid() and status='pending' and not exists(select 1 from public.matches m where m.id=match_id and (m.host_id=auth.uid() or m.status not in('open','full') or m.participant_count>=m.max_players)) and not exists(select 1 from public.match_participants p where p.match_id=match_id and p.user_id=auth.uid() and p.removed_at is null));
create policy requests_user_cancel on public.match_join_requests for update to authenticated using(user_id=auth.uid() and status='pending') with check(user_id=auth.uid() and status='cancelled');
create policy participants_member_read on public.match_participants for select to authenticated using(private.is_match_member(match_id) or private.is_admin());
create policy participants_self_leave on public.match_participants for update to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid() and removed_at is not null);
create policy messages_member_read on public.match_messages for select to authenticated using(private.is_match_member(match_id));
create policy messages_member_create on public.match_messages for insert to authenticated with check(sender_id=auth.uid() and private.is_match_member(match_id));
create policy messages_own_update on public.match_messages for update to authenticated using(sender_id=auth.uid()) with check(sender_id=auth.uid());
create policy messages_own_delete on public.match_messages for delete to authenticated using(sender_id=auth.uid() or private.is_admin());
create policy friend_requests_involved_read on public.friend_requests for select to authenticated using(sender_id=auth.uid() or recipient_id=auth.uid());
create policy friend_requests_send on public.friend_requests for insert to authenticated with check(sender_id=auth.uid() and recipient_id<>auth.uid() and not exists(select 1 from public.friendships where (user_id=least(auth.uid(),recipient_id) and friend_id=greatest(auth.uid(),recipient_id))));
create policy friend_requests_involved_update on public.friend_requests for update to authenticated using(sender_id=auth.uid() or recipient_id=auth.uid()) with check(sender_id=auth.uid() or recipient_id=auth.uid());
create policy friendships_involved_read on public.friendships for select to authenticated using(user_id=auth.uid() or friend_id=auth.uid());
create policy friendships_involved_delete on public.friendships for delete to authenticated using(user_id=auth.uid() or friend_id=auth.uid());
create policy ratings_read on public.player_ratings for select to authenticated using(true);
create policy ratings_own_create on public.player_ratings for insert to authenticated with check(rater_id=auth.uid());
create policy ratings_own_update on public.player_ratings for update to authenticated using(rater_id=auth.uid()) with check(rater_id=auth.uid());
create policy ratings_own_delete on public.player_ratings for delete to authenticated using(rater_id=auth.uid());
create policy feedback_own_read on public.feedback for select to authenticated using(user_id=auth.uid() or private.is_admin());
create policy feedback_own_create on public.feedback for insert to authenticated with check(user_id=auth.uid());
create policy feedback_admin_update on public.feedback for update to authenticated using(private.is_admin()) with check(private.is_admin());
create policy feedback_admin_delete on public.feedback for delete to authenticated using(private.is_admin());
create policy notifications_recipient_read on public.notifications for select to authenticated using(recipient_id=auth.uid());
create policy notifications_recipient_update on public.notifications for update to authenticated using(recipient_id=auth.uid()) with check(recipient_id=auth.uid());
create policy activity_admin_read on public.activity_logs for select to authenticated using(private.is_admin());

revoke all on all tables in schema public from anon,authenticated;
grant select on public.profiles,public.profile_private,public.user_roles,public.matches,public.match_join_requests,public.match_participants,public.match_messages,public.friend_requests,public.friendships,public.player_ratings,public.feedback,public.notifications,public.activity_logs to authenticated;
grant update on public.profiles,public.profile_private,public.matches,public.match_join_requests,public.match_participants,public.match_messages,public.friend_requests,public.player_ratings,public.feedback,public.notifications to authenticated;
grant insert on public.matches,public.match_join_requests,public.match_messages,public.friend_requests,public.player_ratings,public.feedback to authenticated;
grant delete on public.matches,public.match_messages,public.friendships,public.player_ratings to authenticated;
grant usage,select on sequence public.activity_logs_id_seq to authenticated;

create view public.match_discovery with(security_invoker=true) as select m.*,p.first_name||' '||p.last_name host_name,p.profile_image_path host_avatar_url,m.cover_image_path cover_url,to_tsvector('simple',m.title||' '||m.location||' '||m.sport) search_document from public.matches m join public.profiles p on p.id=m.host_id where m.status in('open','full','completed','cancelled');
grant select on public.match_discovery to authenticated;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('avatars','avatars',true,5242880,array['image/jpeg','image/png','image/webp']),('match-covers','match-covers',true,5242880,array['image/jpeg','image/png','image/webp']) on conflict(id) do update set file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
create policy images_public_read on storage.objects for select to public using(bucket_id in('avatars','match-covers'));
create policy avatar_owner_insert on storage.objects for insert to authenticated with check(bucket_id='avatars' and (storage.foldername(name))[1]=auth.uid()::text);
create policy avatar_owner_update on storage.objects for update to authenticated using(bucket_id='avatars' and owner_id=auth.uid()::text) with check(bucket_id='avatars' and owner_id=auth.uid()::text);
create policy avatar_owner_delete on storage.objects for delete to authenticated using(bucket_id='avatars' and owner_id=auth.uid()::text);
create policy match_cover_host_insert on storage.objects for insert to authenticated with check(bucket_id='match-covers' and exists(select 1 from public.matches m where m.id::text=(storage.foldername(name))[1] and m.host_id=auth.uid()));
create policy match_cover_host_update on storage.objects for update to authenticated using(bucket_id='match-covers' and exists(select 1 from public.matches m where m.id::text=(storage.foldername(name))[1] and (m.host_id=auth.uid() or private.is_admin())));
create policy match_cover_host_delete on storage.objects for delete to authenticated using(bucket_id='match-covers' and exists(select 1 from public.matches m where m.id::text=(storage.foldername(name))[1] and (m.host_id=auth.uid() or private.is_admin())));

alter publication supabase_realtime add table public.match_messages;
