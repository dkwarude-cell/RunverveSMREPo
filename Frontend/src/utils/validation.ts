/** validation.ts - small input checks shared by the auth screens. */

export const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

export const isValidPhone = (phone: string) => /^\d{10}$/.test(phone.trim());

export const digitsOnly = (text: string, max = 10) => text.replace(/[^0-9]/g, '').slice(0, max);

/** Friendly messages for Firebase auth error codes. */
export function firebaseAuthMessage(error: any, fallback = 'Something went wrong. Please try again.'): string {
  switch (error?.code) {
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/user-not-found':
      return 'No account found with this email.';
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Incorrect email or password.';
    case 'auth/user-disabled':
      return 'This account has been disabled.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a moment and try again.';
    case 'auth/network-request-failed':
      return 'No internet connection. Please check your network.';
    default:
      return (error?.message || fallback).replace(/^\[[^\]]+\]\s*/, '');
  }
}
