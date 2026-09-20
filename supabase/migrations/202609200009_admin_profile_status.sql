create policy profiles_admin_update
on public.profiles
for update
to authenticated
using (private.is_admin())
with check (private.is_admin());
