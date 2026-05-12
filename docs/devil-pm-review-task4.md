# devil-pm Review — Task 4: Movie Search & Add to Playlist

**Date:** 2026-05-12
**Reviewer:** devil-pm
**Scope:** Task 4 — TMDB search, add movie to playlist, display in detail, remove, rating/note

---

## MVP Scope Check

| Item | Verdict | Reason |
|---|---|---|
| TMDB search with 300ms debounce | ✅ Required | Core feature |
| Search results: poster, title, year, overview | ✅ Required | Core feature |
| Entry point: Playlist Detail → "+ Add Movie" | ✅ Required | Correct flow (A안) |
| `movie_cache` upsert on add | ✅ Required | Avoids redundant TMDB calls |
| `playlist_movies` insert with RLS | ✅ Required | Core data layer |
| Display movies in Playlist Detail | ✅ Required | Core feature |
| Remove movie with confirmation | ✅ Required | Core feature |
| Personal rating (1–10) + note | ✅ Required | Core annotation feature |
| Duplicate add → friendly error | ✅ Required | DB has unique constraint; error surfaced to user |
| First movie poster as cover | ✅ Bonus | Good UX, zero added complexity |
| Drag reorder | ❌ Deferred | Correct — needs drag library |
| Global search tab | ❌ Deferred | Correct — not needed for MVP |
| Playlist selection modal | ❌ Deferred | Correct — A안 flow pre-selects playlist |

**Scope verdict: PASS.**

---

## Unnecessary Complexity Check

**`useFocusEffect` in PlaylistDetailScreen calls both `refetchPlaylist` and `refetchMovies`**
- Classification: **Acceptable**
- Two separate hooks, two refetches on focus. Could be combined into one hook, but this is not worth abstracting at current scale.

**Modal for rating/note instead of dedicated screen**
- Classification: **Good call**
- A dedicated `/playlist/:id/movie/:movieId/edit` screen would add a route and navigation overhead for a two-field form. The modal is simpler and equally functional.

**`getPlaylistMovies` uses JOIN select (`movie_cache(*)`)**
- Classification: **Correct**
- PostgREST FK join is the right pattern. No N+1 query; one request returns movies with cache data.

---

## Missing Risks

### Risk 1 — TMDB API key exposed in mobile bundle
- **Severity:** Accepted / by design
- `EXPO_PUBLIC_TMDB_API_KEY` is a read-only v3 API key. TMDB explicitly states this key is safe for client-side use. The `.env.example` note confirms this. Not a vulnerability.

### Risk 2 — No loading indicator while movies are fetching independently
- **Severity:** Minor
- `playlistLoading || moviesLoading` shows a single spinner. If playlist loads fast but movies are slow, the user sees a brief flash of "no movies yet" before movies appear. Acceptable for MVP.

### Risk 3 — `movie_cache` UPDATE policy allows any authenticated user to overwrite any cached entry
- **Severity:** Minor / Accepted for MVP
- The upsert can overwrite another user's cache entry. Since `movie_cache` is read-only reference data from TMDB (no user-specific data), there's no meaningful security risk. The worst case is a stale cache entry gets refreshed earlier than needed.

### Risk 4 — No empty state when TMDB key is missing
- **Severity:** Minor
- `searchMovies` returns `{ error: 'TMDB API key not configured.' }` which surfaces in the UI as a red error text. Good enough for development. In production, the key should always be set.

### Risk 5 — Rating/note modal doesn't scroll on small screens with keyboard open
- **Severity:** Minor
- `KeyboardAvoidingView` wraps the modal on iOS. On Android, behavior is `undefined`. On very small screens, the note textarea may be partially obscured. Acceptable for MVP; the note field is short (max 300 chars).

---

## What Went Well

- **`src/lib/tmdb.ts` is isolated** — no TMDB logic leaks into components or hooks.
- **`playlistMovieService.ts` follows `playlistService.ts` conventions** — same `rowToXxx` mapping pattern, same `{ data, error }` return shape.
- **`usePlaylistMovies` follows `usePlaylists` pattern** — `useCallback + useEffect`, exposes `refetch`.
- **Duplicate movie add** handled at the DB level (unique constraint) and surfaced gracefully in the UI.
- **RLS policies use EXISTS subquery** — correct pattern; doesn't require a `user_id` column on `playlist_movies` for the select policy (ownership is inferred through `playlists.user_id`). The `user_id` column is still present on insert for audit purposes.
- **`useFocusEffect` in the detail screen** — movies refresh automatically after returning from add-movie screen without any manual coordination.

---

## Next Priority Recommendation

**Task 5: Share Link & Public Playlist Page**

Pre-conditions (all met):
- Auth works ✓
- Playlists CRUD works ✓
- Movies in playlists work ✓
- `playlists_select_public_unlisted` RLS policy already added in Task 3 ✓
- `movie_cache` SELECT is public (no auth required) ✓

**Decisions before Task 5:**
1. **Share URL format:** `/share/[handle]/[slug]` — requires fetching profile by handle AND playlist by slug.
2. **Web output:** Expo web (`expo export --platform web`) — already configured in `app.json`.
3. **No auth required** on the share page — anonymous users can view public/unlisted playlists.
4. **"Copy Link" button** on Playlist Detail — use `expo-clipboard` or `Share` API.
