# devil-pm Review — Task 1: Foundation

**Date:** 2026-05-12  
**Reviewer:** devil-pm (cold, skeptical product manager)  
**Scope:** Task 1 implementation — project foundation, placeholder screens, types, docs

---

## MVP Scope Check

| Item | Verdict | Reason |
|---|---|---|
| Expo Router + TypeScript scaffold | ✅ Required | Non-negotiable foundation |
| Supabase client setup | ✅ Required | Auth and DB depend on this |
| TypeScript interfaces (Profile, Playlist, PlaylistMovie, MovieCache) | ✅ Required | Shared contract, zero runtime cost |
| 6 placeholder screens | ✅ Required | Routing must work before any feature |
| Auth guard in `_layout.tsx` | ✅ Required | Prevents building screens on broken routing |
| `useAuth` hook | ✅ Required | Will be filled in Task 2; the seam is correct |
| Database schema doc | ✅ Required | Prevents expensive schema rewrites in Task 3 |
| Development plan doc | ✅ Required | Keeps a solo dev honest about scope |
| NativeWind | ❌ Not included | Correct call — adds Tailwind compilation overhead for no MVP value |
| Path aliases (`@/*`) | ❌ Not included | Correct call — adds babel plugin dependency with marginal benefit at this scale |
| TMDB TypeScript interfaces | ❌ Not included | Correct — deferred to Task 4 |
| Instagram sharing code | ❌ Not included | Correct |

**Scope verdict: PASS.** Nothing was built that isn't needed. Nothing required was skipped.

---

## Unnecessary Complexity Check

### Critical: None found.

### Important

**`TAB_CONFIG` array in `(tabs)/_layout.tsx`**
- Classification: **Minor / Overengineering**
- Issue: The TAB_CONFIG loop adds a layer of indirection for 4 static tabs. Expo Router's `<Tabs.Screen>` is declarative — looping over a config array requires readers to look up the array definition to understand the structure. Four explicit `<Tabs.Screen>` elements would be just as readable, probably more so.
- Risk: Low. Works correctly. Not worth changing before Task 2.
- Recommendation: Flatten to explicit `<Tabs.Screen>` elements when next touching the file.

**`AuthGuard` as a separate component inside `_layout.tsx`**
- Classification: **Minor**
- The pattern is correct and idiomatic for Expo Router. No issue.

---

## Missing Risks

### Risk 1 — Supabase env var validation throws at import time
- **Severity:** Important
- The `throw new Error(...)` in `src/lib/supabase.ts` runs when the module is imported, which happens at app startup. In development without a `.env` file, the app will crash before rendering anything, including the error message. A developer picking up this repo for the first time will see a raw crash with no obvious fix.
- **Mitigation:** Add a clear comment in `.env.example` and in the README quickstart steps that the `.env` file must be created before running. The hard crash is actually acceptable behavior — it prevents silent failures with missing credentials.

### Risk 2 — Auth tokens stored in AsyncStorage (unencrypted)
- **Severity:** Important (fix before Task 2 ships)
- `AsyncStorage` is unencrypted. On non-jailbroken devices this is acceptable for most apps, but on rooted Android devices auth tokens are readable. Supabase recommends `expo-secure-store` for React Native apps.
- **Mitigation for Task 2:** Replace the `AsyncStorage` storage adapter with `expo-secure-store`. This requires adding the `expo-secure-store` dependency and a web-safe adapter (SecureStore does not work on web, which matters for the future share page).

### Risk 3 — No `assets/` directory
- **Severity:** Minor
- `app.json` references `./assets/icon.png`, `./assets/splash.png`, etc. These files don't exist yet. `expo start` will warn but not crash. Fix before Task 6 (polish).

### Risk 4 — `slug` auto-generation strategy undefined
- **Severity:** Important (must resolve before Task 3)
- The schema defines `(user_id, slug)` as unique but the strategy for generating slugs is unspecified. Options: auto-generate from title (lowercased, hyphenated), let the user set it, or use a UUID. Auto-generation is friendliest but requires collision handling. Define this before Task 3 starts to avoid a schema or API change mid-implementation.

### Risk 5 — `personal_rating` is `int2` in schema but unbounded in TypeScript interface
- **Severity:** Minor
- The schema has a `1–10 check constraint` (documented but not yet written as SQL). The TypeScript type is `number | null` with no enforcement. A client bug could send `0` or `11`. Write the check constraint when creating the table.

---

## Next Priority Recommendation

**Do Task 2 next: Authentication + Profile.**

Rationale:
- Every other feature (playlists, movies, sharing) requires a real user identity.
- The `useAuth` hook is already wired — it just needs a real Supabase project.
- The auth flow is the highest-risk UX decision: magic link vs. email+password vs. social login. Get this right before building anything on top of it.
- **Before Task 2:** Create the Supabase project and set the env vars. Without this, zero code can be tested end-to-end.

**Decision needed before Task 2 starts:**
1. Email/password only, or include Apple Sign In from the start? (Apple is required for iOS App Store apps that offer social login — if you plan to add Google later, add Apple now or you'll be forced to add it anyway.)
2. Handle uniqueness — enforce at the DB level (unique constraint) or at the app level? DB level is safer and should be the default.
