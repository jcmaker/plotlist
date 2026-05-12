import { StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SearchScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Search Movies</Text>
      </View>

      <View style={styles.searchBar}>
        <TextInput
          style={styles.input}
          placeholder="Search by title..."
          placeholderTextColor="#555"
          editable={false}
        />
      </View>

      <View style={styles.placeholder}>
        <Text style={styles.placeholderTitle}>Find any movie</Text>
        <Text style={styles.placeholderBody}>
          Search the TMDB database and add movies directly to your playlists.
        </Text>
        <Text style={styles.comingSoon}>Coming in Task 4 — Movie Search</Text>
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
  searchBar: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  input: {
    backgroundColor: '#1c1c1e',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#ffffff',
    borderWidth: 1,
    borderColor: '#2c2c2e',
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  placeholderTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
  },
  placeholderBody: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  comingSoon: {
    fontSize: 13,
    color: '#444',
    marginTop: 8,
  },
});
