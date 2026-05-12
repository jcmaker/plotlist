import { useCallback, useEffect, useState } from 'react';
import { PlaylistMovie } from '../types';
import { getPlaylistMovies } from '../lib/playlistMovieService';

interface PlaylistMoviesState {
  movies: PlaylistMovie[];
  isLoading: boolean;
  hasError: boolean;
  refetch: () => Promise<void>;
}

export function usePlaylistMovies(playlistId: string | undefined): PlaylistMoviesState {
  const [movies, setMovies] = useState<PlaylistMovie[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  const fetchMovies = useCallback(async () => {
    if (!playlistId) {
      setMovies([]);
      return;
    }
    setIsLoading(true);
    setHasError(false);
    const { data, error } = await getPlaylistMovies(playlistId);
    if (error) {
      setHasError(true);
    } else {
      setMovies(data);
    }
    setIsLoading(false);
  }, [playlistId]);

  useEffect(() => {
    fetchMovies();
  }, [fetchMovies]);

  return { movies, isLoading, hasError, refetch: fetchMovies };
}
