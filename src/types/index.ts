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
  userId: string;
  // Joined from movie_cache:
  title: string;
  posterPath: string | null;
  releaseYear: number | null;
  overview: string | null;
  // User annotations:
  personalRating: number | null; // 1–10, null means unrated
  note: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface MovieCache {
  tmdbMovieId: number;
  title: string;
  originalTitle: string | null;
  overview: string | null;
  posterPath: string | null;
  backdropPath: string | null;
  releaseDate: string | null;
  releaseYear: number | null;
  cachedAt: string;
}
