import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { supabase } from './supabase';

// Required for Android Chrome Custom Tabs to close properly after redirect
WebBrowser.maybeCompleteAuthSession();

export type OAuthProvider = 'google' | 'kakao';

// Linking.createURL returns the correct scheme for each environment:
//   Expo Go  → exp://[ip]:[port]/--/auth/callback
//   Dev/prod build → plotlist://auth/callback
const redirectUri = Linking.createURL('auth/callback');

// Print on startup so you can copy the exact URI into Supabase
// Authentication → URL Configuration → Additional Redirect URLs
if (__DEV__) {
  console.log('[OAuth] redirectUri =', redirectUri);
}

export async function signInWithOAuth(
  provider: OAuthProvider
): Promise<{ error: string | null }> {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: redirectUri,
        skipBrowserRedirect: true,
      },
    });

    if (error || !data.url) {
      return { error: error?.message ?? 'Could not start sign-in. Try again.' };
    }

    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUri);

    if (result.type === 'success') {
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(
        result.url
      );
      if (exchangeError) return { error: exchangeError.message };
    }
    // 'cancel' / 'dismiss' → 사용자가 브라우저 닫음, 아무것도 하지 않음

    return { error: null };
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unexpected error. Try again.';
    return { error: message };
  }
}
