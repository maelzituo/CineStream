/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { User } from 'firebase/auth';
import { auth } from './firebaseClient';
import { AuthService } from './authService';

export { auth };

// Initialize auth listener
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return AuthService.onAuthState((authUser) => {
    if (authUser && auth.currentUser) {
      const token = AuthService.getDriveToken() || '';
      if (onAuthSuccess) onAuthSuccess(auth.currentUser, token);
    } else {
      if (onAuthFailure) onAuthFailure();
    }
  });
};

// Start Google sign-in flow
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  const result = await AuthService.loginWithGoogle();
  if (auth.currentUser) {
    return { user: auth.currentUser, accessToken: result.accessToken };
  }
  return null;
};

// Retrieve cached access token
export const getAccessToken = async (): Promise<string | null> => {
  return AuthService.getDriveToken();
};

// Clear session and sign out
export const logout = async () => {
  await AuthService.logout();
};

