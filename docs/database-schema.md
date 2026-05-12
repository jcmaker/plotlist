# Database Schema

Supabase Postgres schema for Plotlist MVP. All tables live in the `public` schema unless noted.

---

## Tables

### `profiles`

Extends Supabase's built-in `auth.users`. Created automatically via trigger on user signup.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | References `auth.users(id)` |
| `handle` | `text` UNIQUE NOT NULL | URL-safe, e.g. `@filmjunkie` |
| `display_name` | `text` NOT NULL | Shown publicly |
| `bio` | `text` | Nullable |
| `avatar_url` | `text` | Nullable, points to Supabase Storage or external URL |
| `created_at` | `timestamptz` | Default `now()` |
| `updated_at` | `timestamptz` | Updated via trigger |

**RLS:**
- SELECT: public (anyone can view any profile)
- INSERT/UPDATE/DELETE: authenticated, `auth.uid() = id` only

---

### `playlists`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | Default `gen_random_uuid()` |
| `user_id` | `uuid` NOT NULL | References `auth.users(id)` |
| `title` | `text` NOT NULL | |
| `description` | `text` | Nullable |
| `cover_image_url` | `text` | Nullable |
| `visibility` | `text` NOT NULL | `'private'`, `'unlisted'`, `'public'` — check constraint |
| `slug` | `text` NOT NULL | URL slug, unique per user |
| `sort_order` | `int4` NOT NULL | Default `0`, for user-defined playlist ordering |
| `created_at` | `timestamptz` | Default `now()` |
| `updated_at` | `timestamptz` | Updated via trigger |

**Unique constraint:** `(user_id, slug)`

**RLS:**
- SELECT: `visibility IN ('public','unlisted') OR auth.uid() = user_id`
- INSERT/UPDATE/DELETE: `auth.uid() = user_id`

---

### `playlist_movies`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | Default `gen_random_uuid()` |
| `playlist_id` | `uuid` NOT NULL | References `playlists(id)` ON DELETE CASCADE |
| `tmdb_movie_id` | `int4` NOT NULL | TMDB movie identifier |
| `title` | `text` NOT NULL | Denormalized for fast display without join |
| `poster_url` | `text` | Nullable, constructed from TMDB base URL |
| `release_year` | `int4` | Nullable |
| `personal_rating` | `int2` | Nullable, 1–10 check constraint |
| `note` | `text` | Nullable, short personal note |
| `sort_order` | `int4` NOT NULL | Default `0`, user-defined order within playlist |
| `added_at` | `timestamptz` | Default `now()` |

**Unique constraint:** `(playlist_id, tmdb_movie_id)` — one movie per playlist

**RLS:** Inherits from parent playlist visibility. Check `playlists.user_id = auth.uid()` for writes.

---

### `movie_cache`

Cached TMDB API responses to reduce external API calls and stay within rate limits.

| Column | Type | Notes |
|---|---|---|
| `tmdb_movie_id` | `int4` PK | |
| `title` | `text` NOT NULL | |
| `original_title` | `text` | Nullable |
| `poster_url` | `text` | Nullable, full constructed URL |
| `backdrop_url` | `text` | Nullable |
| `release_year` | `int4` | Nullable |
| `overview` | `text` | Nullable |
| `genres` | `text[]` | Nullable, array of genre names |
| `cached_at` | `timestamptz` | Default `now()` |

**RLS:**
- SELECT: public
- INSERT/UPDATE: authenticated users (cache population happens client-side on search)

**Cache invalidation:** Stale if `cached_at < now() - interval '30 days'`. Client checks this and re-fetches if stale.

---

## Triggers

### `handle_updated_at()`
Applied to `profiles` and `playlists`. Sets `updated_at = now()` on every UPDATE.

```sql
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### `handle_new_user()`
Creates a profile row when a new `auth.users` record is inserted.

```sql
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, handle, display_name)
  VALUES (
    NEW.id,
    'user_' || substr(NEW.id::text, 1, 8),
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

---

## Notes

- All IDs are UUIDs. Never use sequential integers as public-facing IDs.
- `poster_url` in `playlist_movies` stores the full TMDB image URL (constructed as `https://image.tmdb.org/t/p/w500{poster_path}`), not just the path. This avoids coupling the client display logic to TMDB's URL format.
- The `slug` field on playlists enables human-readable share URLs like `/u/filmjunkie/my-favorite-thrillers` without exposing internal UUIDs.
- `movie_cache` is intentionally denormalized — it trades some storage for simpler queries and resilience against TMDB rate limits.
