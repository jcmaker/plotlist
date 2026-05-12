import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../src/lib/supabase';

export default function SignupScreen() {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const canSubmit =
    displayName.trim().length >= 2 &&
    email.trim().length > 0 &&
    password.length >= 6 &&
    !isLoading;

  async function handleSignUp() {
    if (!canSubmit) return;

    setIsLoading(true);
    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { full_name: displayName.trim() },
      },
    });
    setIsLoading(false);

    if (error) {
      Alert.alert('Sign Up Failed', error.message);
      return;
    }

    Alert.alert(
      'Check your email',
      'We sent a confirmation link to ' +
        email.trim() +
        '. Tap the link to activate your account, then come back and sign in.\n\nTip: If you\'re testing locally, disable "Confirm email" in Supabase → Authentication → Providers → Email.',
      [{ text: 'OK', onPress: () => router.back() }]
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      <View style={styles.header}>
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>
          Join Plotlist and start building movie lists.
        </Text>
      </View>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Display Name"
          placeholderTextColor="#666"
          autoCapitalize="words"
          autoCorrect={false}
          returnKeyType="next"
          value={displayName}
          onChangeText={setDisplayName}
          editable={!isLoading}
        />
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#666"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="next"
          value={email}
          onChangeText={setEmail}
          editable={!isLoading}
        />
        <TextInput
          style={styles.input}
          placeholder="Password (min. 6 characters)"
          placeholderTextColor="#666"
          secureTextEntry
          returnKeyType="done"
          onSubmitEditing={handleSignUp}
          value={password}
          onChangeText={setPassword}
          editable={!isLoading}
        />

        <TouchableOpacity
          style={[styles.button, !canSubmit && styles.buttonDisabled]}
          onPress={handleSignUp}
          disabled={!canSubmit}
        >
          {isLoading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.buttonText}>Create Account</Text>
          )}
        </TouchableOpacity>
      </View>

      <Text style={styles.note}>
        Your handle will be auto-generated. You can customize it later.
      </Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f0f',
    paddingHorizontal: 24,
  },
  backButton: {
    paddingVertical: 12,
    alignSelf: 'flex-start',
  },
  backText: {
    color: '#888',
    fontSize: 16,
  },
  header: {
    paddingVertical: 24,
    gap: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: '#888',
    lineHeight: 22,
  },
  form: {
    gap: 12,
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
  button: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    backgroundColor: '#2c2c2e',
  },
  buttonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '700',
  },
  note: {
    textAlign: 'center',
    color: '#555',
    fontSize: 13,
    marginTop: 24,
    lineHeight: 18,
  },
});
