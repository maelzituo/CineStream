/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UserDocument } from '../types/models';
import AuthService from '../services/auth/authService';

export type AuthModalView = 'login' | 'register' | 'forgot_password';

interface AuthContextType {
  user: UserDocument | null;
  loading: boolean;
  driveToken: string | null;
  isAuthModalOpen: boolean;
  authModalView: AuthModalView;
  openAuthModal: (view?: AuthModalView) => void;
  closeAuthModal: () => void;
  setAuthModalView: (view: AuthModalView) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, photoURL?: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  updateProfile: (name: string, photoURL?: string) => Promise<void>;
  deleteAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [driveToken, setDriveToken] = useState<string | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalView, setAuthModalView] = useState<AuthModalView>('login');

  useEffect(() => {
    const unsubscribe = AuthService.onAuthState((authUser) => {
      setUser(authUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const openAuthModal = useCallback((view: AuthModalView = 'login') => {
    setAuthModalView(view);
    setIsAuthModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setIsAuthModalOpen(false);
  }, []);

  const login = async (email: string, password: string) => {
    await AuthService.login(email, password);
    closeAuthModal();
  };

  const register = async (name: string, email: string, password: string, photoURL?: string) => {
    await AuthService.register(name, email, password);
    if (photoURL) {
      await AuthService.updateProfile(name, photoURL);
    }
    closeAuthModal();
  };

  const loginWithGoogle = async () => {
    const token = await AuthService.loginWithGoogle();
    if (token) setDriveToken(token);
    closeAuthModal();
  };

  const logout = async () => {
    await AuthService.logout();
    setDriveToken(null);
  };

  const requestPasswordReset = async (email: string) => {
    await AuthService.resetPassword(email);
  };

  const updateProfile = async (name: string, photoURL?: string) => {
    await AuthService.updateProfile(name, photoURL);
  };

  const deleteAccount = async () => {
    await AuthService.deleteAccount();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        driveToken,
        isAuthModalOpen,
        authModalView,
        openAuthModal,
        closeAuthModal,
        setAuthModalView,
        login,
        register,
        loginWithGoogle,
        logout,
        requestPasswordReset,
        updateProfile,
        deleteAccount
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser utilizado dentro de um AuthProvider');
  }
  return context;
};

