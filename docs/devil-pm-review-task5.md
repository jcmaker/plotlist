# Devil-PM Review — Task 5: Share Link & Public Playlist Page

## What was built

- `app/share/[handle]/[slug].tsx` — public playlist page, no auth required
- `src/lib/shareService.ts` — `getPublicPlaylistPage`, `buildShareUrl`
- `EXPO_PUBLIC_SHARE_BASE_URL` env var in `.env.example`
- Share button in Playlist Detail — uses React Native `Share` sheet
- Auth guard updated to allow `/share/*` without login redirect
- Private playlists blocked: client check + RLS `playlist_movies_select` policy

---

## Risks accepted

**RLS depends on a manual Supabase migration.**
The `playlist_movies_select` policy (added in Task 4.5 prep) must be applied in the Supabase dashboard before the share page works for unauthenticated visitors. There is no automated migration system. A developer who skips this step will see 0 movies on every share page without an obvious error.

*Mitigation: SQL is in `docs/supabase-setup.sql` and flagged explicitly in Task 4.5 notes.*

**`buildShareUrl` reads `EXPO_PUBLIC_SHARE_BASE_URL` at call time, not module load time.**
In Expo, `process.env.EXPO_PUBLIC_*` variables are inlined at bundle time. If the env var is absent, the function falls back to `http://localhost:8081`, which would produce broken share links in production builds where the env var was forgotten.

*Mitigation: The `.env.example` and Getting Started docs call this out. No silent behavior — the URL will be obviously wrong.*

**No rate limiting on the public share route.**
Any visitor can load any public/unlisted playlist page. With a large playlist of movies, each page load fetches playlist + creator profile + all playlist_movies rows. No caching, no pagination.

*Acceptable for MVP: the Supabase free tier handles low traffic. Pagination is a Task 6+ concern.*

**`handle` and `slug` route params are passed as-is to Supabase queries.**
They are used as filter values (not interpolated into SQL), so SQL injection is not a risk. But a malformed or very long handle/slug will result in a Supabase 400 or no-match, which is surfaced as "Playlist not found" — correct behavior.

---

## Deferred scope (confirmed out of Task 5)

- SEO meta tags (`og:title`, `og:image`) — deferred to Task 6
- Native share sheet polish (custom message, subject line) — deferred to Task 6
- Pagination on the share page movie list — Post-MVP
- View analytics (how many times a share link was opened) — Post-MVP

---

## What could still break

1. **Supabase `profiles` table SELECT policy** — `getPublicPlaylistPage` fetches a profile by handle without auth. If the `profiles` table has no public select policy, this will fail silently (no creator = no page). The `profiles_select_public` policy must allow unauthenticated reads of `handle` and `full_name`.

2. **`slug` collisions across users** — slugs are only unique per-user. Two users with the same handle and playlist slug would be impossible (handles are unique), but the query doesn't assert this. If Supabase returns multiple rows, `maybeSingle()` will throw "multiple rows returned." Handles are enforced unique at the DB level, so this is not a real risk — but it's worth noting.

3. **Very long movie lists** — no pagination. A 500-movie playlist will load all rows in one query. Acceptable for MVP playlists but worth monitoring.
