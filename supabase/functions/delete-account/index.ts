import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { allowedOrigin, corsHeaders, json } from '../_shared/http.ts';

Deno.serve(async (request) => {
  const origin = allowedOrigin(request);
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders(origin) });
  if (request.method !== 'POST') return json({ error: { code: 'method_not_allowed', message: 'POST required' } }, 405, origin);
  try {
    const authHeader = request.headers.get('Authorization'); if (!authHeader) return json({ error: { code: 'unauthorized', message: 'Authentication required' } }, 401, origin);
    const body = await request.json(); if (body.confirmation !== 'DELETE MY ACCOUNT') return json({ error: { code: 'confirmation_required', message: 'Type the confirmation phrase' } }, 400, origin);
    const url = Deno.env.get('SUPABASE_URL')!; const anon = Deno.env.get('SUPABASE_ANON_KEY')!; const serviceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const caller = createClient(url, anon, { global: { headers: { Authorization: authHeader } } }); const { data: { user }, error } = await caller.auth.getUser();
    if (error || !user) return json({ error: { code: 'unauthorized', message: 'Invalid session' } }, 401, origin);
    if (!user.last_sign_in_at || Date.now() - new Date(user.last_sign_in_at).getTime() > 15 * 60 * 1000) return json({ error: { code: 'recent_auth_required', message: 'Sign in again before deleting your account' } }, 403, origin);
    const admin = createClient(url, serviceRole, { auth: { persistSession: false } });
    const { data: role, error: roleError } = await admin.from('user_roles').select('role').eq('user_id', user.id).maybeSingle();
    if (roleError) throw roleError;
    if (role?.role === 'admin') return json({ error: { code: 'protected_admin', message: 'Administrator accounts cannot be deleted here' } }, 403, origin);
    const { data: profile, error: profileError } = await admin.from('profiles').select('profile_image_path').eq('id', user.id).single();
    if (profileError) throw profileError;
    const { data: coverPaths, error: prepareError } = await admin.rpc('prepare_user_deletion', { p_user_id: user.id });
    if (prepareError) throw prepareError;
    if (profile.profile_image_path) await admin.storage.from('avatars').remove([profile.profile_image_path]);
    if (coverPaths?.length) await admin.storage.from('match-covers').remove(coverPaths);
    const { error: deleteError } = await admin.auth.admin.deleteUser(user.id); if (deleteError) throw deleteError;
    return json({ data: { deleted: true } }, 200, origin);
  } catch { return json({ error: { code: 'internal_error', message: 'Account deletion could not be completed' } }, 500, origin); }
});
