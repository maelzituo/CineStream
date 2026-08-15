/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  doc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, firestoreDb } from './firebaseClient';
import { AuthUser, PasswordValidationResult } from '../types';
import { validateEmail, validateName, validatePassword } from './passwordUtils';
import { SecurityLogger } from './securityLogger';

// Provedor Oficial do Google OAuth 2.0 com escopos de perfil e Google Drive
const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('https://www.googleapis.com/auth/userinfo.email');
googleProvider.addScope('https://www.googleapis.com/auth/userinfo.profile');
googleProvider.addScope('https://www.googleapis.com/auth/drive.readonly');
googleProvider.addScope('https://www.googleapis.com/auth/drive.metadata.readonly');
googleProvider.setCustomParameters({ prompt: 'select_account' });

const DRIVE_TOKEN_STORAGE_KEY = 'cinestream_gdrive_oauth_token';
let inMemoryDriveToken: string | null = null;

try {
  inMemoryDriveToken = sessionStorage.getItem(DRIVE_TOKEN_STORAGE_KEY);
} catch {
  // Ignora se indisponível
}

export class AuthService {
  /**
   * Converte o objeto Firebase User no modelo estrito AuthUser
   */
  public static mapFirebaseUser(user: FirebaseUser | null): AuthUser | null {
    if (!user) return null;

    let providerId: AuthUser['providerId'] = 'password';
    if (user.providerData && user.providerData.length > 0) {
      const p = user.providerData[0].providerId;
      if (p === 'google.com') providerId = 'google.com';
      else if (p === 'password') providerId = 'password';
    }

    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || user.email?.split('@')[0] || 'Usuário CineStream',
      photoURL: user.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=185&auto=format&fit=crop&q=80',
      emailVerified: user.emailVerified,
      providerId,
      createdAt: user.metadata.creationTime,
      lastLoginAt: user.metadata.lastSignInTime,
      isPro: true,
    };
  }

  /**
   * Sincroniza os dados do usuário autenticado no Firestore
   */
  private static async syncUserToFirestore(user: FirebaseUser, provider: string): Promise<void> {
    if (!firestoreDb) return;
    try {
      const userRef = doc(firestoreDb, 'users', user.uid);
      await setDoc(
        userRef,
        {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || '',
          photoURL: user.photoURL || '',
          providerId: provider,
          lastLoginAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (err) {
      console.warn('Sincronização com Firestore:', err);
    }
  }

  /**
   * Retorna o token de acesso do Google Drive
   */
  public static getDriveToken(): string | null {
    return inMemoryDriveToken;
  }

  /**
   * Cadastro de novo usuário
   */
  public static async register(
    name: string,
    email: string,
    password: string,
    photoURL?: string
  ): Promise<AuthUser> {
    const nameCheck = validateName(name);
    if (!nameCheck.isValid) {
      throw new Error(nameCheck.error);
    }

    const emailCheck = validateEmail(email);
    if (!emailCheck.isValid) {
      throw new Error(emailCheck.error);
    }

    const passwordCheck: PasswordValidationResult = validatePassword(password);
    if (!passwordCheck.isValid) {
      throw new Error('A senha não cumpre todos os requisitos de segurança.');
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        emailCheck.normalized,
        password
      );

      const avatar = photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=185&auto=format&fit=crop&q=80';

      await updateProfile(userCredential.user, {
        displayName: nameCheck.sanitized,
        photoURL: avatar,
      });

      await this.syncUserToFirestore(userCredential.user, 'password');

      SecurityLogger.log('register', emailCheck.normalized, 'Novo usuário cadastrado.');
      SecurityLogger.log('login_success', emailCheck.normalized, 'Sessão inicial estabelecida após cadastro.');

      return this.mapFirebaseUser(auth.currentUser)!;
    } catch (error: any) {
      const code = error?.code;
      if (code === 'auth/email-already-in-use') {
        throw new Error('Este endereço de e-mail já está cadastrado. Tente fazer login ou recuperar sua senha.');
      } else if (code === 'auth/invalid-email') {
        throw new Error('Formato de e-mail inválido.');
      } else if (code === 'auth/weak-password') {
        throw new Error('A senha é muito fraca. Utilize pelo menos 8 caracteres com letras maiúsculas, minúsculas, números e símbolos.');
      } else if (code === 'auth/operation-not-allowed') {
        throw new Error('PROVIDER_DISABLED|Email/Password');
      } else {
        throw new Error(error.message || 'Erro ao realizar cadastro. Tente novamente.');
      }
    }
  }

  /**
   * Login com E-mail e Senha com proteção contra ataques de força bruta
   */
  public static async login(email: string, password: string): Promise<AuthUser> {
    const emailCheck = validateEmail(email);
    if (!emailCheck.isValid) {
      throw new Error(emailCheck.error);
    }

    if (!password) {
      throw new Error('A senha é obrigatória.');
    }

    const lockout = SecurityLogger.checkLockout(emailCheck.normalized);
    if (lockout.isLocked) {
      throw new Error(
        `Muitas tentativas incorretas. Por segurança, tente novamente em ${lockout.remainingSeconds} segundos.`
      );
    }

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        emailCheck.normalized,
        password
      );

      await this.syncUserToFirestore(userCredential.user, 'password');

      SecurityLogger.resetFailedAttempts(emailCheck.normalized);
      SecurityLogger.log('login_success', emailCheck.normalized, 'Autenticação por e-mail e senha efetuada.');

      return this.mapFirebaseUser(userCredential.user)!;
    } catch (error: any) {
      const failInfo = SecurityLogger.recordFailedAttempt(emailCheck.normalized);
      SecurityLogger.log('login_failed', emailCheck.normalized, `Falha de login (Tentativa ${failInfo.attempts}).`);

      if (failInfo.isLocked) {
        throw new Error(
          `Muitas tentativas incorretas. Sua conta foi temporariamente protegida por ${failInfo.remainingSeconds} segundos.`
        );
      }

      if (error?.code === 'auth/operation-not-allowed') {
        throw new Error('PROVIDER_DISABLED|Email/Password');
      }

      throw new Error('E-mail ou senha incorretos. Por favor, tente novamente.');
    }
  }

  /**
   * Login Oficial com Google OAuth 2.0
   */
  public static async loginWithGoogle(): Promise<{ user: AuthUser; accessToken: string }> {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential?.accessToken || '';

      if (token) {
        inMemoryDriveToken = token;
        try {
          sessionStorage.setItem(DRIVE_TOKEN_STORAGE_KEY, token);
        } catch {}
      }

      await this.syncUserToFirestore(result.user, 'google.com');

      const mapped = this.mapFirebaseUser(result.user)!;
      SecurityLogger.resetFailedAttempts(result.user.email || '');
      SecurityLogger.log('login_success', result.user.email || '', 'Autenticação via Google OAuth 2.0.');

      return { user: mapped, accessToken: token };
    } catch (error: any) {
      if (error?.code === 'auth/popup-closed-by-user') {
        throw new Error('O popup de login do Google foi fechado antes de concluir a autenticação.');
      } else if (error?.code === 'auth/cancelled-popup-request') {
        throw new Error('Operação de login cancelada.');
      } else if (error?.code === 'auth/popup-blocked') {
        throw new Error('O navegador bloqueou a janela pop-up do Google. Permita pop-ups para autenticar.');
      } else {
        console.error('Erro no Google Sign-In:', error);
        throw new Error(error.message || 'Não foi possível autenticar com o Google.');
      }
    }
  }

  /**
   * Recuperação de Senha por link oficial enviado por e-mail
   */
  public static async requestPasswordReset(email: string): Promise<void> {
    const emailCheck = validateEmail(email);
    if (!emailCheck.isValid) {
      throw new Error(emailCheck.error);
    }

    try {
      await sendPasswordResetEmail(auth, emailCheck.normalized);
      SecurityLogger.log('password_reset_request', emailCheck.normalized, 'Instruções de redefinição de senha enviadas.');
    } catch (error: any) {
      console.warn('Erro ao solicitar reset:', error);
      SecurityLogger.log('password_reset_request', emailCheck.normalized, 'Tentativa de redefinição registrada.');
    }
  }

  /**
   * Troca de Senha Segura
   */
  public static async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    const user = auth.currentUser;
    if (!user || !user.email) {
      throw new Error('Nenhum usuário autenticado no momento.');
    }

    const validation = validatePassword(newPassword);
    if (!validation.isValid) {
      throw new Error('A nova senha não atende aos requisitos de complexidade de segurança.');
    }

    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      SecurityLogger.log('password_changed', user.email, 'Senha alterada com sucesso.');
    } catch (error: any) {
      if (error?.code === 'auth/wrong-password' || error?.code === 'auth/invalid-credential') {
        throw new Error('A senha atual fornecida está incorreta.');
      } else if (error?.code === 'auth/requires-recent-login') {
        throw new Error('Por segurança, faça login novamente antes de alterar sua senha.');
      } else {
        throw new Error(error.message || 'Falha ao atualizar senha.');
      }
    }
  }

  /**
   * Atualização de Perfil
   */
  public static async updateProfileData(name: string, photoURL?: string): Promise<AuthUser> {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('Nenhum usuário logado para atualizar.');
    }

    const nameCheck = validateName(name);
    if (!nameCheck.isValid) {
      throw new Error(nameCheck.error);
    }

    await updateProfile(user, {
      displayName: nameCheck.sanitized,
      photoURL: photoURL || user.photoURL,
    });

    await this.syncUserToFirestore(user, user.providerData?.[0]?.providerId || 'password');
    SecurityLogger.log('profile_updated', user.email || '', 'Perfil atualizado.');

    return this.mapFirebaseUser(auth.currentUser)!;
  }

  /**
   * Logout seguro
   */
  public static async logout(): Promise<void> {
    const email = auth.currentUser?.email;
    inMemoryDriveToken = null;
    try {
      sessionStorage.removeItem(DRIVE_TOKEN_STORAGE_KEY);
    } catch {}
    await signOut(auth);
    SecurityLogger.log('logout', email || undefined, 'Sessão encerrada.');
  }

  /**
   * Listener em tempo real da sessão do usuário
   */
  public static onAuthState(callback: (user: AuthUser | null) => void) {
    return onAuthStateChanged(auth, (firebaseUser) => {
      callback(this.mapFirebaseUser(firebaseUser));
    });
  }
}
