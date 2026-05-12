import { supabase } from './supabase';
import { Playlist, PlaylistMovie } from '../types';
import { rowToPlaylist, PlaylistRow } from './playlistService';
import { rowToPlaylistMovie, PlaylistMovieRow } from './playlistMovieService';

export interface PublicCreator {
  handle: string;
  displayName: string;
}

export interface PublicPlaylistData {
  playlist: Playlist;
  creator: PublicCreator;
  movies: PlaylistMovie[];
}

export function buildShareUrl(handle: string, slug: string): string {
  const base = (process.env.EXPO_PUBLIC_SHARE_BASE_URL ?? 'http://localhost:8081').replace(
    /\/$/,
    ''
  );
  return `${base}/share/${encodeURIComponent(handle)}/${encodeURIComponent(slug)}`;
}

export async function getPublicPlaylistPage(
  handle: string,
  slug: string
): Promise<{ data: PublicPlaylistData | null; error: string | null }> {
  // Step 1: resolve profile by handle (profiles are publicly readable)
  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select('id, handle, display_name')
    .eq('handle', handle)
    .maybeSingle();

  if (profileError) return { data: null, error: profileError.message };
  if (!profileData) return { data: null, error: null };

  // Step 2: fetch playlist — client also filters visibility so private playlists
  // never reach the UI even if RLS is misconfigured
  const { data: playlistData, error: playlistError } = await supabase
    .from('playlists')
    .select('*')
    .eq('user_id', profileData.id)
    .eq('slug', slug)
    .in('visibility', ['public', 'unlisted'])
    .maybeSingle();

  if (playlistError) return { data: null, error: playlistError.message };
  if (!playlistData) return { data: null, error: null };

  // Step 3: fetch movies with movie_cache join
  const { data: moviesData, error: moviesError } = await supabase
    .from('playlist_movies')
    .select(
      `*, movie_cache (title, original_title, poster_path, release_year, overview)`
    )
    .eq('playlist_id', playlistData.id)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });

  if (moviesError) return { data: null, error: moviesError.message };

  return {
    data: {
      playlist: rowToPlaylist(playlistData as PlaylistRow),
      creator: {
        handle: profileData.handle,
        displayName: profileData.display_name,
      },
      movies: (moviesData ?? []).map((r) => rowToPlaylistMovie(r as PlaylistMovieRow)),
    },
    error: null,
  };
}
