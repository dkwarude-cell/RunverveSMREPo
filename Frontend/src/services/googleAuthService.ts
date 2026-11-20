/**
 * googleAuthService.ts - Google Sign-In -> Firebase credential.
 */
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { getAuth, GoogleAuthProvider, signInWithCredential } from '@react-native-firebase/auth';

GoogleSignin.configure({
  webClientId: '6060358211-p7cqonn5730den70qbo1qdegs3qrapln.apps.googleusercontent.com',
});

export const GoogleAuthService = {
  async signIn() {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const response = await GoogleSignin.signIn();
    if (response.type !== 'success') {
      throw new Error('Google Sign-In was cancelled');
    }
    const { idToken } = response.data;
    if (!idToken) {
      throw new Error('Google ID token was not returned');
    }
    const credential = GoogleAuthProvider.credential(idToken);
    const result = await signInWithCredential(getAuth(), credential);
    return result.user;
  },

  async signOut() {
    try {
      await GoogleSignin.signOut();
    } catch {
      // not signed in with Google - nothing to do
    }
  },
};
