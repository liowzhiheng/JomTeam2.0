export const corsHeaders = (origin: string) => ({
  'Access-Control-Allow-Origin': origin,
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Vary': 'Origin'
});
export const json = (body: unknown, status: number, origin: string) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' } });
export const allowedOrigin = (request: Request) => {
  const origin = request.headers.get('origin') ?? '';
  const allowed = (Deno.env.get('ALLOWED_ORIGINS') ?? 'http://localhost:4200').split(',').map(v => v.trim());
  return allowed.includes(origin) ? origin : allowed[0];
};
