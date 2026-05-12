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
| Mobile framework | [Expo](https://expo.dev) SDK 52 |
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
├── app/                     # Expo Router file-based routes
│   ├── (auth)/              # Unauthenticated screens (login, sign up)
│   │   └── login.tsx
│   ├── (tabs)/              # Main tab navigation
│   │   ├── index.tsx        # Home
│   │   ├── playlists.tsx    # My Lists
│   │   ├── search.tsx       # Movie Search
│   │   └── profile.tsx      # Profile
│   ├── playlist/
│   │   └── [id].tsx         # Playlist detail (dynamic route)
│   └── _layout.tsx          # Root layout — auth guard lives here
├── src/
│   ├── components/          # Shared UI components (empty in foundation)
│   ├── hooks/
│   │   └── useAuth.ts       # Supabase auth state hook
│   ├── lib/
│   │   └── supabase.ts      # Supabase client singleton
│   └── types/
│       └── index.ts         # TypeScript interfaces for all domain models
├── docs/
│   ├── database-schema.md   # Postgres table design + RLS policies
│   ├── development-plan.md  # Ordered task list for the full MVP
│   └── devil-pm-review.md  # Scope and risk review per task
├── .env.example             # Required environment variables
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

## Current State (Task 1 — Foundation)

The app currently shows all screens as placeholders. Authentication, real data, and all features are implemented in subsequent tasks. See `docs/development-plan.md` for the full roadmap.

- **Login screen** — placeholder form, no real auth
- **Home screen** — placeholder
- **My Lists screen** — placeholder empty state
- **Movie Search screen** — placeholder search bar
- **Profile screen** — placeholder profile card
- **Playlist Detail screen** — accessible via `/playlist/:id`, shows the ID

---

## Development Workflow

Each task in `docs/development-plan.md` is designed to be completable end-to-end before the next one starts. Do not skip tasks or implement features out of order.

**Next task:** Task 2 — Authentication & Profile (requires a real Supabase project)

---

## Architecture Decisions

**Why Expo Router?** File-based routing maps directly to the screen hierarchy, makes deep links and web sharing straightforward, and generates typed routes with `experiments.typedRoutes`.

**Why no NativeWind?** NativeWind adds a Tailwind compilation step and version constraints. React Native's `StyleSheet` is sufficient for the MVP and avoids an extra dependency at the foundation stage.

**Why Supabase?** Handles auth, Postgres, real-time, and file storage in one managed service. Eliminates the need for a custom backend for the MVP.

**Why AsyncStorage for Supabase sessions?** Simpler to set up for the foundation. Task 2 will replace this with `expo-secure-store` before shipping auth.

**Why TMDB?** Industry standard for movie metadata, free tier is generous, and the read-only API key is safe to ship in a mobile app.

---

## Security Notes

- Never commit `.env` — it is in `.gitignore`
- `EXPO_PUBLIC_*` variables are embedded in the client bundle — do not put server secrets here
- The TMDB API key is read-only and rate-limited; exposure in the mobile bundle is acceptable
- Auth tokens will be moved to `expo-secure-store` in Task 2
- Row-Level Security (RLS) policies are defined in `docs/database-schema.md` and must be applied when creating Supabase tables
