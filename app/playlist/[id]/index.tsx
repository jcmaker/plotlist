import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../../src/hooks/useAuth';
import { usePlaylist } from '../../../src/hooks/usePlaylist';
import { deletePlaylist } from '../../../src/lib/playlistService';
import { PlaylistVisibility } from '../../../src/types';

const VISIBILITY_LABEL: Record<PlaylistVisibility, string> = {
  private: '🔒 Private',
  unlisted: '🔗 Unlisted',
  public: '🌍 Public',
};

export default function PlaylistDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { playlist, isLoading, hasError, refetch } = usePlaylist(id, user?.id);
  const router = useRouter();

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
          <Text style={styles.stateText}>Loading...</Text>
        </View>
      )}

      {!isLoading && hasError && (
        <View style={styles.centeredState}>
          <Text style={styles.stateText}>Could not load playlist.</Text>
          <TouchableOpacity style={styles.retryButton} onPress={refetch}>
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      )}

      {!isLoading && !hasError && playlist && (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.coverPlaceholder}>
            <Text style={styles.coverIcon}>🎬</Text>
          </View>

          <View style={styles.info}>
            <Text style={styles.playlistTitle}>{playlist.title}</Text>
            <Text style={styles.visibilityText}>
              {VISIBILITY_LABEL[playlist.visibility]}
            </Text>
            {playlist.description ? (
              <Text style={styles.description}>{playlist.description}</Text>
            ) : null}
            <Text style={styles.slugText}>/{playlist.slug}</Text>
          </View>

          <View style={styles.moviesSection}>
            <Text style={styles.sectionTitle}>Movies</Text>
            <View style={styles.emptyMovies}>
              <Text style={styles.emptyMoviesText}>No movies yet</Text>
              <Text style={styles.emptyMoviesHint}>
                Movie search coming in Task 4
              </Text>
            </View>
          </View>

          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
            <Text style={styles.deleteButtonText}>Delete Playlist</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </SafeAreaView>
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
  content: {
    paddingBottom: 40,
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
  moviesSection: {
    paddingHorizontal: 20,
    paddingTop: 24,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  emptyMovies: {
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
  deleteButton: {
    marginHorizontal: 20,
    marginTop: 32,
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
});
