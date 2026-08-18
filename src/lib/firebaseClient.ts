/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import fallbackConfig from '../../firebase-applet-config.json';

// Configuração flexível: suporta variáveis de ambiente VITE_FIREBASE_* com fallback para o arquivo local
const rawEnv = (typeof import.meta !== 'undefined' && (import.meta as any).env) || {};
const safeFallback = (fallbackConfig || {}) as Record<string, string | undefined>;

const firebaseConfig = {
  apiKey: rawEnv.VITE_FIREBASE_API_KEY || safeFallback.apiKey,
  authDomain: rawEnv.VITE_FIREBASE_AUTH_DOMAIN || safeFallback.authDomain,
  projectId: rawEnv.VITE_FIREBASE_PROJECT_ID || safeFallback.projectId,
  storageBucket: rawEnv.VITE_FIREBASE_STORAGE_BUCKET || safeFallback.storageBucket,
  messagingSenderId: rawEnv.VITE_FIREBASE_MESSAGING_SENDER_ID || safeFallback.messagingSenderId,
  appId: rawEnv.VITE_FIREBASE_APP_ID || safeFallback.appId,
  firestoreRegion: safeFallback.firestoreRegion,
  firestoreDatabaseId: safeFallback.firestoreDatabaseId === '(default)' ? undefined : safeFallback.firestoreDatabaseId,
};

export const firebaseApp: FirebaseApp =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth: Auth = getAuth(firebaseApp);

// Persistência local segura para produção
setPersistence(auth, browserLocalPersistence).catch((err) => {
  console.warn('Persistência de sessão Firebase configurada:', err);
});

let firestoreInstance: Firestore | null = null;
try {
  firestoreInstance = firebaseConfig.firestoreDatabaseId 
    ? getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId)
    : getFirestore(firebaseApp);
} catch (e) {
  console.warn('Firestore fallback:', e);
}

export const firestoreDb = firestoreInstance;
