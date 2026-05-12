import { supabase } from './supabase';
import { Playlist, PlaylistVisibility } from '../types';

// ---------------------------------------------------------------------------
// DB row type (snake_case from Supabase)
// ---------------------------------------------------------------------------
export interface PlaylistRow {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  visibility: string;
  slug: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// Input types
// ---------------------------------------------------------------------------
export interface CreatePlaylistInput {
  title: string;
  description?: string;
  slug: string;
  visibility: PlaylistVisibility;
}

export interface UpdatePlaylistInput {
  title?: string;
  description?: string | null;
  slug?: string;
  visibility?: PlaylistVisibility;
}

// ---------------------------------------------------------------------------
// DB row → domain model
// ---------------------------------------------------------------------------
export function rowToPlaylist(row: PlaylistRow): Playlist {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    description: row.description,
    coverImageUrl: row.cover_image_url,
    visibility: row.visibility as PlaylistVisibility,
    slug: row.slug,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ---------------------------------------------------------------------------
// Slug utilities
// ---------------------------------------------------------------------------

/** Convert any string to a URL-safe slug. */
export function toSlug(value: string): string {
  const slug = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return slug || 'untitled';
}

async function isSlugTaken(
  userId: string,
  slug: string,
  excludeId?: string
): Promise<boolean> {
  const base = supabase
    .from('playlists')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('slug', slug);

  const { count } = excludeId
    ? await base.neq('id', excludeId)
    : await base;

  return (count ?? 0) > 0;
}

/**
 * Given a candidate slug, check if it's already taken for this user and
 * append -2, -3 … until a free slot is found.
 * Pass excludeId when editing an existing playlist so the current slug
 * doesn't count as taken.
 */
export async function resolveUniqueSlug(
  userId: string,
  candidateSlug: string,
  excludeId?: string
): Promise<string> {
  const base = candidateSlug || 'untitled';
  let current = base;

  for (let attempt = 2; attempt <= 20; attempt++) {
    const taken = await isSlugTaken(userId, current, excludeId);
    if (!taken) return current;
    current = `${base}-${attempt}`;
  }

  return `${base}-${Date.now()}`;
}

// ---------------------------------------------------------------------------
// CRUD
// ---------------------------------------------------------------------------

export async function createPlaylist(
  userId: string,
  input: CreatePlaylistInput
): Promise<{ data: Playlist | null; error: string | null }> {
  const { data, error } = await supabase
    .from('playlists')
    .insert({
      user_id: userId,
      title: input.title.trim(),
      description: input.description?.trim() || null,
      slug: input.slug,
      visibility: input.visibility,
    })
    .select()
    .single();

  if (error || !data) {
    return { data: null, error: error?.message ?? 'Failed to create playlist' };
  }
  return { data: rowToPlaylist(data as PlaylistRow), error: null };
}

export async function updatePlaylist(
  playlistId: string,
  input: UpdatePlaylistInput
): Promise<{ data: Playlist | null; error: string | null }> {
  const updates: Record<string, unknown> = {};
  if (input.title !== undefined) updates.title = input.title.trim();
  if (input.description !== undefined) updates.description = input.description?.trim() || null;
  if (input.slug !== undefined) updates.slug = input.slug;
  if (input.visibility !== undefined) updates.visibility = input.visibility;

  const { data, error } = await supabase
    .from('playlists')
    .update(updates)
    .eq('id', playlistId)
    .select()
    .single();

  if (error || !data) {
    return { data: null, error: error?.message ?? 'Failed to update playlist' };
  }
  return { data: rowToPlaylist(data as PlaylistRow), error: null };
}

export async function deletePlaylist(
  playlistId: string
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('playlists')
    .delete()
    .eq('id', playlistId);

  return { error: error?.message ?? null };
}
