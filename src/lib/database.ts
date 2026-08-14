/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  query,
  where,
  orderBy,
  Firestore
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

export interface WatchHistoryEntry {
  id: string;
  movieId: string;
  userId?: string;
  progress: number; // percentage from 0 to 100
  seconds: number;  // current video position in seconds
  updatedAt: string;
  completed: boolean;
}

export interface MovieReview {
  id: string;
  movieId: string;
  userId?: string;
  rating: number; // 1 to 10
  comment: string;
  userName: string;
  userAvatar: string;
  createdAt: string;
}

// Inicializa instância Firestore
const firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
let firestoreDb: Firestore | null = null;
try {
  firestoreDb = getFirestore(firebaseApp);
} catch (err) {
  console.warn('Firestore inicializado em modo offline/cache:', err);
}

class CineStreamDatabase {
  private prefix = 'cinestream_db_';

  constructor() {
    this.initDatabase();
  }

  private initDatabase() {
    if (!localStorage.getItem(this.getKey('watch_history'))) {
      const initialHistory: WatchHistoryEntry[] = [
        {
          id: 'hist_1',
          movieId: 'interstellar',
          progress: 42,
          seconds: 4280,
          updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
          completed: false,
        },
        {
          id: 'hist_2',
          movieId: 'o-cavaleiro-das-trevas',
          progress: 100,
          seconds: 9120,
          updatedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
          completed: true,
        }
      ];
      localStorage.setItem(this.getKey('watch_history'), JSON.stringify(initialHistory));
    }

    if (!localStorage.getItem(this.getKey('reviews'))) {
      const initialReviews: MovieReview[] = [
        {
          id: 'rev_1',
          movieId: 'interstellar',
          rating: 10,
          comment: 'Uma obra-prima incontestável do cinema de ficção científica. A trilha sonora combinada com os efeitos visuais cria uma experiência transcendental.',
          userName: 'Ricardo Albuquerque',
          userAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBBuZHq7rFx575Hw84XGsBZEI5_2fKwh6pIys2s8h-fNMRi8e4FaHIB--s3M7X3Wz0b_BPtlxmKK1jwQa4JR7NYeob_w4iEIHxzUZO-9oQeL7nqODEsO0DTEKJNvQAYg3O4pgDJ3tDlX4Mw5ahgE7s1ibv66sw_kemCWADfhR2o1nKyrkV7AmJiiBr6hlkOupvWW9n-GxQ5GyzZDWsJHATQCXx0UmRx-dYe8hBVGYH_luxAIMJcOEdrEOEuhDEfQcLd1bAUKsJkOFY',
          createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
        },
        {
          id: 'rev_2',
          movieId: 'o-cavaleiro-das-trevas',
          rating: 9,
          comment: 'Atuação inesquecível do Coringa. Roteiro tenso e direção impecável.',
          userName: 'Rodrigo Lima',
          userAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCnebKsozj4QcBN8MlleASK473IE-l7LLG8ACfSlMSP8sD9MEVhRNQCfHKUS3SCk6EcH8QdaLpAMWOOtGVMAhfNAnpqTPLyF3-k7mAv-fIyCi_bihZDg37SE2C3SdJTAhLVfAajRZBREe3NWyuWLd4980QSi7_hKed1zvifhkxr8USyINMFShIRyzaPBy6cw0jhkOL1_Bqpz832OdD_Ufemp-KmDHIcKScYsjuonmSWnnDCVgtJjgjGyXGbFYTf00gA3mdav-YNzo8',
          createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
        }
      ];
      localStorage.setItem(this.getKey('reviews'), JSON.stringify(initialReviews));
    }
  }

  private getKey(table: string): string {
    return `${this.prefix}${table}`;
  }

  /* --- WATCH HISTORY DATABASE ENDPOINTS --- */

  async getWatchHistory(userId?: string): Promise<WatchHistoryEntry[]> {
    if (firestoreDb && userId) {
      try {
        const q = query(
          collection(firestoreDb, 'watch_history'),
          where('userId', '==', userId),
          orderBy('updatedAt', 'desc')
        );
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const list: WatchHistoryEntry[] = [];
          snapshot.forEach((docSnap) => {
            list.push(docSnap.data() as WatchHistoryEntry);
          });
          return list;
        }
      } catch (e) {
        console.warn('Firestore fallback para cache local:', e);
      }
    }

