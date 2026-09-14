import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  GithubAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  getDocFromServer,
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  onSnapshot,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { UserProgress, LeaderboardEntry } from '../types';

// Initialize Firebase App
export const app = initializeApp(firebaseConfig);

// Initialize Firestore with custom databaseId as required by the platform
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Initialize Firebase Authentication
export const auth = getAuth(app);

// Authentication Providers
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

export const githubProvider = new GithubAuthProvider();

// Operation Types for error tracing
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Test Connection on Boot
export async function testFirestoreConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client offline, local cache will be used.');
    }
  }
}

// Cloud Profile & Progress Sync Service
export async function syncProgressToCloud(user: User, progress: UserProgress): Promise<void> {
  if (!user || !user.uid) return;

  const userDocRef = doc(db, 'users', user.uid);
  const leaderboardDocRef = doc(db, 'leaderboard', user.uid);

  const cleanEmail = user.email || `${user.uid.slice(0, 8)}@meowlinux.local`;
  const cleanName = (progress.userName || user.displayName || 'Cat Sysadmin').slice(0, 60);
  const cleanCallsign = (progress.callsign || 'Junior Whisker Sysadmin').slice(0, 80);
  const cleanBio = (progress.userBio || '').slice(0, 300);
  const cleanAvatar = (progress.avatarId || '🐱').slice(0, 10);
  const cleanShell = (progress.preferredShell || '/bin/bash').slice(0, 50);
  const cleanBadge = (progress.favoriteBadgeId || 'badge-first-step').slice(0, 60);

  // Check if existing user doc exists to handle create vs update
  let existingData: any = null;
  try {
    const snap = await getDoc(userDocRef);
    if (snap.exists()) {
      existingData = snap.data();
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, `users/${user.uid}`);
  }

  const payload: any = {
    userId: user.uid,
    email: cleanEmail,
    userName: cleanName,
    callsign: cleanCallsign,
    userBio: cleanBio,
    avatarId: cleanAvatar,
    preferredShell: cleanShell,
    favoriteBadgeId: cleanBadge,
    xp: Math.max(0, Math.round(progress.xp || 0)),
    streak: Math.max(0, Math.round(progress.streak || 0)),
    longestStreak: Math.max(0, Math.round(progress.longestStreak || 0)),
    freezeTokens: Math.max(0, Math.round(progress.freezeTokens || 0)),
    lastActiveDate: (progress.lastActiveDate || new Date().toISOString().split('T')[0]).slice(0, 20),
    totalCommandsRun: Math.max(0, Math.round(progress.totalCommandsRun || 0)),
    completedChallenges: (progress.completedChallenges || []).slice(0, 200),
    earnedBadges: (progress.earnedBadges || []).slice(0, 100),
    unlockedSkills: (progress.unlockedSkills || []).slice(0, 100),
    unlockedLevels: (progress.unlockedLevels || []).slice(0, 20),
    completedBossBattles: (progress.completedBossBattles || []).slice(0, 50),
    activeContainerId: (progress.activeContainerId || 'ubuntu-2404').slice(0, 50),
    soundEnabled: !!progress.soundEnabled,
    updatedAt: serverTimestamp(),
  };

  const publicPayload = {
    userId: user.uid,
    userName: cleanName,
    callsign: cleanCallsign,
    avatarId: cleanAvatar,
    xp: Math.max(0, Math.round(progress.xp || 0)),
    level: Math.floor((progress.xp || 0) / 500) + 1,
    streak: Math.max(0, Math.round(progress.streak || 0)),
    badgesCount: (progress.earnedBadges || []).length,
    totalCommandsRun: Math.max(0, Math.round(progress.totalCommandsRun || 0)),
    updatedAt: serverTimestamp(),
  };

  try {
    if (!existingData) {
      payload.createdAt = serverTimestamp();
      await setDoc(userDocRef, payload);
    } else {
      payload.createdAt = existingData.createdAt || serverTimestamp();
      await setDoc(userDocRef, payload, { merge: true });
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
  }

  try {
    await setDoc(leaderboardDocRef, publicPayload, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `leaderboard/${user.uid}`);
  }
}

export async function fetchUserProgressFromCloud(userId: string): Promise<Partial<UserProgress> | null> {
  const userDocRef = doc(db, 'users', userId);
  try {
    const snap = await getDoc(userDocRef);
    if (!snap.exists()) return null;
    const data = snap.data();
    return {
      xp: data.xp ?? 0,
      streak: data.streak ?? 0,
      longestStreak: data.longestStreak ?? data.streak ?? 0,
      freezeTokens: data.freezeTokens ?? 2,
      lastActiveDate: data.lastActiveDate ?? new Date().toISOString().split('T')[0],
      userName: data.userName ?? 'Candidate Tabby',
      callsign: data.callsign ?? 'Junior Whisker SysAdmin',
      userBio: data.userBio ?? '',
      avatarId: data.avatarId ?? '🐱',
      preferredShell: data.preferredShell ?? '/bin/bash',
      favoriteBadgeId: data.favoriteBadgeId ?? 'badge-first-step',
      totalCommandsRun: data.totalCommandsRun ?? 0,
      completedChallenges: data.completedChallenges ?? [],
      earnedBadges: data.earnedBadges ?? [],
      unlockedSkills: data.unlockedSkills ?? [],
      unlockedLevels: data.unlockedLevels ?? ['essentials', 'lpic1-101'],
      completedBossBattles: data.completedBossBattles ?? [],
      activeContainerId: data.activeContainerId ?? 'ubuntu-2404',
      soundEnabled: data.soundEnabled ?? true,
    };
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, `users/${userId}`);
  }
}

export async function fetchLeaderboardEntries(): Promise<LeaderboardEntry[]> {
  const colRef = collection(db, 'leaderboard');
  const q = query(colRef, orderBy('xp', 'desc'), limit(50));
  try {
    const snap = await getDocs(q);
    const entries: LeaderboardEntry[] = [];
    let rank = 1;
    snap.forEach((docSnap) => {
      const d = docSnap.data();
      entries.push({
        rank: rank++,
        username: d.userName || 'Unknown SysAdmin',
        avatar: d.avatarId || '🐱',
        title: d.callsign || 'SysAdmin',
        level: d.level || 1,
        xp: d.xp || 0,
        streak: d.streak || 0,
        examScore: 0,
        country: 'CLOUD',
        isUser: auth.currentUser?.uid === d.userId,
      });
    });
    return entries;
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'leaderboard');
  }
}
