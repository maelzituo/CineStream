const fs = require('fs');
let code = fs.readFileSync('src/services/auth/authService.ts', 'utf8');

const target = `  private static async syncUserDocument(firebaseUser: FirebaseUser): Promise<UserDocument> {
    const userRef = doc(db, 'users', firebaseUser.uid);
    try { const docSnap = await getDoc(userRef);

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
  }`;

const replacement = `  private static async syncUserDocument(firebaseUser: FirebaseUser): Promise<UserDocument> {
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
  }`;

if (code.includes(target)) {
  fs.writeFileSync('src/services/auth/authService.ts', code.replace(target, replacement));
  console.log('patched');
} else {
  console.log('Target not found');
}
