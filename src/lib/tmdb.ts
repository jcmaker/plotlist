const TMDB_BASE = 'https://api.themoviedb.org/3';
export const TMDB_IMG_BASE = 'https://image.tmdb.org/t/p/w500';

export function getPosterUrl(posterPath: string | null): string | null {
  return posterPath ? `${TMDB_IMG_BASE}${posterPath}` : null;
}

export interface TmdbMovie {
  id: number;
  title: string;
  original_title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string; // 'YYYY-MM-DD' or ''
}

export async function searchMovies(
  query: string
): Promise<{ results: TmdbMovie[]; error: string | null }> {
  const apiKey = process.env.EXPO_PUBLIC_TMDB_API_KEY;
  if (!apiKey) return { results: [], error: 'TMDB API key not configured.' };
  if (!query.trim()) return { results: [], error: null };

  try {
    const url =
      `${TMDB_BASE}/search/movie` +
      `?api_key=${encodeURIComponent(apiKey)}` +
      `&query=${encodeURIComponent(query.trim())}` +
      `&include_adult=false&language=en-US&page=1`;

    const res = await fetch(url, { headers: { accept: 'application/json' } });
    if (!res.ok) {
      return { results: [], error: `TMDB error: ${res.status}` };
    }
    const data = await res.json() as { results: TmdbMovie[] };
    return { results: (data.results ?? []).slice(0, 20), error: null };
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Network error. Check your connection.';
    return { results: [], error: message };
  }
}
