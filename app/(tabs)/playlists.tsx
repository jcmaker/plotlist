import { useCallback } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { useAuth } from '../../src/hooks/useAuth';
import { usePlaylists } from '../../src/hooks/usePlaylists';
import { Playlist, PlaylistVisibility } from '../../src/types';

const VISIBILITY_LABEL: Record<PlaylistVisibility, string> = {
  private: 'Private',
  unlisted: 'Unlisted',
  public: 'Public',
};

const VISIBILITY_COLOR: Record<PlaylistVisibility, string> = {
  private: '#444',
  unlisted: '#7a6400',
  public: '#1a5c2a',
};

function PlaylistItem({
  playlist,
  onPress,
}: {
  playlist: Playlist;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.item} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.itemContent}>
        <View style={styles.itemHeader}>
          <Text style={styles.itemTitle} numberOfLines={1}>
            {playlist.title}
          </Text>
          <View
            style={[
              styles.visibilityBadge,
              { backgroundColor: VISIBILITY_COLOR[playlist.visibility] },
            ]}
          >
            <Text style={styles.visibilityBadgeText}>
              {VISIBILITY_LABEL[playlist.visibility]}
            </Text>
          </View>
        </View>
        {playlist.description ? (
          <Text style={styles.itemDescription} numberOfLines={2}>
            {playlist.description}
          </Text>
        ) : null}
      </View>
      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  );
}

export default function PlaylistsScreen() {
  const { user } = useAuth();
  const { playlists, isLoading, hasError, refetch } = usePlaylists(user?.id);
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Lists</Text>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => router.push('/playlist/new')}
        >
          <Text style={styles.createButtonText}>+ New List</Text>
        </TouchableOpacity>
      </View>

      {isLoading && (
        <View style={styles.centeredState}>
          <ActivityIndicator color="#ffffff" />
        </View>
      )}

      {!isLoading && hasError && (
        <View style={styles.centeredState}>
          <Text style={styles.errorText}>Could not load playlists.</Text>
          <TouchableOpacity style={styles.retryButton} onPress={refetch}>
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      )}

      {!isLoading && !hasError && playlists.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🎬</Text>
          <Text style={styles.emptyTitle}>No lists yet</Text>
          <Text style={styles.emptyBody}>
            Create your first movie playlist and start sharing.
          </Text>
          <TouchableOpacity
            style={styles.emptyCreateButton}
            onPress={() => router.push('/playlist/new')}
          >
            <Text style={styles.emptyCreateText}>Create a List</Text>
          </TouchableOpacity>
        </View>
      )}

      {!isLoading && !hasError && playlists.length > 0 && (
        <FlatList
          data={playlists}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <PlaylistItem
              playlist={item}
              onPress={() => router.push(`/playlist/${item.id}`)}
            />
          )}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f0f',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1c1c1e',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  createButton: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  createButtonText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '600',
  },
  centeredState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  errorText: {
    color: '#666',
    fontSize: 15,
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
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 10,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
  },
  emptyBody: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  emptyCreateButton: {
    marginTop: 8,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  emptyCreateText: {
    color: '#000000',
    fontSize: 15,
    fontWeight: '700',
  },
  list: {
    paddingVertical: 8,
  },
  separator: {
    height: 1,
    backgroundColor: '#1c1c1e',
    marginLeft: 20,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  itemContent: {
    flex: 1,
    gap: 4,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    flexShrink: 1,
  },
  visibilityBadge: {
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  visibilityBadgeText: {
    fontSize: 11,
    color: '#cccccc',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  itemDescription: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  chevron: {
    fontSize: 22,
    color: '#555',
    marginLeft: 8,
  },
});
