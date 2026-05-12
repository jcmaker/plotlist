import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/hooks/useAuth';
import {
  createPlaylist,
  resolveUniqueSlug,
  toSlug,
} from '../../src/lib/playlistService';
import { PlaylistVisibility } from '../../src/types';

const VISIBILITY_OPTIONS: { value: PlaylistVisibility; label: string; hint: string }[] = [
  { value: 'private', label: 'Private', hint: 'Only you can see this' },
  { value: 'unlisted', label: 'Unlisted', hint: 'Anyone with the link' },
  { value: 'public', label: 'Public', hint: 'Visible to everyone' },
];

export default function NewPlaylistScreen() {
  const { user } = useAuth();
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [visibility, setVisibility] = useState<PlaylistVisibility>('private');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const canSave = title.trim().length > 0 && slug.length > 0 && !isSaving;

  function handleTitleChange(text: string) {
    setTitle(text);
    if (!slugTouched) {
      setSlug(toSlug(text));
    }
  }

  function handleSlugChange(text: string) {
    setSlugTouched(true);
    setSlug(text.toLowerCase().replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-'));
  }

  async function handleSave() {
    if (!canSave || !user) return;

    setIsSaving(true);
    setSaveError(null);

    const finalSlug = await resolveUniqueSlug(user.id, slug || toSlug(title));
    const { data, error } = await createPlaylist(user.id, {
      title: title.trim(),
      description: description.trim(),
      slug: finalSlug,
      visibility,
    });

    setIsSaving(false);

    if (error || !data) {
      setSaveError(error ?? 'Something went wrong. Please try again.');
      return;
    }

    router.replace(`/playlist/${data.id}`);
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.navBar}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.navTitle}>New List</Text>
          <TouchableOpacity
            onPress={handleSave}
            disabled={!canSave}
          >
            {isSaving ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <Text style={[styles.saveText, !canSave && styles.saveTextDisabled]}>
                Save
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.form}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Title *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Best Heist Movies"
              placeholderTextColor="#555"
              value={title}
              onChangeText={handleTitleChange}
              autoFocus
              returnKeyType="next"
              editable={!isSaving}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Slug</Text>
            <TextInput
              style={styles.input}
              placeholder="best-heist-movies"
              placeholderTextColor="#555"
              value={slug}
              onChangeText={handleSlugChange}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
              editable={!isSaving}
            />
            <Text style={styles.hint}>
              Used in share URLs. Auto-generated from title.
            </Text>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="What's this list about?"
              placeholderTextColor="#555"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              editable={!isSaving}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Visibility</Text>
            <View style={styles.visibilityRow}>
              {VISIBILITY_OPTIONS.map(({ value, label }) => (
                <TouchableOpacity
                  key={value}
                  style={[
                    styles.visibilityOption,
                    visibility === value && styles.visibilitySelected,
                  ]}
                  onPress={() => setVisibility(value)}
                  disabled={isSaving}
                >
                  <Text
                    style={[
                      styles.visibilityLabel,
                      visibility === value && styles.visibilityLabelSelected,
                    ]}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.hint}>
              {VISIBILITY_OPTIONS.find((o) => o.value === visibility)?.hint}
            </Text>
          </View>

          {saveError ? (
            <Text style={styles.errorText}>{saveError}</Text>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
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
  cancelText: {
    fontSize: 16,
    color: '#888',
  },
  navTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  saveText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  saveTextDisabled: {
    color: '#444',
  },
  form: {
    padding: 20,
    gap: 24,
  },
  fieldGroup: {
    gap: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: '#1c1c1e',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 16,
    color: '#ffffff',
    borderWidth: 1,
    borderColor: '#2c2c2e',
  },
  textArea: {
    minHeight: 80,
    paddingTop: 13,
  },
  hint: {
    fontSize: 12,
    color: '#555',
  },
  visibilityRow: {
    flexDirection: 'row',
    gap: 8,
  },
  visibilityOption: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#1c1c1e',
    borderWidth: 1,
    borderColor: '#2c2c2e',
  },
  visibilitySelected: {
    backgroundColor: '#ffffff',
    borderColor: '#ffffff',
  },
  visibilityLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  visibilityLabelSelected: {
    color: '#000000',
  },
  errorText: {
    fontSize: 14,
    color: '#ff453a',
    textAlign: 'center',
  },
});
