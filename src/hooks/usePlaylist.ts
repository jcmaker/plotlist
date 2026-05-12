import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { rowToPlaylist, PlaylistRow } from '../lib/playlistService';
import { Playlist } from '../types';

interface PlaylistState {
  playlist: Playlist | null;
  isLoading: boolean;
  hasError: boolean;
  refetch: () => Promise<void>;
}

export function usePlaylist(
  playlistId: string | undefined,
  userId: string | undefined
): PlaylistState {
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  const fetchPlaylist = useCallback(async () => {
    if (!playlistId || !userId) {
      setPlaylist(null);
      return;
    }

    setIsLoading(true);
    setHasError(false);

    const { data, error } = await supabase
      .from('playlists')
      .select('*')
      .eq('id', playlistId)
      .eq('user_id', userId) // scoped to owner — defence in depth on top of RLS
      .single();

    if (error || !data) {
      setHasError(true);
    } else {
      setPlaylist(rowToPlaylist(data as PlaylistRow));
    }

    setIsLoading(false);
  }, [playlistId, userId]);

  useEffect(() => {
    fetchPlaylist();
  }, [fetchPlaylist]);

  return { playlist, isLoading, hasError, refetch: fetchPlaylist };
}
