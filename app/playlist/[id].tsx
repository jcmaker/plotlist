import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function PlaylistDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.coverPlaceholder}>
        <Text style={styles.coverIcon}>🎬</Text>
      </View>

      <View style={styles.info}>
        <Text style={styles.playlistTitle}>Playlist Title</Text>
        <Text style={styles.meta}>0 movies · private</Text>
        <Text style={styles.description}>Playlist description goes here.</Text>
      </View>

      <View style={styles.moviesPlaceholder}>
        <Text style={styles.noMovies}>No movies yet</Text>
        <Text style={styles.debugId}>playlist id: {id}</Text>
        <Text style={styles.comingSoon}>Coming in Task 3 — Playlists</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f0f',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backButton: {
    alignSelf: 'flex-start',
  },
  backText: {
    color: '#ffffff',
    fontSize: 16,
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
  info: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#1c1c1e',
  },
  playlistTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  meta: {
    fontSize: 14,
    color: '#666',
  },
  description: {
    fontSize: 15,
    color: '#888',
    marginTop: 4,
    lineHeight: 22,
  },
  moviesPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  noMovies: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  debugId: {
    fontSize: 12,
    color: '#444',
    fontFamily: 'monospace',
  },
  comingSoon: {
    fontSize: 13,
    color: '#444',
  },
});
