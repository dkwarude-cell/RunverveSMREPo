import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  User as FirebaseUser,
  updateProfile,
} from 'firebase/auth';
import { getFirebaseApp } from '../../config/firebase.config';
import { User } from '../../models/User';

function getAuthInstance() {
  return getAuth(getFirebaseApp());
}

function firebaseUserToUser(fbUser: FirebaseUser): User {
  return {
    id: fbUser.uid,
    name: fbUser.displayName ?? '',
    email: fbUser.email ?? '',
    profileType: 'wellness',
    age: 0,
    weight: 0,
    height: 0,
    gender: 'prefer_not_to_say',
    activityLevel: 'moderately_active',
    interests: [],
    onboardingComplete: false,
    avatarUrl: fbUser.photoURL ?? undefined,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

export async function login(email: string, password: string): Promise<User> {
  const auth = getAuthInstance();
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return firebaseUserToUser(credential.user);
}

export async function signup(email: string, password: string, name: string): Promise<User> {
  const auth = getAuthInstance();
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(credential.user, { displayName: name });
  return firebaseUserToUser(credential.user);
}

export async function logout(): Promise<void> {
  const auth = getAuthInstance();
  await signOut(auth);
}

export async function resetPassword(email: string): Promise<void> {
  const auth = getAuthInstance();
  await sendPasswordResetEmail(auth, email);
}

export function getCurrentUser(): User | null {
  const auth = getAuthInstance();
  const fbUser = auth.currentUser;
  return fbUser ? firebaseUserToUser(fbUser) : null;
}

export function onAuthStateChanged(callback: (user: User | null) => void): () => void {
  const auth = getAuthInstance();
  return firebaseOnAuthStateChanged(auth, (fbUser) => {
    callback(fbUser ? firebaseUserToUser(fbUser) : null);
  });
}
