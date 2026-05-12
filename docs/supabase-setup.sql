-- Plotlist — Supabase Setup SQL
-- Run this in the Supabase SQL Editor:
-- https://supabase.com/dashboard/project/_/sql/new
--
-- Run once before starting the app for the first time.
-- Safe to run again — all statements use CREATE OR REPLACE / IF NOT EXISTS.

-- ============================================================
-- TIP: Disable email confirmation during development
-- ============================================================
-- Go to: Authentication > Providers > Email
-- Turn off "Confirm email" to skip the confirmation step while building.
-- Re-enable it before going to production.

-- ============================================================
-- SHARED TRIGGER FUNCTION: updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- TABLE: profiles
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id           uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  handle       text        UNIQUE NOT NULL,
  display_name text        NOT NULL,
  bio          text,
  avatar_url   text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Anyone can read any profile (needed for public share pages)
CREATE POLICY "profiles_select_public"
  ON public.profiles FOR SELECT
  USING (true);

-- Users can only update their own profile
CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- The handle_new_user trigger function (below) handles INSERT via SECURITY DEFINER
-- so no INSERT policy is needed for authenticated users.

-- updated_at trigger for profiles
DROP TRIGGER IF EXISTS handle_profiles_updated_at ON public.profiles;
CREATE TRIGGER handle_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- ============================================================
-- TRIGGER FUNCTION: auto-create profile on user signup
-- ============================================================
-- Runs with SECURITY DEFINER so it can INSERT into profiles
-- even though the new user has no INSERT policy yet.
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, handle, display_name)
  VALUES (
    NEW.id,
    'user_' || substr(replace(NEW.id::text, '-', ''), 1, 12),
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- TABLE: playlists
-- ============================================================
CREATE TABLE IF NOT EXISTS public.playlists (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title           text        NOT NULL,
  description     text,
  cover_image_url text,
  visibility      text        NOT NULL DEFAULT 'private'
                              CHECK (visibility IN ('private', 'unlisted', 'public')),
  slug            text        NOT NULL,
  sort_order      integer     NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, slug)
);

ALTER TABLE public.playlists ENABLE ROW LEVEL SECURITY;

-- Owners can read, insert, update, and delete their own playlists
CREATE POLICY "playlists_owner_all"
  ON public.playlists
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Public and unlisted playlists are readable by anyone.
-- Added now (Task 3) because Task 5 (share page) requires it and adding it
-- later would require a table-level policy change under active traffic.
CREATE POLICY "playlists_select_public_unlisted"
  ON public.playlists FOR SELECT
  USING (visibility IN ('public', 'unlisted'));

-- updated_at trigger for playlists
DROP TRIGGER IF EXISTS handle_playlists_updated_at ON public.playlists;
CREATE TRIGGER handle_playlists_updated_at
  BEFORE UPDATE ON public.playlists
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- ============================================================
-- TABLE: movie_cache  (Task 4)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.movie_cache (
  tmdb_movie_id  integer     PRIMARY KEY,
  title          text        NOT NULL,
  original_title text,
  overview       text,
  poster_path    text,
  backdrop_path  text,
  release_date   date,
  release_year   integer,
  cached_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.movie_cache ENABLE ROW LEVEL SECURITY;

-- Anyone can read the cache (needed for Task 5 share page without auth)
CREATE POLICY "movie_cache_select_all"
  ON public.movie_cache FOR SELECT
  USING (true);

-- Authenticated users can insert new cache entries
CREATE POLICY "movie_cache_insert_authenticated"
  ON public.movie_cache FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Authenticated users can update (for cache refresh via upsert)
CREATE POLICY "movie_cache_update_authenticated"
  ON public.movie_cache FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- TABLE: playlist_movies  (Task 4)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.playlist_movies (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  playlist_id     uuid        NOT NULL REFERENCES public.playlists(id) ON DELETE CASCADE,
  tmdb_movie_id   integer     NOT NULL REFERENCES public.movie_cache(tmdb_movie_id),
  user_id         uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  personal_rating integer     CHECK (personal_rating BETWEEN 1 AND 10),
  note            text,
  sort_order      integer     NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (playlist_id, tmdb_movie_id)
);

ALTER TABLE public.playlist_movies ENABLE ROW LEVEL SECURITY;

-- SELECT: owner can always read; anyone can read from public/unlisted playlists (Task 5 share pages)
-- Task 4.5: replaced owner-only policy with one that also allows unauthenticated share-page access.
-- Run: DROP POLICY IF EXISTS "playlist_movies_owner_select" ON public.playlist_movies; before re-applying.
DROP POLICY IF EXISTS "playlist_movies_owner_select" ON public.playlist_movies;
CREATE POLICY "playlist_movies_select"
  ON public.playlist_movies FOR SELECT
  USING (
    -- Playlist owner can always read
    EXISTS (
      SELECT 1 FROM public.playlists
      WHERE playlists.id = playlist_movies.playlist_id
        AND playlists.user_id = auth.uid()
    )
    OR
    -- Unauthenticated and other users can read movies from public/unlisted playlists
    EXISTS (
      SELECT 1 FROM public.playlists
      WHERE playlists.id = playlist_movies.playlist_id
        AND visibility IN ('public', 'unlisted')
    )
  );

-- Owner can insert, and must set user_id = their own uid
CREATE POLICY "playlist_movies_owner_insert"
  ON public.playlist_movies FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.playlists
      WHERE playlists.id = playlist_movies.playlist_id
        AND playlists.user_id = auth.uid()
    )
  );

-- Owner can update (ratings/notes) on their playlists
CREATE POLICY "playlist_movies_owner_update"
  ON public.playlist_movies FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.playlists
      WHERE playlists.id = playlist_movies.playlist_id
        AND playlists.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.playlists
      WHERE playlists.id = playlist_movies.playlist_id
        AND playlists.user_id = auth.uid()
    )
  );

-- Owner can delete movies from their playlists
CREATE POLICY "playlist_movies_owner_delete"
  ON public.playlist_movies FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.playlists
      WHERE playlists.id = playlist_movies.playlist_id
        AND playlists.user_id = auth.uid()
    )
  );

-- updated_at trigger for playlist_movies
DROP TRIGGER IF EXISTS handle_playlist_movies_updated_at ON public.playlist_movies;
CREATE TRIGGER handle_playlist_movies_updated_at
  BEFORE UPDATE ON public.playlist_movies
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
