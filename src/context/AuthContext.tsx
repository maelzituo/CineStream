/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AuthUser, SecurityEvent } from '../types';
import { AuthService } from '../lib/authService';
import { SecurityLogger } from '../lib/securityLogger';

export type AuthModalView = 'login' | 'register' | 'forgot_password';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  driveToken: string | null;
  isAuthModalOpen: boolean;
  authModalView: AuthModalView;
  openAuthModal: (view?: AuthModalView) => void;
  closeAuthModal: () => void;
  setAuthModalView: (view: AuthModalView) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, photoURL?: string) => Promise<void>;
  loginWithGoogle: () => Promise<string | null>;
  logout: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  changePassword: (currentPass: string, newPass: string) => Promise<void>;
  updateProfile: (name: string, photoURL?: string) => Promise<void>;
  securityLogs: SecurityEvent[];
  refreshSecurityLogs: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [driveToken, setDriveToken] = useState<string | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalView, setAuthModalView] = useState<AuthModalView>('login');
  const [securityLogs, setSecurityLogs] = useState<SecurityEvent[]>(() => SecurityLogger.getLogs());

  const refreshSecurityLogs = useCallback(() => {
    setSecurityLogs(SecurityLogger.getLogs());
  }, []);

  // Observa mudanças de estado na autenticação Firebase
  useEffect(() => {
    const unsubscribe = AuthService.onAuthState((authUser) => {
      setUser(authUser);
      setLoading(false);
      setDriveToken(AuthService.getDriveToken());
      refreshSecurityLogs();
    });

    return () => unsubscribe();
  }, [refreshSecurityLogs]);

  const openAuthModal = useCallback((view: AuthModalView = 'login') => {
    setAuthModalView(view);
    setIsAuthModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setIsAuthModalOpen(false);
  }, []);

  const login = async (email: string, password: string) => {
    const loggedUser = await AuthService.login(email, password);
    setUser(loggedUser);
    refreshSecurityLogs();
    closeAuthModal();
  };

  const register = async (name: string, email: string, password: string, photoURL?: string) => {
    const newUser = await AuthService.register(name, email, password, photoURL);
    setUser(newUser);
    refreshSecurityLogs();
    closeAuthModal();
  };

  const loginWithGoogle = async (): Promise<string | null> => {
    const { user: loggedUser, accessToken } = await AuthService.loginWithGoogle();
    setUser(loggedUser);
    setDriveToken(accessToken || null);
    refreshSecurityLogs();
    closeAuthModal();
    return accessToken || null;
  };

  const logout = async () => {
    await AuthService.logout();
    setUser(null);
    setDriveToken(null);
    refreshSecurityLogs();
  };

  const requestPasswordReset = async (email: string) => {
    await AuthService.requestPasswordReset(email);
    refreshSecurityLogs();
  };

  const changePassword = async (currentPass: string, newPass: string) => {
    await AuthService.changePassword(currentPass, newPass);
    refreshSecurityLogs();
  };

  const updateProfile = async (name: string, photoURL?: string) => {
    const updated = await AuthService.updateProfileData(name, photoURL);
    setUser(updated);
    refreshSecurityLogs();
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
        changePassword,
        updateProfile,
        securityLogs,
        refreshSecurityLogs,
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
