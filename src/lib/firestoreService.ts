/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  collection,
  doc,
  setDoc,
  getDocs,
  getDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { firestoreDb, auth } from './firebaseClient';
import { WatchHistoryEntry } from './database';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
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
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

class FirestoreService {
  /**
   * Favorites (savedIds) endpoints
   */
  async getFavorites(uid: string): Promise<string[]> {
    if (!firestoreDb) return [];
    try {
      const q = query(collection(firestoreDb, `users/${uid}/favorites`));
      const snapshot = await getDocs(q);
      const ids: string[] = [];
      snapshot.forEach((docSnap) => {
        ids.push(docSnap.id);
      });
      return ids;
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, `users/${uid}/favorites`);
      return [];
    }
  }

  async addFavorite(uid: string, movieId: string): Promise<void> {
    if (!firestoreDb) return;
    try {
      const docRef = doc(firestoreDb, `users/${uid}/favorites`, movieId);
      await setDoc(docRef, {
        movieId,
        addedAt: serverTimestamp(),
      }, { merge: true });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `users/${uid}/favorites/${movieId}`);
    }
  }

  async removeFavorite(uid: string, movieId: string): Promise<void> {
    if (!firestoreDb) return;
    try {
      const docRef = doc(firestoreDb, `users/${uid}/favorites`, movieId);
      await deleteDoc(docRef);
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `users/${uid}/favorites/${movieId}`);
    }
  }

  /**
   * Watch History endpoints
   */
  async getWatchHistory(uid: string): Promise<WatchHistoryEntry[]> {
    if (!firestoreDb) return [];
    try {
      const q = query(
        collection(firestoreDb, `users/${uid}/history`),
        orderBy('updatedAt', 'desc')
      );
      const snapshot = await getDocs(q);
      const list: WatchHistoryEntry[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        list.push({
          id: docSnap.id,
          movieId: data.movieId,
          userId: uid,
          progress: data.progress,
          seconds: data.seconds,
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          completed: data.completed,
        });
      });
      return list;
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, `users/${uid}/history`);
      return [];
    }
  }

  async updateWatchProgress(
    uid: string,
    movieId: string,
    seconds: number,
    duration: number
  ): Promise<WatchHistoryEntry> {
    const progress = Math.min(Math.round((seconds / duration) * 100), 100);
    const completed = progress >= 95;
    
    const entry: WatchHistoryEntry = {
      id: movieId, // Use movieId as document ID for easier updates
      movieId,
      userId: uid,
      progress,
      seconds: Math.round(seconds),
      updatedAt: new Date().toISOString(),
      completed,
    };

    if (!firestoreDb) return entry;

    try {
      const docRef = doc(firestoreDb, `users/${uid}/history`, movieId);
      await setDoc(docRef, {
        movieId,
        progress,
        seconds: Math.round(seconds),
        completed,
        updatedAt: serverTimestamp(),
      }, { merge: true });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `users/${uid}/history/${movieId}`);
    }

    return entry;
  }

  /**
   * Data Migration (Local -> Firestore)
   */
  async migrateLocalDataToFirestore(uid: string, localSavedIds: string[], localHistory: WatchHistoryEntry[]): Promise<void> {
    if (!firestoreDb) return;
    try {
      const batch = writeBatch(firestoreDb);
      
      // Migrate Favorites
      localSavedIds.forEach((movieId) => {
        const favRef = doc(firestoreDb, `users/${uid}/favorites`, movieId);
        batch.set(favRef, { movieId, addedAt: serverTimestamp() }, { merge: true });
      });

      // Migrate History
      localHistory.forEach((item) => {
        const histRef = doc(firestoreDb, `users/${uid}/history`, item.movieId);
        batch.set(histRef, {
          movieId: item.movieId,
          progress: item.progress,
          seconds: item.seconds,
          completed: item.completed,
          updatedAt: item.updatedAt ? new Date(item.updatedAt) : serverTimestamp()
        }, { merge: true });
      });

      await batch.commit();
      console.log('Migração local concluída com sucesso!');
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `users/${uid}/*`);
    }
  }
}

export const firestoreService = new FirestoreService();
