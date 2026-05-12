import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { rowToPlaylist, PlaylistRow } from '../lib/playlistService';
import { Playlist } from '../types';

interface PlaylistsState {
  playlists: Playlist[];
  isLoading: boolean;
  hasError: boolean;
  refetch: () => Promise<void>;
}

export function usePlaylists(userId: string | undefined): PlaylistsState {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  const fetchPlaylists = useCallback(async () => {
    if (!userId) {
      setPlaylists([]);
      return;
    }

    setIsLoading(true);
    setHasError(false);

    const { data, error } = await supabase
      .from('playlists')
      .select('*')
      .eq('user_id', userId)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (error || !data) {
      setHasError(true);
    } else {
      setPlaylists((data as PlaylistRow[]).map(rowToPlaylist));
    }

    setIsLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchPlaylists();
  }, [fetchPlaylists]);

  return { playlists, isLoading, hasError, refetch: fetchPlaylists };
}
