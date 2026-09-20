# JomTeam architecture

## Client

- Angular 22 standalone components, strict TypeScript, signals, reactive forms, SCSS, and lazy routes.
- Feature areas: auth, home, matches, dashboard, history, profile, friends, chat, ratings, feedback, notifications, settings, and admin.
- `core/` owns Supabase sessions, repositories, models, and guards. Feature components do not perform privileged operations.
- Hash routing makes deep links safe on GitHub Pages. Development and production environments hold public connection placeholders only.

## Data and security

- Supabase Auth owns credentials and sessions.
- PostgreSQL is normalized around profiles, roles, matches, participation, friends, ratings, feedback, notifications, and activity logs.
- Explicit grants plus RLS form the authorization boundary. The browser is never trusted to approve joins, set roles, forge notifications, or exceed capacity.
- Transactional functions lock match/request rows during acceptance and canonicalize friendship pairs.
- Storage paths are owner-scoped; image buckets allow JPEG, PNG, and WebP up to 5 MB.
- Edge Functions isolate Auth Admin API calls and account deletion. The service-role key stays in Supabase-managed secrets.

## Performance

- Match discovery is server-filtered and paginated through an indexed security-invoker view.
- Composite indexes cover match discovery, user history, chat pagination, pending requests, ratings, notifications, and activity.
- Realtime subscribes once per active chat page and unsubscribes on destroy.
