import { supabase } from './supabase';
import { PlaylistMovie } from '../types';
import { TmdbMovie } from './tmdb';

export interface PlaylistMovieRow {
  id: string;
  playlist_id: string;
  tmdb_movie_id: number;
  user_id: string;
  personal_rating: number | null;
  note: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
  movie_cache: {
    title: string;
    original_title: string | null;
    poster_path: string | null;
    release_year: number | null;
    overview: string | null;
  } | null;
}

const MOVIE_SELECT = `
  *,
  movie_cache (
    title,
    original_title,
    poster_path,
    release_year,
    overview
  )
`;

export function rowToPlaylistMovie(row: PlaylistMovieRow): PlaylistMovie {
  return {
    id: row.id,
    playlistId: row.playlist_id,
    tmdbMovieId: row.tmdb_movie_id,
    userId: row.user_id,
    title: row.movie_cache?.title ?? 'Unknown',
    posterPath: row.movie_cache?.poster_path ?? null,
    releaseYear: row.movie_cache?.release_year ?? null,
    overview: row.movie_cache?.overview ?? null,
    personalRating: row.personal_rating,
    note: row.note,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getPlaylistMovies(
  playlistId: string
): Promise<{ data: PlaylistMovie[]; error: string | null }> {
  const { data, error } = await supabase
    .from('playlist_movies')
    .select(MOVIE_SELECT)
    .eq('playlist_id', playlistId)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) return { data: [], error: error.message };
  return { data: (data as PlaylistMovieRow[]).map(rowToPlaylistMovie), error: null };
}

export async function addMovieToPlaylist(
  playlistId: string,
  userId: string,
  movie: TmdbMovie
): Promise<{ data: PlaylistMovie | null; error: string | null }> {
  const releaseYear = movie.release_date
    ? parseInt(movie.release_date.slice(0, 4), 10) || null
    : null;

  // Upsert movie_cache — safe for authenticated users (RLS allows insert/update)
  const { error: cacheError } = await supabase.from('movie_cache').upsert(
    {
      tmdb_movie_id: movie.id,
      title: movie.title,
      original_title: movie.original_title || null,
      overview: movie.overview || null,
      poster_path: movie.poster_path ?? null,
      backdrop_path: movie.backdrop_path ?? null,
      release_date: movie.release_date || null,
      release_year: releaseYear,
      cached_at: new Date().toISOString(),
    },
    { onConflict: 'tmdb_movie_id' }
  );
  if (cacheError) return { data: null, error: cacheError.message };

  // Determine next sort order (append to end)
  const { data: maxRow } = await supabase
    .from('playlist_movies')
    .select('sort_order')
    .eq('playlist_id', playlistId)
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextSortOrder = (maxRow?.sort_order ?? -1) + 1;

  const { data, error } = await supabase
    .from('playlist_movies')
    .insert({
      playlist_id: playlistId,
      tmdb_movie_id: movie.id,
      user_id: userId,
      sort_order: nextSortOrder,
    })
    .select(MOVIE_SELECT)
    .single();

  if (error) {
    if (error.code === '23505') {
      return { data: null, error: 'This movie is already in the playlist.' };
    }
    return { data: null, error: error.message };
  }

  return { data: rowToPlaylistMovie(data as PlaylistMovieRow), error: null };
}

export async function removeMovieFromPlaylist(
  playlistMovieId: string
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('playlist_movies')
    .delete()
    .eq('id', playlistMovieId);

  return { error: error?.message ?? null };
}

export async function updatePlaylistMovieMeta(
  playlistMovieId: string,
  updates: { personalRating?: number | null; note?: string | null }
): Promise<{ error: string | null }> {
  const dbUpdates: Record<string, unknown> = {};
  if ('personalRating' in updates) dbUpdates.personal_rating = updates.personalRating;
  if ('note' in updates) dbUpdates.note = updates.note;

  const { error } = await supabase
    .from('playlist_movies')
    .update(dbUpdates)
    .eq('id', playlistMovieId);

  return { error: error?.message ?? null };
}