    const data = localStorage.getItem(this.getKey('watch_history'));
    return data ? JSON.parse(data) : [];
  }

  async getMovieWatchProgress(movieId: string, userId?: string): Promise<WatchHistoryEntry | null> {
    const history = await this.getWatchHistory(userId);
    return history.find((h) => h.movieId === movieId) || null;
  }

  async updateWatchProgress(
    movieId: string,
    seconds: number,
    duration: number,
    userId?: string
  ): Promise<WatchHistoryEntry> {
    const progress = Math.min(Math.round((seconds / duration) * 100), 100);
    const completed = progress >= 95;

    const history = await this.getWatchHistory(userId);
    const existingIndex = history.findIndex((h) => h.movieId === movieId);

    const entryId = existingIndex !== -1 ? history[existingIndex].id : `hist_${Date.now()}`;
    const entry: WatchHistoryEntry = {
      id: entryId,
      movieId,
      userId: userId || undefined,
      progress,
      seconds: Math.round(seconds),
      updatedAt: new Date().toISOString(),
      completed,
    };

    if (existingIndex !== -1) {
      history[existingIndex] = entry;
    } else {
      history.unshift(entry);
    }

    localStorage.setItem(this.getKey('watch_history'), JSON.stringify(history));

    if (firestoreDb && userId) {
      try {
        const docRef = doc(firestoreDb, 'watch_history', `${userId}_${movieId}`);
        await setDoc(docRef, entry, { merge: true });
      } catch (e) {
        console.warn('Erro ao sincronizar histórico com Firestore:', e);
      }
    }

    return entry;
  }

  async deleteWatchHistory(id: string, userId?: string): Promise<void> {
    const history = await this.getWatchHistory(userId);
    const filtered = history.filter((h) => h.id !== id);
    localStorage.setItem(this.getKey('watch_history'), JSON.stringify(filtered));

    if (firestoreDb && userId) {
      try {
        const docRef = doc(firestoreDb, 'watch_history', id);
        await deleteDoc(docRef);
      } catch (e) {
        console.warn('Erro ao deletar item no Firestore:', e);
      }
    }
  }

  async clearWatchHistory(): Promise<void> {
    localStorage.setItem(this.getKey('watch_history'), JSON.stringify([]));
  }

  /* --- REVIEWS DATABASE ENDPOINTS --- */

  async getReviews(movieId?: string): Promise<MovieReview[]> {
    const data = localStorage.getItem(this.getKey('reviews'));
    const reviews: MovieReview[] = data ? JSON.parse(data) : [];

    if (movieId) {
      return reviews
        .filter((r) => r.movieId === movieId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return reviews.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async addReview(
    movieId: string,
    rating: number,
    comment: string,
    userName: string,
    userAvatar: string,
    userId?: string
  ): Promise<MovieReview> {
    const reviews = await this.getReviews();

    const newReview: MovieReview = {
      id: `rev_${Date.now()}`,
      movieId,
      userId: userId || undefined,
      rating,
      comment,
      userName,
      userAvatar,
      createdAt: new Date().toISOString(),
    };

    reviews.unshift(newReview);
    localStorage.setItem(this.getKey('reviews'), JSON.stringify(reviews));

    if (firestoreDb) {
      try {
        const docRef = doc(firestoreDb, 'reviews', newReview.id);
        await setDoc(docRef, newReview);
      } catch (e) {
        console.warn('Erro ao gravar avaliação no Firestore:', e);
      }
    }

    return newReview;
  }

  async deleteReview(id: string): Promise<void> {
    const reviews = await this.getReviews();
    const filtered = reviews.filter((r) => r.id !== id);
    localStorage.setItem(this.getKey('reviews'), JSON.stringify(filtered));

    if (firestoreDb) {
      try {
        const docRef = doc(firestoreDb, 'reviews', id);
        await deleteDoc(docRef);
      } catch (e) {
        console.warn('Erro ao remover review no Firestore:', e);
      }
    }
  }

  /* --- DATABASE STATS --- */

  getDatabaseSize(): {
    tablesCount: number;
    recordsCount: number;
    bytesCount: number;
    watchHistoryCount: number;
    reviewsCount: number;
    estimatedBytes: number;
  } {
    const historyData = localStorage.getItem(this.getKey('watch_history'));
    const reviewsData = localStorage.getItem(this.getKey('reviews'));

    const history: WatchHistoryEntry[] = historyData ? JSON.parse(historyData) : [];
    const reviews: MovieReview[] = reviewsData ? JSON.parse(reviewsData) : [];

    const totalBytes =
      (historyData ? new Blob([historyData]).size : 0) +
      (reviewsData ? new Blob([reviewsData]).size : 0);

    return {
      tablesCount: 2,
      recordsCount: history.length + reviews.length,
      bytesCount: totalBytes,
      watchHistoryCount: history.length,
      reviewsCount: reviews.length,
      estimatedBytes: totalBytes,
    };
  }

  resetDatabase() {
    localStorage.removeItem(this.getKey('watch_history'));
    localStorage.removeItem(this.getKey('reviews'));
    this.initDatabase();
  }
}

export const db = new CineStreamDatabase();
