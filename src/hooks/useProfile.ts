import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Profile } from '../types';

interface ProfileRow {
  id: string;
  handle: string;
  display_name: string;
  bio: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

interface ProfileState {
  profile: Profile | null;
  isLoading: boolean;
  hasError: boolean;
  refetch: () => Promise<void>;
}

export function useProfile(userId: string | undefined): ProfileState {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  const fetchProfile = useCallback(async () => {
    if (!userId) {
      setProfile(null);
      return;
    }

    setIsLoading(true);
    setHasError(false);

    const { data, error } = await supabase
      .from('profiles')
      .select('id, handle, display_name, bio, avatar_url, created_at, updated_at')
      .eq('id', userId)
      .single();

    if (error || !data) {
      setHasError(true);
      setIsLoading(false);
      return;
    }

    const row = data as ProfileRow;
    setProfile({
      id: row.id,
      userId: row.id,
      handle: row.handle,
      displayName: row.display_name,
      bio: row.bio,
      avatarUrl: row.avatar_url,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
    setIsLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return { profile, isLoading, hasError, refetch: fetchProfile };
}
