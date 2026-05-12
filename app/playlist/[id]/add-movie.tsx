import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../../src/hooks/useAuth';
import { searchMovies, TmdbMovie, getPosterUrl } from '../../../src/lib/tmdb';
import { addMovieToPlaylist } from '../../../src/lib/playlistMovieService';

export default function AddMovieScreen() {
  const { id: playlistId } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<TmdbMovie[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [addingId, setAddingId] = useState<number | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setResults([]);
      setSearchError(null);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      setSearchError(null);
      const { results: res, error } = await searchMovies(query);
      setIsSearching(false);
      if (error) {
        setSearchError(error);
      } else {
        setResults(res);
      }
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  async function handleAdd(movie: TmdbMovie) {
    if (!playlistId || !user?.id || addingId !== null) return;
    setAddingId(movie.id);
    const { error } = await addMovieToPlaylist(playlistId, user.id, movie);
    setAddingId(null);
    if (error) {
      Alert.alert('Could Not Add', error);
    } else {
      router.back();
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.navTitle}>Add Movie</Text>
        <View style={styles.navSpacer} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.searchRow}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search movies..."
            placeholderTextColor="#555"
            value={query}
            onChangeText={setQuery}
            autoFocus
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
          />
          {isSearching && (
            <ActivityIndicator style={styles.searchSpinner} color="#888" />
          )}
        </View>

        {searchError !== null && (
          <View style={styles.centeredState}>
            <Text style={styles.errorText}>{searchError}</Text>
          </View>
        )}

        {searchError === null && query.trim().length === 0 && (
          <View style={styles.centeredState}>
            <Text style={styles.hintText}>Type to search movies</Text>
          </View>
        )}

        {searchError === null &&
          query.trim().length > 0 &&
          !isSearching &&
          results.length === 0 && (
            <View style={styles.centeredState}>
              <Text style={styles.emptyText}>No results for "{query}"</Text>
            </View>
          )}

        <FlatList
          data={results}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <MovieResultItem
              movie={item}
              isAdding={addingId === item.id}
              disabled={addingId !== null}
              onAdd={() => handleAdd(item)}
            />
          )}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function MovieResultItem({
  movie,
  isAdding,
  disabled,
  onAdd,
}: {
  movie: TmdbMovie;
  isAdding: boolean;
  disabled: boolean;
  onAdd: () => void;
}) {
  const posterUrl = getPosterUrl(movie.poster_path);
  const year = movie.release_date ? movie.release_date.slice(0, 4) : null;

  return (
    <View style={styles.resultItem}>
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
        {year ? <Text style={styles.movieYear}>{year}</Text> : null}
        {movie.overview ? (
          <Text style={styles.movieOverview} numberOfLines={2}>
            {movie.overview}
          </Text>
        ) : null}
      </View>
      <TouchableOpacity
        style={[styles.addButton, disabled && styles.addButtonDisabled]}
        onPress={onAdd}
        disabled={disabled}
        activeOpacity={0.7}
      >
        {isAdding ? (
          <ActivityIndicator color="#000000" size="small" />
        ) : (
          <Text style={styles.addButtonText}>+</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f0f',
  },
  flex: {
    flex: 1,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1c1c1e',
  },
  backText: {
    fontSize: 16,
    color: '#ffffff',
    minWidth: 60,
  },
  navTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  navSpacer: {
    minWidth: 60,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 12,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#1c1c1e',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#ffffff',
    borderWidth: 1,
    borderColor: '#2c2c2e',
  },
  searchSpinner: {
    marginLeft: 10,
  },
  centeredState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  hintText: {
    fontSize: 15,
    color: '#555',
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 15,
    color: '#ff453a',
    textAlign: 'center',
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1c1c1e',
    gap: 12,
  },
  poster: {
    width: 54,
    height: 80,
    borderRadius: 6,
    backgroundColor: '#1c1c1e',
  },
  posterPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  posterPlaceholderIcon: {
    fontSize: 20,
  },
  movieInfo: {
    flex: 1,
    gap: 3,
    paddingTop: 2,
  },
  movieTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
    lineHeight: 20,
  },
  movieYear: {
    fontSize: 13,
    color: '#888',
  },
  movieOverview: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
    marginTop: 2,
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
    flexShrink: 0,
  },
  addButtonDisabled: {
    opacity: 0.4,
  },
  addButtonText: {
    fontSize: 22,
    fontWeight: '300',
    color: '#000000',
    lineHeight: 26,
  },
});
