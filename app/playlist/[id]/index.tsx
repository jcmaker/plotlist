import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../../src/hooks/useAuth';
import { usePlaylist } from '../../../src/hooks/usePlaylist';
import { usePlaylistMovies } from '../../../src/hooks/usePlaylistMovies';
import { deletePlaylist } from '../../../src/lib/playlistService';
import {
  removeMovieFromPlaylist,
  updatePlaylistMovieMeta,
} from '../../../src/lib/playlistMovieService';
import { getPosterUrl } from '../../../src/lib/tmdb';
import { PlaylistMovie, PlaylistVisibility } from '../../../src/types';

const VISIBILITY_LABEL: Record<PlaylistVisibility, string> = {
  private: '🔒 Private',
  unlisted: '🔗 Unlisted',
  public: '🌍 Public',
};

export default function PlaylistDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { playlist, isLoading: playlistLoading, hasError: playlistError, refetch: refetchPlaylist } =
    usePlaylist(id, user?.id);
  const { movies, isLoading: moviesLoading, refetch: refetchMovies } =
    usePlaylistMovies(id);
  const router = useRouter();

  const [editingMovie, setEditingMovie] = useState<PlaylistMovie | null>(null);
  const [modalRating, setModalRating] = useState('');
  const [modalNote, setModalNote] = useState('');
  const [isSavingMeta, setIsSavingMeta] = useState(false);

  // Refetch everything when screen comes into focus (e.g. after add-movie or edit)
  useFocusEffect(
    useCallback(() => {
      refetchPlaylist();
      refetchMovies();
    }, [refetchPlaylist, refetchMovies])
  );

  function openEditModal(movie: PlaylistMovie) {
    setEditingMovie(movie);
    setModalRating(movie.personalRating != null ? String(movie.personalRating) : '');
    setModalNote(movie.note ?? '');
  }

  async function handleSaveMeta() {
    if (!editingMovie) return;
    const ratingNum = modalRating.trim() ? parseInt(modalRating.trim(), 10) : null;
    if (ratingNum !== null && (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 10)) {
      Alert.alert('Invalid Rating', 'Rating must be a number between 1 and 10.');
      return;
    }
    setIsSavingMeta(true);
    const { error } = await updatePlaylistMovieMeta(editingMovie.id, {
      personalRating: ratingNum,
      note: modalNote.trim() || null,
    });
    setIsSavingMeta(false);
    if (error) {
      Alert.alert('Error', error);
      return;
    }
    setEditingMovie(null);
    refetchMovies();
  }

  async function handleRemoveMovie(movie: PlaylistMovie) {
    Alert.alert(
      'Remove Movie',
      `Remove "${movie.title}" from this playlist?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            const { error } = await removeMovieFromPlaylist(movie.id);
            if (error) {
              Alert.alert('Error', error);
              return;
            }
            refetchMovies();
          },
        },
      ]
    );
  }

  async function handleDelete() {
    if (!id) return;
    Alert.alert(
      'Delete Playlist',
      `"${playlist?.title}" will be permanently deleted.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const { error } = await deletePlaylist(id);
            if (error) {
              Alert.alert('Error', error);
              return;
            }
            router.replace('/(tabs)/playlists');
          },
        },
      ]
    );
  }

  const isLoading = playlistLoading || moviesLoading;

  // Use first movie poster as cover when available
  const coverPosterUrl =
    movies.length > 0 ? getPosterUrl(movies[0].posterPath) : null;

  const ListHeader = (
    <>
      {/* Cover */}
      {coverPosterUrl ? (
        <Image source={{ uri: coverPosterUrl }} style={styles.coverImage} />
      ) : (
        <View style={styles.coverPlaceholder}>
          <Text style={styles.coverIcon}>🎬</Text>
        </View>
      )}

      {/* Info */}
      <View style={styles.info}>
        <Text style={styles.playlistTitle}>{playlist?.title ?? ''}</Text>
        <Text style={styles.visibilityText}>
          {VISIBILITY_LABEL[playlist?.visibility ?? 'private']}
        </Text>
        {playlist?.description ? (
          <Text style={styles.description}>{playlist.description}</Text>
        ) : null}
        <Text style={styles.slugText}>/{playlist?.slug ?? ''}</Text>
      </View>

      {/* Movies section header */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          Movies{movies.length > 0 ? ` (${movies.length})` : ''}
        </Text>
        <TouchableOpacity
          style={styles.addMovieButton}
          onPress={() => router.push(`/playlist/${id}/add-movie`)}
          activeOpacity={0.7}
        >
          <Text style={styles.addMovieButtonText}>+ Add Movie</Text>
        </TouchableOpacity>
      </View>
    </>
  );

  const ListFooter = (
    <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
      <Text style={styles.deleteButtonText}>Delete Playlist</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        {playlist && (
          <TouchableOpacity onPress={() => router.push(`/playlist/${id}/edit`)}>
            <Text style={styles.editText}>Edit</Text>
          </TouchableOpacity>
        )}
      </View>

      {isLoading && (
        <View style={styles.centeredState}>
          <ActivityIndicator color="#888" />
        </View>
      )}

      {!isLoading && playlistError && (
        <View style={styles.centeredState}>
          <Text style={styles.stateText}>Could not load playlist.</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => { refetchPlaylist(); refetchMovies(); }}
          >
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      )}

      {!isLoading && !playlistError && playlist && (
        <FlatList
          data={movies}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={ListHeader}
          ListFooterComponent={ListFooter}
          ListEmptyComponent={
            <View style={styles.emptyMovies}>
              <Text style={styles.emptyMoviesText}>No movies yet</Text>
              <Text style={styles.emptyMoviesHint}>Tap "+ Add Movie" to get started</Text>
            </View>
          }
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <MovieCard
              movie={item}
              onEdit={() => openEditModal(item)}
              onRemove={() => handleRemoveMovie(item)}
            />
          )}
        />
      )}

      {/* Rating / Note edit modal */}
      <Modal
        visible={editingMovie !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setEditingMovie(null)}
      >
        <KeyboardAvoidingView
          style={styles.modalBackdrop}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle} numberOfLines={1}>
              {editingMovie?.title}
            </Text>

            <Text style={styles.modalLabel}>Rating (1–10)</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. 8"
              placeholderTextColor="#555"
              value={modalRating}
              onChangeText={setModalRating}
              keyboardType="number-pad"
              maxLength={2}
            />

            <Text style={styles.modalLabel}>Note</Text>
            <TextInput
              style={[styles.modalInput, styles.modalTextArea]}
              placeholder="Short personal note…"
              placeholderTextColor="#555"
              value={modalNote}
              onChangeText={setModalNote}
              multiline
              maxLength={300}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setEditingMovie(null)}
                disabled={isSavingMeta}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSaveButton, isSavingMeta && styles.modalSaveButtonDisabled]}
                onPress={handleSaveMeta}
                disabled={isSavingMeta}
              >
                {isSavingMeta ? (
                  <ActivityIndicator color="#000000" size="small" />
                ) : (
                  <Text style={styles.modalSaveText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

function MovieCard({
  movie,
  onEdit,
  onRemove,
}: {
  movie: PlaylistMovie;
  onEdit: () => void;
  onRemove: () => void;
}) {
  const posterUrl = getPosterUrl(movie.posterPath);

  return (
    <View style={styles.movieCard}>
      {posterUrl ? (
        <Image source={{ uri: posterUrl }} style={styles.moviePoster} />
      ) : (
        <View style={[styles.moviePoster, styles.moviePosterPlaceholder]}>
          <Text style={styles.moviePosterIcon}>🎬</Text>
        </View>
      )}
      <View style={styles.movieCardInfo}>
        <Text style={styles.movieCardTitle} numberOfLines={2}>
          {movie.title}
        </Text>
        {movie.releaseYear ? (
          <Text style={styles.movieCardYear}>{movie.releaseYear}</Text>
        ) : null}
        {movie.personalRating != null ? (
          <Text style={styles.movieCardRating}>★ {movie.personalRating}/10</Text>
        ) : null}
        {movie.note ? (
          <Text style={styles.movieCardNote} numberOfLines={2}>
            {movie.note}
          </Text>
        ) : null}
      </View>
      <View style={styles.movieCardActions}>
        <TouchableOpacity style={styles.iconButton} onPress={onEdit}>
          <Text style={styles.iconButtonText}>✏️</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton} onPress={onRemove}>
          <Text style={styles.iconButtonText}>🗑️</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f0f',
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
  },
  editText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '600',
  },
  centeredState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  stateText: {
    fontSize: 15,
    color: '#666',
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#1c1c1e',
    borderRadius: 8,
  },
  retryText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  listContent: {
    paddingBottom: 48,
  },
  // Cover
  coverImage: {
    width: '100%',
    height: 220,
    resizeMode: 'cover',
  },
  coverPlaceholder: {
    height: 180,
    backgroundColor: '#1c1c1e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  coverIcon: {
    fontSize: 56,
  },
  // Info
  info: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#1c1c1e',
  },
  playlistTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  visibilityText: {
    fontSize: 14,
    color: '#888',
  },
  description: {
    fontSize: 15,
    color: '#aaa',
    lineHeight: 22,
    marginTop: 4,
  },
  slugText: {
    fontSize: 12,
    color: '#555',
    fontFamily: 'monospace',
    marginTop: 4,
  },
  // Section header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  addMovieButton: {
    backgroundColor: '#1c1c1e',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: '#2c2c2e',
  },
  addMovieButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  // Empty state
  emptyMovies: {
    marginHorizontal: 20,
    backgroundColor: '#1c1c1e',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    gap: 6,
  },
  emptyMoviesText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
  },
  emptyMoviesHint: {
    fontSize: 13,
    color: '#555',
  },
  // Movie card
  movieCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginHorizontal: 16,
    marginBottom: 2,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1c1c1e',
    gap: 12,
  },
  moviePoster: {
    width: 54,
    height: 80,
    borderRadius: 6,
    backgroundColor: '#1c1c1e',
  },
  moviePosterPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  moviePosterIcon: {
    fontSize: 20,
  },
  movieCardInfo: {
    flex: 1,
    gap: 3,
    paddingTop: 2,
  },
  movieCardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
    lineHeight: 20,
  },
  movieCardYear: {
    fontSize: 13,
    color: '#888',
  },
  movieCardRating: {
    fontSize: 13,
    color: '#f5c518',
  },
  movieCardNote: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
    fontStyle: 'italic',
  },
  movieCardActions: {
    flexDirection: 'column',
    gap: 4,
    paddingTop: 4,
  },
  iconButton: {
    padding: 6,
  },
  iconButtonText: {
    fontSize: 16,
  },
  // Delete button (footer)
  deleteButton: {
    marginHorizontal: 20,
    marginTop: 40,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#5c1a1a',
    alignItems: 'center',
  },
  deleteButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ff453a',
  },
  // Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: '#1c1c1e',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    gap: 12,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  modalLabel: {
    fontSize: 13,
    color: '#888',
    marginBottom: -6,
  },
  modalInput: {
    backgroundColor: '#0f0f0f',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#ffffff',
    borderWidth: 1,
    borderColor: '#2c2c2e',
  },
  modalTextArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#2c2c2e',
  },
  modalCancelText: {
    fontSize: 15,
    color: '#ffffff',
    fontWeight: '600',
  },
  modalSaveButton: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  modalSaveButtonDisabled: {
    opacity: 0.5,
  },
  modalSaveText: {
    fontSize: 15,
    color: '#000000',
    fontWeight: '700',
  },
});
