# devil-pm Review — Task 2: Authentication & Profile

**Date:** 2026-05-12
**Reviewer:** devil-pm (cold, skeptical product manager)
**Scope:** Task 2 implementation — Supabase auth, sign-up, sign-in, sign-out, profile loading

---

## MVP Scope Check

| Item | Verdict | Reason |
|---|---|---|
| Email/password sign-in | ✅ Required | Core auth |
| Email/password sign-up | ✅ Required | Core auth |
| Sign-out | ✅ Required | Core auth |
| Profile fetch on login | ✅ Required | Profile screen needs real data |
| Loading overlay (no auth flash) | ✅ Required | Without this, authenticated users see login screen flash on every cold start |
| Error states on sign-in failure | ✅ Required | Users need feedback |
| `useProfile` separate hook | ✅ Correct call | Profile data will be needed on playlists screen too |
| Password reset | ❌ Not included | Correct — deferred |
| Social login | ❌ Not included | Correct — deferred |
| Avatar upload | ❌ Not included | Correct — deferred |
| Handle customization | ❌ Not included | Correct — deferred |

**Scope verdict: PASS.** Nothing outside the task was added.

---

## Unnecessary Complexity Check

### Critical: None found.

### Important

**`useAuth` is called in both `_layout.tsx` (via `AuthGuard`) and `profile.tsx`**
- Classification: **Minor / Acceptable tradeoff**
- Each call creates its own Supabase `onAuthStateChange` subscription. Two subscriptions for the same session state.
- Risk: For an MVP with 2 concurrent subscriptions this is fine. Each gets the same events.
- Option if it bothers you: wrap `useAuth` in a React Context so there is one subscription app-wide. But this is premature at this stage.
- Recommendation: Leave it. Add Context if you see performance issues or when subscriber count grows to 4+.

**Sign-out is called directly with `supabase.auth.signOut()` without awaiting the error**
- Classification: **Minor**
- If sign-out fails (network error), the user sees nothing — no error, no retry. Unlikely with Supabase (sign-out clears local state regardless of network), but technically incomplete.
- Recommendation: Acceptable for MVP. Supabase clears the local session even if the server call fails.

---

## Missing Risks

### Risk 1 — Email confirmation creates a confusing UX gap
- **Severity:** Important (affects first-time user experience immediately)
- After sign-up, the user is told to check their email. If they don't disable email confirmation in the Supabase dashboard during development, they'll need to leave the app to confirm. When they return and sign in, everything works. But if the developer forgets to disable confirmation, they'll be confused why sign-in returns an error after sign-up.
- **Mitigation:** The sign-up Alert message includes the tip to disable confirmation. The `supabase-setup.sql` also includes this note. This is sufficient.

### Risk 2 — Handle collision in `handle_new_user` trigger
- **Severity:** Low (but real)
- The trigger generates handles as `user_` + first 12 hex chars of the UUID. With 16^12 ≈ 281 trillion combinations, collisions are practically impossible at small scale. But the trigger has no `ON CONFLICT (handle) DO ...` clause — if it ever collides, the trigger throws an exception and the user row isn't created, which breaks sign-up silently.
- **Mitigation for Task 5 or later:** Add `ON CONFLICT (handle) DO UPDATE SET handle = 'user_' || substr(replace(NEW.id::text, '-', ''), 1, 20)` or generate a unique suffix. Not urgent.

### Risk 3 — Profile might not exist yet when `ProfileScreen` loads
- **Severity:** Important (race condition on first login)
- The `handle_new_user` trigger fires on `auth.users` INSERT. But there can be a brief window between when Supabase creates the auth user and when the trigger commits the profile row. If the app fetches the profile too quickly after sign-up confirmation, the query might return null and `hasError` will be set.
- **Current handling:** `useProfile` sets `hasError = true` and shows a "Try Again" button. The user can tap retry and the profile will be there. This is acceptable.
- **Better long-term:** After sign-in, retry the profile fetch up to 3 times with 500ms delay before showing the error state. Not needed for MVP.

### Risk 4 — `AsyncStorage` stores auth tokens unencrypted
- **Severity:** Important (carried over from Task 1)
- Still using AsyncStorage. On rooted/jailbroken devices, tokens are readable.
- **Status:** Flagged in Task 1, still not resolved. Must fix before beta.
- **Fix:** Replace with `expo-secure-store` adapter. Two-hour task. Do it in Task 6 (Polish).

### Risk 5 — No input validation on the sign-up form beyond length checks
- **Severity:** Minor
- Email format is not validated client-side. If the user types `notanemail`, Supabase will return an error and the Alert will show it. Acceptable — server-side validation is the right place for this anyway.

---

## What Went Well

- **TypeScript passes clean** — `npx tsc --noEmit` returns zero errors. This matters because type errors caught early are cheap; type errors caught in prod are expensive.
- **Auth flow is simple and correct** — sign-in success triggers `onAuthStateChange`, which triggers `AuthGuard`, which redirects. No manual navigation calls from the login screen. This is the right pattern.
- **`useProfile` is separate from `useAuth`** — auth state (who are you?) is separate from profile state (what's your display name?). This separation is correct and avoids mixing Supabase Auth SDK concerns with database query concerns.
- **SQL trigger handles INSERT atomically** — the profile is created by the DB trigger, not by the client. This means the client can't create malformed profiles, and there's no chance of an orphaned auth user without a profile.

---

## Next Priority Recommendation

**Task 3: Playlists CRUD**

Pre-conditions (all met):
- Auth works end-to-end ✓
- Profile is created automatically on sign-up ✓
- `user.id` is available from `useAuth` ✓

**Decision needed before Task 3 starts:**
1. **Slug strategy:** How is the playlist slug generated? Options:
   - Auto-generate from title: `"My Favorite Thrillers"` → `"my-favorite-thrillers"`. Simple. Collision risk on edit → append `-2`, `-3`.
   - Let the user set it manually in the create form. Harder UX, but gives user control over share URLs.
   - **Recommendation:** Auto-generate on create (from title, lowercased, hyphenated). Show it to the user in an editable field so they can customize it. If the slug is already taken (for this user), append a number.

2. **Playlist cover image on create:** Does Task 3 require an image picker? Probably not — the cover can default to null and be set later. Keep Task 3 focused on text-only CRUD.
