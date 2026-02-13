import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  deleteDoc,
  orderBy,
  limit,
  Timestamp,
} from 'firebase/firestore';
import { getFirebaseApp } from '../../config/firebase.config';
import { User } from '../../models/User';
import { Session, SessionFilters } from '../../models/Session';
import { Device } from '../../models/Device';
import { Achievement } from '../../models/Achievement';
import { Goal } from '../../models/Goal';

function db() {
  return getFirestore(getFirebaseApp());
}

// ── User operations ──

export async function createUserProfile(userId: string, data: Partial<User>): Promise<void> {
  await setDoc(doc(db(), 'users', userId), {
    ...data,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
}

export async function getUserProfile(userId: string): Promise<User | null> {
  const snap = await getDoc(doc(db(), 'users', userId));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as User) : null;
}

export async function updateUserProfile(userId: string, updates: Partial<User>): Promise<void> {
  await updateDoc(doc(db(), 'users', userId), { ...updates, updatedAt: Timestamp.now() });
}

// ── Session operations ──

export async function saveSession(userId: string, sessionData: Omit<Session, 'id'>): Promise<string> {
  const ref = await addDoc(collection(db(), 'sessions'), { ...sessionData, userId });
  return ref.id;
}

export async function getSessions(userId: string, filters?: SessionFilters): Promise<Session[]> {
  const constraints: any[] = [where('userId', '==', userId)];
  if (filters?.bodyArea) constraints.push(where('bodyArea', '==', filters.bodyArea));
  if (filters?.mode) constraints.push(where('mode', '==', filters.mode));
  constraints.push(orderBy('startTime', 'desc'));
  constraints.push(limit(50));
  const q = query(collection(db(), 'sessions'), ...constraints);
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Session));
}

export async function getSessionById(sessionId: string): Promise<Session | null> {
  const snap = await getDoc(doc(db(), 'sessions', sessionId));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as Session) : null;
}

// ── Device operations ──

export async function savePairedDevice(userId: string, deviceData: Omit<Device, 'id'>): Promise<void> {
  await addDoc(collection(db(), 'devices'), { ...deviceData, userId });
}

export async function getPairedDevices(userId: string): Promise<Device[]> {
  const q = query(collection(db(), 'devices'), where('userId', '==', userId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Device));
}

export async function updateDeviceSettings(deviceId: string, settings: Partial<Device>): Promise<void> {
  await updateDoc(doc(db(), 'devices', deviceId), settings);
}

export async function deleteDevice(deviceId: string): Promise<void> {
  await deleteDoc(doc(db(), 'devices', deviceId));
}

// ── Achievement operations ──

export async function saveAchievement(userId: string, achievement: Omit<Achievement, 'id'>): Promise<void> {
  await addDoc(collection(db(), 'achievements'), { ...achievement, userId });
}

export async function getAchievements(userId: string): Promise<Achievement[]> {
  const q = query(collection(db(), 'achievements'), where('userId', '==', userId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Achievement));
}

// ── Goal operations ──

export async function createGoal(userId: string, goal: Omit<Goal, 'id'>): Promise<string> {
  const ref = await addDoc(collection(db(), 'goals'), { ...goal, userId });
  return ref.id;
}

export async function getGoals(userId: string): Promise<Goal[]> {
  const q = query(collection(db(), 'goals'), where('userId', '==', userId), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Goal));
}

export async function updateGoal(goalId: string, updates: Partial<Goal>): Promise<void> {
  await updateDoc(doc(db(), 'goals', goalId), { ...updates, updatedAt: Timestamp.now() });
}

export async function deleteGoal(goalId: string): Promise<void> {
  await deleteDoc(doc(db(), 'goals', goalId));
}
