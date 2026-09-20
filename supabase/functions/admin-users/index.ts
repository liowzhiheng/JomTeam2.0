import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { allowedOrigin, corsHeaders, json } from '../_shared/http.ts';

Deno.serve(async (request) => {
  const origin = allowedOrigin(request);
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders(origin) });
  if (request.method !== 'POST') return json({ error: { code: 'method_not_allowed', message: 'POST required' } }, 405, origin);
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) return json({ error: { code: 'unauthorized', message: 'Authentication required' } }, 401, origin);
    const url = Deno.env.get('SUPABASE_URL')!; const publishable = Deno.env.get('SUPABASE_ANON_KEY')!; const serviceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const callerClient = createClient(url, publishable, { global: { headers: { Authorization: authHeader } } });
    const { data: { user }, error: userError } = await callerClient.auth.getUser();
    if (userError || !user) return json({ error: { code: 'unauthorized', message: 'Invalid session' } }, 401, origin);
    const admin = createClient(url, serviceRole, { auth: { persistSession: false } });
    const { data: role } = await admin.from('user_roles').select('role').eq('user_id', user.id).single();
    if (role?.role !== 'admin') return json({ error: { code: 'forbidden', message: 'Administrator access required' } }, 403, origin);
    const body = await request.json(); const targetUserId = String(body.userId ?? ''); const action = String(body.action ?? '');
    if (!/^[0-9a-f-]{36}$/i.test(targetUserId) || !['set_role','set_status','delete'].includes(action)) return json({ error: { code: 'invalid_input', message: 'Invalid action or user ID' } }, 400, origin);
    if (targetUserId === user.id && action === 'delete') return json({ error: { code: 'invalid_operation', message: 'Use self-service account deletion' } }, 409, origin);
    if (action === 'set_role') { const roleValue = body.role === 'admin' ? 'admin' : 'user'; const { error } = await admin.from('user_roles').update({ role: roleValue }).eq('user_id', targetUserId); if (error) throw error; }
    if (action === 'set_status') { const status = body.status === 'deactivated' ? 'deactivated' : 'active'; const { error } = await admin.from('profiles').update({ status }).eq('id', targetUserId); if (error) throw error; if (status === 'deactivated') await admin.auth.admin.signOut(targetUserId, 'global'); }
    if (action === 'delete') { const { error } = await admin.auth.admin.deleteUser(targetUserId); if (error) throw error; }
    await admin.from('activity_logs').insert({ actor_id: user.id, action: `admin_${action}`, entity_type: 'user', entity_id: targetUserId });
    return json({ data: { ok: true } }, 200, origin);
  } catch { return json({ error: { code: 'internal_error', message: 'The operation could not be completed' } }, 500, origin); }
});
