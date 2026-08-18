import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail, updatePassword, EmailAuthProvider, reauthenticateWithCredential,
  updateProfile,
  deleteUser as firebaseDeleteUser,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { UserDocument } from '../../types/models';

class AuthService {
  private static googleProvider = new GoogleAuthProvider();

  static {
    AuthService.googleProvider.addScope('https://www.googleapis.com/auth/drive.readonly');
    AuthService.googleProvider.setCustomParameters({ prompt: 'consent' });
  }

  public static onAuthState(callback: (user: UserDocument | null) => void) {
    return onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDoc = await this.syncUserDocument(firebaseUser);
        callback(userDoc);
      } else {
        callback(null);
      }
    });
  }

  private static async syncUserDocument(firebaseUser: FirebaseUser): Promise<UserDocument> {
    try {
      const userRef = doc(db, 'users', firebaseUser.uid);
      const docSnap = await getDoc(userRef);

      const baseData = {
        uid: firebaseUser.uid,
        name: firebaseUser.displayName || 'Usuário',
        email: firebaseUser.email,
        photoURL: firebaseUser.photoURL,
        lastLogin: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      if (!docSnap.exists()) {
        const newUserDoc = {
          ...baseData,
          createdAt: serverTimestamp(),
          provider: firebaseUser.providerData[0]?.providerId || 'unknown',
          premium: false,
          theme: 'dark',
          language: 'pt-BR'
        };
        await setDoc(userRef, newUserDoc);
        
        // We return the raw data with timestamps approximated for frontend state
        return {
          ...newUserDoc,
          createdAt: Date.now(),
          lastLogin: Date.now(),
          updatedAt: Date.now(),
        } as UserDocument;
      } else {
        await setDoc(userRef, baseData, { merge: true });
        const existingData = docSnap.data();
        return {
          ...existingData,
          ...baseData,
          createdAt: existingData.createdAt?.toMillis() || Date.now(),
          lastLogin: Date.now(),
          updatedAt: Date.now(),
        } as UserDocument;
      }
    } catch (error: any) {
      if (error.code === 'permission-denied') {
        console.warn('Permission denied syncing user doc (likely auth state transition).');
      } else {
        console.error('Error syncing user doc:', error);
      }
      return null as any;
    }
  }

  public static async login(email: string, password: string): Promise<void> {
    await signInWithEmailAndPassword(auth, email, password);
  }

  public static async register(name: string, email: string, password: string): Promise<void> {
    const userCred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(userCred.user, { displayName: name });
    await this.syncUserDocument(userCred.user);
  }

  public static async loginWithGoogle(): Promise<string | undefined> {
    const result = await signInWithPopup(auth, this.googleProvider); const credential = GoogleAuthProvider.credentialFromResult(result); return credential?.accessToken;
  }

  public static async logout(): Promise<void> {
    await signOut(auth);
  }

  public static async resetPassword(email: string): Promise<void> {
    await sendPasswordResetEmail(auth, email);
  }

  public static async changePassword(currentPass: string, newPass: string): Promise<void> {
    const user = auth.currentUser;
    if (!user || !user.email) throw new Error('Usuário não autenticado');
    const credential = EmailAuthProvider.credential(user.email, currentPass);
    await reauthenticateWithCredential(user, credential);
    await updatePassword(user, newPass);
  }

  public static async updateProfile(name: string, photoURL?: string): Promise<void> {
    const user = auth.currentUser;
    if (!user) throw new Error('Não autenticado');
    
    await updateProfile(user, { displayName: name, photoURL });
    await this.syncUserDocument(user);
  }

  public static async deleteAccount(): Promise<void> {
    const user = auth.currentUser;
    if (!user) throw new Error('Não autenticado');
    await firebaseDeleteUser(user);
  }
}

export default AuthService;
