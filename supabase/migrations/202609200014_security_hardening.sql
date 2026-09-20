do $$
declare
  policy_row record;
  statement text;
begin
  for policy_row in
    select schemaname, tablename, policyname, qual, with_check
    from pg_policies
    where schemaname in ('public', 'storage')
      and (qual like '%auth.uid()%' or with_check like '%auth.uid()%')
  loop
    statement := format('alter policy %I on %I.%I', policy_row.policyname, policy_row.schemaname, policy_row.tablename);
    if policy_row.qual is not null then
      statement := statement || format(' using (%s)', replace(policy_row.qual, 'auth.uid()', '(select auth.uid())'));
    end if;
    if policy_row.with_check is not null then
      statement := statement || format(' with check (%s)', replace(policy_row.with_check, 'auth.uid()', '(select auth.uid())'));
    end if;
    execute statement;
  end loop;

  if to_regprocedure('public.rls_auto_enable()') is not null then
    execute 'revoke all on function public.rls_auto_enable() from public, anon, authenticated';
  end if;
end
$$;

drop policy if exists profiles_own_update on public.profiles;
drop policy if exists profiles_admin_update on public.profiles;
create policy profiles_owner_or_admin_update
on public.profiles
for update
to authenticated
using (id = (select auth.uid()) or private.is_admin())
with check (id = (select auth.uid()) or private.is_admin());
