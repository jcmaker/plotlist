import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getPublicPlaylistPage, PublicPlaylistData } from '../../../src/lib/shareService';
import { getPosterUrl } from '../../../src/lib/tmdb';
import { PlaylistMovie } from '../../../src/types';

export default function SharePage() {
  const { handle, slug } = useLocalSearchParams<{ handle: string; slug: string }>();
  const [isLoading, setIsLoading] = useState(true);
  const [pageData, setPageData] = useState<PublicPlaylistData | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!handle || !slug) {
      setIsLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data, error } = await getPublicPlaylistPage(handle, slug);
      if (cancelled) return;
      setIsLoading(false);
      if (error) {
        setLoadError(error);
      } else {
        setPageData(data);
      }
    })();
    return () => { cancelled = true; };
  }, [handle, slug]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centeredState}>
          <ActivityIndicator color="#888" />
        </View>
      </SafeAreaView>
    );
  }

  if (loadError || !pageData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centeredState}>
          <Text style={styles.notFoundTitle}>Playlist not found</Text>
          <Text style={styles.notFoundBody}>
            This playlist may be private or the link may be incorrect.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const { playlist, creator, movies } = pageData;
  const coverPosterUrl = movies.length > 0 ? getPosterUrl(movies[0].posterPath) : null;

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={movies}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <Header
            title={playlist.title}
            description={playlist.description}
            creatorHandle={creator.handle}
            creatorName={creator.displayName}
            movieCount={movies.length}
            coverPosterUrl={coverPosterUrl}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyMovies}>
            <Text style={styles.emptyText}>No movies in this playlist yet.</Text>
          </View>
        }
        ListFooterComponent={<Footer />}
        renderItem={({ item }) => <ShareMovieCard movie={item} />}
      />
    </SafeAreaView>
  );
}

function Header({
  title,
  description,
  creatorHandle,
  creatorName,
  movieCount,
  coverPosterUrl,
}: {
  title: string;
  description: string | null;
  creatorHandle: string;
  creatorName: string;
  movieCount: number;
  coverPosterUrl: string | null;
}) {
  return (
    <>
      {coverPosterUrl ? (
        <Image source={{ uri: coverPosterUrl }} style={styles.coverImage} />
      ) : (
        <View style={styles.coverPlaceholder}>
          <Text style={styles.coverIcon}>🎬</Text>
        </View>
      )}
      <View style={styles.headerInfo}>
        <Text style={styles.playlistTitle}>{title}</Text>
        <Text style={styles.creatorText}>
          by {creatorName} · @{creatorHandle}
        </Text>
        {description ? (
          <Text style={styles.description}>{description}</Text>
        ) : null}
        <Text style={styles.movieCount}>
          {movieCount === 0
            ? 'No movies yet'
            : `${movieCount} movie${movieCount === 1 ? '' : 's'}`}
        </Text>
      </View>
      <View style={styles.divider} />
    </>
  );
}

function ShareMovieCard({ movie }: { movie: PlaylistMovie }) {
  const posterUrl = getPosterUrl(movie.posterPath);

  return (
    <View style={styles.movieCard}>
      {posterUrl ? (
        <Image source={{ uri: posterUrl }} style={styles.poster} />
      ) : (
        <View style={[styles.poster, styles.posterPlaceholder]}>
          <Text style={styles.posterPlaceholderIcon}>🎬</Text>
        </View>
      )}
      <View style={styles.movieInfo}>
        <Text style={styles.movieTitle} numberOfLines={2}>
          {movie.title}
        </Text>
        {movie.releaseYear ? (
          <Text style={styles.movieYear}>{movie.releaseYear}</Text>
        ) : null}
        {movie.personalRating != null ? (
          <Text style={styles.movieRating}>★ {movie.personalRating}/10</Text>
        ) : null}
        {movie.note ? (
          <Text style={styles.movieNote} numberOfLines={3}>
            "{movie.note}"
          </Text>
        ) : null}
      </View>
    </View>
  );
}

function Footer() {
  return (
    <View style={styles.footer}>
      <Text style={styles.footerText}>Made with Plotlist</Text>
      <Text style={styles.footerSub}>Create your own movie playlists</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f0f',
  },
  centeredState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  notFoundTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
  },
  notFoundBody: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  listContent: {
    paddingBottom: 48,
  },
  // Cover
  coverImage: {
    width: '100%',
    height: 260,
    resizeMode: 'cover',
  },
  coverPlaceholder: {
    height: 200,
    backgroundColor: '#1c1c1e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  coverIcon: {
    fontSize: 64,
  },
  // Header info
  headerInfo: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    gap: 6,
  },
  playlistTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: -0.5,
    lineHeight: 32,
  },
  creatorText: {
    fontSize: 14,
    color: '#888',
    marginTop: 2,
  },
  description: {
    fontSize: 15,
    color: '#aaa',
    lineHeight: 22,
    marginTop: 6,
  },
  movieCount: {
    fontSize: 13,
    color: '#555',
    marginTop: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#1c1c1e',
    marginHorizontal: 20,
    marginBottom: 8,
  },
  // Movie card
  movieCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1c1c1e',
    gap: 14,
  },
  poster: {
    width: 60,
    height: 90,
    borderRadius: 6,
    backgroundColor: '#1c1c1e',
    flexShrink: 0,
  },
  posterPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  posterPlaceholderIcon: {
    fontSize: 22,
  },
  movieInfo: {
    flex: 1,
    gap: 4,
    paddingTop: 2,
  },
  movieTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    lineHeight: 21,
  },
  movieYear: {
    fontSize: 13,
    color: '#888',
  },
  movieRating: {
    fontSize: 13,
    color: '#f5c518',
  },
  movieNote: {
    fontSize: 13,
    color: '#777',
    lineHeight: 19,
    fontStyle: 'italic',
    marginTop: 2,
  },
  // Empty
  emptyMovies: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: '#555',
  },
  // Footer
  footer: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 4,
  },
  footerText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#444',
  },
  footerSub: {
    fontSize: 13,
    color: '#333',
  },
});
