import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore, Firestore, enableIndexedDbPersistence, initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';
import fallbackConfig from '../../../firebase-applet-config.json';

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
  firestoreDatabaseId: safeFallback.firestoreDatabaseId,
};

export const app: FirebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth: Auth = getAuth(app);

// Persistência automática da sessão (Auth)
setPersistence(auth, browserLocalPersistence).catch((err) => {
  console.warn('Persistência de sessão Auth configurada:', err);
});

// Inicialização do Firestore com Persistência Offline
let firestoreInstance: Firestore;

try {
  firestoreInstance = initializeFirestore(app, {
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
  }, firebaseConfig.firestoreDatabaseId);
} catch (e) {
  // Fallback caso initializeFirestore já tenha sido chamado ou dê erro
  firestoreInstance = firebaseConfig.firestoreDatabaseId 
    ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
    : getFirestore(app);
}

export const db = firestoreInstance;
