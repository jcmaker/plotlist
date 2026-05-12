# Development Plan

Ordered task list for Plotlist MVP. Each task should be completable in one focused session.
Do not start a task before the previous one is working end-to-end.

---

## Task 1 — Foundation (DONE)
- [x] Expo Router project structure
- [x] Supabase client setup
- [x] TypeScript interfaces: Profile, Playlist, PlaylistMovie, MovieCache
- [x] Placeholder screens: Login, Home, Playlists, Search, Profile, Playlist Detail
- [x] Auth guard in root layout
- [x] Database schema design
- [x] README and docs

---

## Task 2 — Authentication & Profile (DONE)

**Goal:** Users can sign up, log in, and log out. A profile record is created on signup.

- [x] Supabase project setup (create project, set env vars) — done manually by developer
- [x] Run SQL: `docs/supabase-setup.sql` — creates `profiles` table, RLS, and `handle_new_user` trigger
- [x] Email/password auth enabled via Supabase dashboard
- [x] `LoginScreen`: real sign-in with Supabase `signInWithPassword`
- [x] `SignupScreen`: email + password + display name; sends `full_name` in metadata
- [x] `useAuth` wired to real Supabase `getSession` + `onAuthStateChange`
- [x] Sign out from Profile screen (Alert confirmation)
- [x] `useProfile` hook: fetches profile from `profiles` table by `user.id`
- [x] `ProfileScreen`: displays real display name, handle, bio (if set)
- [x] Loading overlay in root layout — prevents auth flash on startup
- [x] Error states: wrong password shown via Alert, profile fetch error with retry button

**Done when:** A new user can sign up, see their profile, and sign out.

---

## Task 3 — Playlists CRUD

**Goal:** Users can create, view, edit, and delete playlists.

- [ ] Run SQL: create `playlists` table + RLS policies + `handle_updated_at` trigger
- [ ] Implement create playlist: title, description, visibility picker, slug auto-generation
- [ ] Fetch and display user's playlists on PlaylistsScreen
- [ ] Implement PlaylistDetailScreen: show metadata and empty movie list
- [ ] Implement edit playlist: update title, description, visibility
- [ ] Implement delete playlist with confirmation dialog
- [ ] Implement playlist reordering (drag or up/down buttons)
- [ ] Implement playlist cover image: pick from device or use first movie poster

**Done when:** Users can create, read, edit, delete, and reorder playlists.

---

## Task 4 — Movie Search & Add to Playlist

**Goal:** Users can search TMDB and add movies to a playlist.

- [ ] Set up TMDB API key env var
- [ ] Implement TMDB movie search (`/search/movie`) with debounce
- [ ] Display search results: poster, title, year, overview excerpt
- [ ] Implement "Add to Playlist" flow from search results
- [ ] Run SQL: create `playlist_movies` table + RLS + `movie_cache` table
- [ ] Populate `movie_cache` on first search/add
- [ ] Display movies in PlaylistDetailScreen: poster, title, year, rating, note
- [ ] Implement remove movie from playlist
- [ ] Implement reorder movies within playlist
- [ ] Implement personal rating (1–10) and short note per movie

**Done when:** Users can search, add, annotate, reorder, and remove movies in a playlist.

---

## Task 5 — Share Link & Public Playlist Page

**Goal:** Each playlist has a public URL that non-app users can view.

- [ ] Implement `app/share/[handle]/[slug].tsx` — public playlist page
- [ ] No auth required on this route
- [ ] Display: playlist title, description, movie list with posters
- [ ] Implement "Copy link" button on playlist detail screen
- [ ] Handle unlisted vs public visibility on share page (unlisted accessible via link, not indexed)
- [ ] Test share URL on web (Expo web output)
- [ ] Basic SEO meta tags for public playlists (og:title, og:image)

**Done when:** Anyone with the link can view a public or unlisted playlist in a browser.

---

## Task 6 — Polish & Image Sharing Foundation

**Goal:** App is presentable and ready for beta testing. Share image architecture is in place.

- [ ] App icon and splash screen
- [ ] Consistent loading states across all screens
- [ ] Consistent error states and retry actions
- [ ] Empty states for all list screens
- [ ] Pull-to-refresh on playlists and playlist detail
- [ ] Profile: edit display name, bio, avatar (Supabase Storage)
- [ ] Create `ShareImageScreen` component stub — layout for Instagram Story image (9:16 ratio, playlist + top movies)
- [ ] Document the image generation approach (react-native-view-shot or server-side)

**Done when:** The app is stable enough for a small group of beta testers.

---

## Future (Post-MVP)

- Instagram Story image generation (react-native-view-shot or edge function)
- Social login (Apple, Google) via Supabase Auth
- Discover feed: public playlists from other users
- Follow system
- Playlist comments or reactions
- Push notifications
- Analytics (how many views a shared playlist got)
