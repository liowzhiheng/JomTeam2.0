import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const required = ['SUPABASE_URL', 'SUPABASE_PUBLISHABLE_KEY', 'APP_URL'];
const missing = required.filter((name) => !process.env[name]?.trim());
if (missing.length) {
  throw new Error(`Missing production configuration: ${missing.join(', ')}`);
}

const supabaseUrl = new URL(process.env.SUPABASE_URL);
const appUrl = new URL(process.env.APP_URL);
if (supabaseUrl.protocol !== 'https:' || appUrl.protocol !== 'https:') {
  throw new Error('Production URLs must use HTTPS.');
}

const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY.trim();
if (publishableKey.includes('your-') || publishableKey.length < 20) {
  throw new Error('SUPABASE_PUBLISHABLE_KEY is still a placeholder or is invalid.');
}

const output = `export const environment = ${JSON.stringify(
  {
    production: true,
    supabaseUrl: supabaseUrl.toString().replace(/\/$/, ''),
    supabasePublishableKey: publishableKey,
    appUrl: appUrl.toString(),
  },
  null,
  2,
)} as const;\n`;

writeFileSync(
  fileURLToPath(new URL('../src/environments/environment.production.ts', import.meta.url)),
  output,
);
console.log('Production environment configured.');
