export interface Profile {
  id: string;
  userId: string;
  handle: string;
  displayName: string;
  bio: string | null;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export type PlaylistVisibility = 'private' | 'unlisted' | 'public';

export interface Playlist {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  coverImageUrl: string | null;
  visibility: PlaylistVisibility;
  slug: string;
  sortOrder: number;
  movieCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface PlaylistMovie {
  id: string;
  playlistId: string;
  tmdbMovieId: number;
  title: string;
  posterUrl: string | null;
  releaseYear: number | null;
  personalRating: number | null; // 1–10, null means unrated
  note: string | null;
  sortOrder: number;
  addedAt: string;
}

export interface MovieCache {
  tmdbMovieId: number;
  title: string;
  originalTitle: string | null;
  posterUrl: string | null;
  backdropUrl: string | null;
  releaseYear: number | null;
  overview: string | null;
  genres: string[] | null;
  cachedAt: string;
}
