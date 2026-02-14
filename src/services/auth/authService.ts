import { User } from '../../models/User';

/**
 * DEV auth service — accepts any email/password for development.
 * Replace with real Firebase auth in production.
 */

function createMockUser(email: string, name?: string): User {
  return {
    id: 'dev-user-' + Date.now(),
    name: name ?? email.split('@')[0],
    email,
    profileType: 'wellness',
    age: 0,
    weight: 0,
    height: 0,
    gender: 'prefer_not_to_say',
    activityLevel: 'moderately_active',
    interests: [],
    onboardingComplete: true,
    avatarUrl: undefined,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

export async function login(email: string, _password: string): Promise<User> {
  // Simulate network delay
  await new Promise((r) => setTimeout(r, 500));
  return createMockUser(email);
}

export async function signup(email: string, _password: string, name: string): Promise<User> {
  await new Promise((r) => setTimeout(r, 500));
  return createMockUser(email, name);
}

export async function logout(): Promise<void> {
  await new Promise((r) => setTimeout(r, 200));
}

export async function resetPassword(_email: string): Promise<void> {
  await new Promise((r) => setTimeout(r, 300));
}

export function getCurrentUser(): User | null {
  // DEV: no persistent session
  return null;
}

export function onAuthStateChanged(callback: (user: User | null) => void): () => void {
  // DEV: no-op listener
  callback(null);
  return () => {};
}
