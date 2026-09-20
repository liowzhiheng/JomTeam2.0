# JomTeam

JomTeam is a sports matchmaking and community app for Malaysia. Players can discover activities, create matches, request places, manage participants, make friends, chat with accepted teammates, rate players after completed matches, and submit platform feedback. Administrators have a separate protected management area.

## Stack

- Angular 22, standalone components, Angular Router, reactive forms, signals, strict TypeScript, SCSS, Angular CDK, and Font Awesome
- Supabase Auth, PostgreSQL, Storage, Realtime, Edge Functions, RLS, migrations, and local CLI
- GitHub Pages with hash routing and GitHub Actions

See [ARCHITECTURE.md](ARCHITECTURE.md) for the design, trust boundaries, and query strategy.

## Project structure

```text
src/app/core/        sessions, guards, models, repositories
src/app/features/    lazy product areas
src/app/shared/      shell and reusable match UI
src/environments/    public frontend configuration
supabase/migrations/ schema, grants, RLS, Storage, functions, triggers
supabase/functions/  privileged Auth and deletion operations
supabase/tests/      pgTAP database/RLS checks
.github/workflows/   GitHub Pages deployment
```

## Local development

Requirements: Node.js 22+, npm, Docker Desktop, and the Supabase CLI.

```bash
npm install
npx supabase start
npx supabase db reset
npm start
```

Angular runs at `http://localhost:4200`; local Supabase Studio is printed by `supabase start`. `db reset` applies every migration and loads `supabase/seed.sql`.

Generate database types after schema changes:

```bash
npm run types:generate
```

Serve Edge Functions locally:

```bash
npx supabase functions serve --env-file supabase/.env.local
```

Set `ALLOWED_ORIGINS` in `supabase/.env.local`. Supabase injects its URL and service-role secret into hosted functions; never place the service-role key in Angular, GitHub Actions, or committed files.

## Public environment values

Copy `.env.example` as a reference. Local development values live in `src/environments/environment.ts`; production values are generated during deployment from GitHub Repository Variables:

- `SUPABASE_PROJECT_ID`
- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`

The Pages workflow computes `APP_URL` from the GitHub owner and repository name. It stops before building if either required Repository Variable is missing or invalid.

The publishable key is safe in the browser because grants and RLS enforce authorization. Never commit the database password, JWT secret, access token, secret key, or service-role key.

## Test accounts

Local seed password for all accounts: `JomTeam123!`

| Account                | Role          |
| ---------------------- | ------------- |
| `admin@jomteam.local`  | Administrator |
| `aina@jomteam.local`   | Regular user  |
| `harith@jomteam.local` | Regular user  |
| `joanne@jomteam.local` | Regular user  |

These are local-only credentials and must never be loaded into production.

## Quality checks

```bash
npm run lint
npm run typecheck
npm test
npx supabase test db
npm run build
```

The database suite checks core objects and policy coverage. Add API-level allow/deny cases as business rules evolve. Edge Functions can be tested with Deno (`deno test`) once a local Supabase instance is running.

## Supabase Cloud setup

1. Create a free project in **Supabase Dashboard → New project**.
2. In **Project Settings → Data API**, keep the Data API on, automatic table exposure off, and automatic RLS on. Migrations explicitly grant each operation.
3. Link and deploy: `npx supabase login`, `npx supabase link --project-ref YOUR_PROJECT_ID`, then `npx supabase db push`.
4. In **Authentication → URL Configuration**, set Site URL to `https://USERNAME.github.io/REPOSITORY_NAME/`. Add the same URL with `**` as a redirect URL so confirmation, email-change, and password-reset links return to hash routes.
5. In **Authentication → Providers → Email**, enable email/password and confirmation. Free built-in email is suitable for testing; production deliverability may require external SMTP.
6. Deploy functions: `npx supabase functions deploy admin-users` and `npx supabase functions deploy delete-account`.
7. Set `ALLOWED_ORIGINS` with `npx supabase secrets set ALLOWED_ORIGINS=https://USERNAME.github.io`.
8. In **Database → Replication**, verify `match_messages` is in the `supabase_realtime` publication.
9. Create the first account normally, then promote it once from SQL Editor: `update public.user_roles set role='admin' where user_id='USER_UUID';`. Verify `/admin` is available after signing in again.

Migrations create both Storage buckets and all policies. Verify in **Storage** that `avatars` and `match-covers` exist, accept only JPEG/PNG/WebP, and show a 5 MB limit.

## GitHub Pages deployment

1. Push the repository to GitHub.
2. In **Repository Settings → Secrets and variables → Actions → Variables**, add `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY`. These are public browser configuration values; never add the service-role key.
3. In **Repository Settings → Pages → Build and deployment**, choose **GitHub Actions**.
4. Push `main` or run **Actions → Deploy JomTeam to GitHub Pages → Run workflow**.
5. The workflow starts a clean Supabase test database, applies every migration, runs the pgTAP database suite, validates the production variables, generates the Angular production environment, installs from the lockfile, lints, type-checks, tests, builds with the repository base path, and deploys `dist/jomteam-app/browser`.
6. Open `https://USERNAME.github.io/REPOSITORY_NAME/#/login` and verify registration, confirmation, password reset, and login redirects.

## Data access overview

- Public profiles and private phone data are split into separate tables; the private table is owner/admin-only.
- Draft matches are host/admin-only. Creation and edits require ownership.
- Join requests are visible only to applicants, hosts, and admins. Acceptance uses a row-locking RPC so concurrent approvals cannot exceed capacity.
- Chat is available only to the host and accepted, non-removed participants.
- Friend requests and friendships are visible only to involved users.
- Rating writes require a shared completed match and are unique per rater/target/match.
- Feedback is owner/admin-only. Notifications are recipient-only and cannot be inserted by browser roles.
- Role changes, deactivation, admin deletion, and self-deletion use authenticated Edge Functions.

## Free-plan notes and known limitations

- Supabase free projects may pause after inactivity and have limited database, storage, egress, Realtime, and Edge Function quotas. The app uses pagination, indexed filters, bounded uploads, and page-scoped subscriptions to control usage.
- Free projects do not include paid backups, point-in-time recovery, custom domains, paid image transforms, or production email delivery guarantees.
- The repository contains production-ready security foundations and connected client repositories, but a live end-to-end verification requires a linked Supabase project and its public values.
- Self-service account deletion requires the current password plus an exact confirmation phrase. It removes personal/profile data, cancels active hosted matches, and retains completed or cancelled match history under “Deleted user”. Protected administrator accounts cannot delete themselves in the app.
