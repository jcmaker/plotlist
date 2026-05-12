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
