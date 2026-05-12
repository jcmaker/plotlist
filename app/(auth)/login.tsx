import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../src/lib/supabase';
import { signInWithOAuth, OAuthProvider } from '../../src/lib/oauthHelpers';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [oauthProvider, setOauthProvider] = useState<OAuthProvider | null>(null);
  const router = useRouter();

  const isBusy = isLoading || oauthProvider !== null;
  const canSubmit = email.trim().length > 0 && password.length > 0 && !isBusy;

  async function handleSignIn() {
    if (!canSubmit) return;
    setIsLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setIsLoading(false);
    if (error) Alert.alert('Sign In Failed', error.message);
    // On success: onAuthStateChange → AuthGuard redirects to /(tabs)
  }

  async function handleOAuth(provider: OAuthProvider) {
    if (isBusy) return;
    setOauthProvider(provider);
    const { error } = await signInWithOAuth(provider);
    setOauthProvider(null);
    if (error) Alert.alert('Sign In Failed', error);
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logo}>Plotlist</Text>
        <Text style={styles.tagline}>Your movies. Your lists. Your story.</Text>
      </View>

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.form}
        keyboardShouldPersistTaps="handled"
        scrollEnabled={false}
      >
        {/* ── Email / Password ── */}
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
          editable={!isBusy}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#666"
          secureTextEntry
          returnKeyType="done"
          onSubmitEditing={handleSignIn}
          value={password}
          onChangeText={setPassword}
          editable={!isBusy}
        />

        <TouchableOpacity
          style={[styles.button, !canSubmit && styles.buttonDisabled]}
          onPress={handleSignIn}
          disabled={!canSubmit}
        >
          {isLoading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.buttonText}>Sign In</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => router.push('/(auth)/signup')}
          disabled={isBusy}
        >
          <Text style={styles.secondaryButtonText}>Create Account</Text>
        </TouchableOpacity>

        {/* ── Divider ── */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* ── Google ── */}
        <TouchableOpacity
          style={[styles.socialButton, styles.googleButton, isBusy && styles.socialButtonDisabled]}
          onPress={() => handleOAuth('google')}
          disabled={isBusy}
          activeOpacity={0.8}
        >
          {oauthProvider === 'google' ? (
            <ActivityIndicator color="#000000" />
          ) : (
            <>
              <Text style={styles.googleIcon}>G</Text>
              <Text style={styles.googleText}>Sign in with Google</Text>
            </>
          )}
        </TouchableOpacity>

        {/* ── Kakao ── */}
        <TouchableOpacity
          style={[styles.socialButton, styles.kakaoButton, isBusy && styles.socialButtonDisabled]}
          onPress={() => handleOAuth('kakao')}
          disabled={isBusy}
          activeOpacity={0.8}
        >
          {oauthProvider === 'kakao' ? (
            <ActivityIndicator color="#3C1E1E" />
          ) : (
            <>
              <Text style={styles.kakaoIcon}>💬</Text>
              <Text style={styles.kakaoText}>카카오로 로그인</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f0f',
    paddingHorizontal: 24,
  },
  flex: {
    flex: 1,
  },
  header: {
    paddingTop: 48,
    paddingBottom: 36,
    alignItems: 'center',
  },
  logo: {
    fontSize: 40,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: -1,
  },
  tagline: {
    fontSize: 15,
    color: '#888',
    marginTop: 8,
    textAlign: 'center',
  },
  form: {
    gap: 12,
    paddingBottom: 32,
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
    marginTop: 4,
  },
  buttonDisabled: {
    backgroundColor: '#2c2c2e',
  },
  buttonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#888',
    fontSize: 15,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 4,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#2c2c2e',
  },
  dividerText: {
    fontSize: 13,
    color: '#555',
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingVertical: 14,
    gap: 10,
  },
  socialButtonDisabled: {
    opacity: 0.5,
  },
  // Google
  googleButton: {
    backgroundColor: '#ffffff',
  },
  googleIcon: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4285F4',
  },
  googleText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000000',
  },
  // Kakao
  kakaoButton: {
    backgroundColor: '#FEE500',
  },
  kakaoIcon: {
    fontSize: 16,
  },
  kakaoText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#3C1E1E',
  },
});
