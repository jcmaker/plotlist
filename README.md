# Plotlist

A mobile app for movie lovers. Create movie playlists, add movies you've watched or want to recommend, write short personal notes, and share each playlist as a beautiful public page.

---

## Concept

- **Create playlists** — "Best heist movies", "Movies that changed my life", "Watch before 2026"
- **Add movies** — Search the TMDB database, add posters, rate and annotate each one
- **Share** — Every public playlist gets a link you can share in Instagram Stories or anywhere else

---

## Tech Stack

| Layer | Technology |
|---|---|
| Mobile framework | [Expo](https://expo.dev) SDK 54 |
| Language | TypeScript (strict) |
| Navigation | [Expo Router](https://expo.github.io/router) v4 (file-based) |
| UI | React Native `StyleSheet` (no external styling library) |
| Backend / Auth | [Supabase](https://supabase.com) |
| Database | Supabase Postgres |
| Movie data | [TMDB API](https://www.themoviedb.org/documentation/api) |

---

## Project Structure

```
plotlist/
├── app/                         # Expo Router file-based routes
│   ├── (auth)/                  # Unauthenticated screens
│   │   ├── login.tsx
│   │   └── signup.tsx
│   ├── (tabs)/                  # Main tab navigation
│   │   ├── playlists.tsx        # My Lists (default tab)
│   │   └── profile.tsx          # Profile + sign out
│   ├── playlist/
│   │   ├── new.tsx              # Create playlist
│   │   └── [id]/
│   │       ├── index.tsx        # Playlist detail + movie list + share
│   │       ├── edit.tsx         # Edit playlist metadata
│   │       └── add-movie.tsx    # TMDB movie search + add to playlist
│   ├── share/
│   │   └── [handle]/
│   │       └── [slug].tsx       # Public share page (no auth required)
│   └── _layout.tsx              # Root layout — auth guard
├── src/
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useProfile.ts
│   │   ├── usePlaylists.ts
│   │   ├── usePlaylist.ts
│   │   └── usePlaylistMovies.ts
│   ├── lib/
│   │   ├── supabase.ts
│   │   ├── tmdb.ts              # TMDB search + poster URL helpers
│   │   ├── playlistService.ts
│   │   ├── playlistMovieService.ts
│   │   └── shareService.ts      # Public share page data + URL builder
│   └── types/
│       └── index.ts
├── docs/
│   ├── database-schema.md
│   ├── development-plan.md
│   ├── supabase-setup.sql       # All table DDL + RLS policies
│   └── devil-pm-review-task5.md
├── .env.example
└── README.md
```

---

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env
```

Open `.env` and fill in your Supabase project URL and anon key. The app **will crash on startup** if these are missing — that is intentional to prevent silent failures.

Get your Supabase credentials at: **Project Settings → API**

### 3. Start the dev server

```bash
npx expo start
```

Scan the QR code with Expo Go (iOS/Android) or press `i` for iOS Simulator / `a` for Android Emulator.

---

## Current State (Tasks 1–5 complete)

Tasks 1–5 are fully implemented. See `docs/development-plan.md` for the full roadmap.

- **Login / Signup** — email/password auth via Supabase
- **Lists tab** — create, view, edit, delete playlists with visibility (private/unlisted/public)
- **Playlist Detail** — add movies from TMDB search, remove movies, rate (1–10), add personal notes
- **Movie Search** — contextual from Playlist Detail → "+ Add Movie"; 300ms debounce, poster display
- **Profile tab** — display name, handle, bio; sign out
- **Share pages** — every public or unlisted playlist has a public URL (`/share/:handle/:slug`); accessible without login; private playlists are blocked at both the client and RLS layer

**Next task:** Task 6 — Polish & Image Sharing Foundation

---

## Route Structure

```
app/
├── (auth)/login.tsx               — email/password sign-in
├── (auth)/signup.tsx              — new account creation
├── (tabs)/playlists.tsx           — user's playlist list (main tab)
├── (tabs)/profile.tsx             — profile + sign out
├── playlist/new.tsx               — create playlist
├── playlist/[id]/index.tsx        — playlist detail + movie list + share button
├── playlist/[id]/edit.tsx         — edit playlist metadata
├── playlist/[id]/add-movie.tsx    — TMDB search, add to playlist
└── share/[handle]/[slug].tsx      — public playlist page (no auth required)
```

---

## Development Workflow

Each task in `docs/development-plan.md` is designed to be completable end-to-end before the next one starts. Do not skip tasks or implement features out of order.

---

## Architecture Decisions

**Why Expo Router?** File-based routing maps directly to the screen hierarchy, makes deep links and web sharing straightforward, and generates typed routes with `experiments.typedRoutes`.

**Why no NativeWind?** NativeWind adds a Tailwind compilation step and version constraints. React Native's `StyleSheet` is sufficient for the MVP and avoids an extra dependency at the foundation stage.

**Why Supabase?** Handles auth, Postgres, real-time, and file storage in one managed service. Eliminates the need for a custom backend for the MVP.

**Why AsyncStorage for Supabase sessions?** Simpler to set up for the foundation. Can be replaced with `expo-secure-store` before shipping to production.

**Why TMDB?** Industry standard for movie metadata, free tier is generous, and the read-only API key is safe to ship in a mobile app.

---

## Security Notes

- Never commit `.env` — it is in `.gitignore`
- `EXPO_PUBLIC_*` variables are embedded in the client bundle — do not put server secrets here
- The TMDB API key is read-only and rate-limited; exposure in the mobile bundle is acceptable
- Row-Level Security (RLS) is enforced for all tables; see `docs/database-schema.md` and `docs/supabase-setup.sql`
- Share pages (`/share/*`) are intentionally public — the auth guard bypasses login for that route group only
- Private playlists are blocked from share URLs at both the application layer and in Postgres RLS — the `playlist_movies_select` policy checks `visibility IN ('public', 'unlisted')` before exposing any rows to unauthenticated callers
