# devil-pm Review — Task 3: Playlists CRUD

**Date:** 2026-05-12
**Reviewer:** devil-pm
**Scope:** Task 3 — playlist create, list, detail, edit, delete, slug generation

---

## MVP Scope Check

| Item | Verdict | Reason |
|---|---|---|
| Create playlist (title, desc, slug, visibility) | ✅ Required | Core feature |
| List user's playlists | ✅ Required | Core feature |
| Playlist detail screen | ✅ Required | Core feature |
| Edit playlist | ✅ Required | Core feature |
| Delete playlist with confirmation | ✅ Required | Core feature |
| Slug auto-generation + conflict resolution | ✅ Required | Share URLs need stable slugs |
| Refetch-on-focus with `useFocusEffect` | ✅ Required | Without this, list is stale after create/delete |
| `playlists_select_public_unlisted` RLS policy | ✅ Justified | Added now for Task 5 share page; deferring would require policy change under traffic |
| Playlist reordering | ❌ Deferred | Correct — needs drag library, not critical for MVP |
| Cover image upload | ❌ Deferred | Correct — will use first movie poster in Task 4 |

**Scope verdict: PASS.**

---

## Unnecessary Complexity Check

**`resolveUniqueSlug` loops up to 20 attempts**
- Classification: **Minor / Acceptable**
- 20 DB round-trips in the worst case. In practice this never hits more than 1-2 for typical usage. For 1000 users each with 20 playlists named "My List", it loops. For an MVP, fine.
- If this becomes a problem at scale: do the conflict check in a single SQL query using a `generate_series` window. Not needed now.

**`isSlugTaken` makes a DB call per attempt**
- Classification: **Minor / Acceptable**
- Same reasoning as above. One call is the common case.

**Three separate hooks (`usePlaylists`, `usePlaylist`, `useProfile`) all follow the same pattern**
- Classification: **Minor / Overengineering risk**
- The pattern is `useCallback(fetch, [deps])` + `useEffect([fetchFn])`. This is clean and idiomatic. NOT overengineering at 3 hooks — it would be at 10.

---

## Missing Risks

### Risk 1 — Stale list after edit (not just create/delete)
- **Severity:** Minor
- `useFocusEffect` refetches the list on every focus, including after edit. This is correct. However, if the user edits a playlist and immediately goes back to the list, they'll briefly see the old data while refetch is in flight. The loading indicator covers this. Acceptable.

### Risk 2 — Slug warning not enforced on edit
- **Severity:** Minor
- The edit screen shows "Changing the slug will break existing share links." but doesn't prevent the change. Correct behavior — just a UX note. At this stage, no users have shared links yet, so the risk is zero.

### Risk 3 — `router.replace` used after create vs `router.push`
- **Severity:** Minor / Intentional
- After creating a playlist, `router.replace('/playlist/:id')` is used so the back button from the detail screen goes to the list, not back to the new form. This is correct UX. 

### Risk 4 — No optimistic update after delete
- **Severity:** Minor
- Delete calls Supabase, awaits the response, then navigates. On slow networks, the user sees no feedback for 1-3 seconds after tapping "Delete". The Alert confirmation is still visible during this. Adding a loading state to the delete button is a minor polish item. Not urgent.

### Risk 5 — `sort_order` is always 0 on create
- **Severity:** Minor
- All playlists are created with `sort_order = 0`. The ordering falls back to `created_at DESC`. This is fine until reordering is implemented (Task 6 / polish). No risk to data integrity.

---

## What Went Well

- **`playlistService.ts` centralizes all DB calls** — screens import from the service, not from Supabase directly. This is the right pattern for maintainability.
- **`rowToPlaylist` exported and reused** — no snake_case/camelCase mismatch bugs possible; single mapping function.
- **Static route `playlist/new.tsx` takes priority over `[id]/`** — Expo Router resolves this correctly; no hacks needed.
- **Edit screen waits for `initialized`** — prevents a flash of empty fields before the playlist data loads. Correct.
- **All queries scoped to `user_id`** — even without RLS, the client wouldn't fetch other users' playlists. Defence in depth.

---

## Next Priority Recommendation

**Task 4: Movie Search + Add to Playlist (TMDB)**

Pre-conditions (all met):
- Auth works ✓
- Playlists CRUD works ✓
- `playlist_movies` table is designed in `database-schema.md`
- TMDB API key is already in `.env.example`

**Decisions before Task 4:**
1. **TMDB search debounce:** 300–500ms. Don't search on every keystroke.
2. **Movie poster display:** Use `https://image.tmdb.org/t/p/w500{poster_path}`. Cache the URL in `movie_cache` table.
3. **"Add to which playlist?" flow:** User searches → taps a movie → modal or screen asks which playlist → adds it. OR: user is already in a playlist detail screen and taps "+ Add Movie" → goes to search with the playlist pre-selected. The second flow is simpler. Recommend it.
4. **`movie_cache` INSERT policy:** The schema says "authenticated users" can insert. Add the SQL for `movie_cache` table in Task 4.
