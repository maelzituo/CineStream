/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  User,
  Star,
  Download,
  Settings,
  HelpCircle,
  LogOut,
  ChevronRight,
  ShieldCheck,
  ShieldAlert,
  Verified,
  Edit2,
  Check,
  X,
  CreditCard,
  HardDrive,
  Database,
  Trash2,
  RefreshCw,
  Server,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  History,
  LogIn,
  Sparkles,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Smartphone
} from 'lucide-react';
import { UserProfile, PasswordValidationResult } from '../types';
import { useAuth } from '../context/AuthContext';
import AuthService from '../services/auth/authService';
import { SecurityLogger } from '../lib/securityLogger';
import { validatePassword } from '../lib/passwordUtils';
import PasswordStrengthMeter from './auth/PasswordStrengthMeter';
import AvatarPicker, { CINEMA_AVATARS } from './auth/AvatarPicker';
import { pwaManager } from '../lib/pwa';
import { handleImageError, DEFAULT_AVATAR_FALLBACK } from '../lib/imageFallback';
import { getFriendlyErrorMessage } from '../lib/firebaseMessages';

interface ProfileProps {
  onLogout: () => void;
  gdriveUser: any | null;
  onGoogleSignIn: () => void;
  onGoogleSignOut: () => void;
  savedCount?: number;
}

export default function Profile({
  onLogout,
  gdriveUser,
  onGoogleSignIn,
  onGoogleSignOut,
  savedCount,
}: ProfileProps) {
  const {
    user,
    openAuthModal,
    logout,
    updateProfile,
  } = useAuth();
  
  const [securityLogs, setSecurityLogs] = useState(() => user ? SecurityLogger.getLogs() : []);
  const refreshSecurityLogs = () => {
    if (user) {
      setSecurityLogs(SecurityLogger.getLogs());
    }
  };

  // Estado do Perfil
  const [profileName, setProfileName] = useState(
    user?.name || user?.email?.split('@')[0] || 'Usuário CineStream'
  );
  const [profileAvatar, setProfileAvatar] = useState(
    user?.photoURL || CINEMA_AVATARS[0].url
  );
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingAvatar, setIsEditingAvatar] = useState(false);
  const [activeSheet, setActiveSheet] = useState<string | null>(null);

  // Estados da Troca de Senha
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [passChangeLoading, setPassChangeLoading] = useState(false);
  const [passSuccess, setPassSuccess] = useState<string | null>(null);
  const [passError, setPassError] = useState<string | null>(null);

  // Sincroniza usuário autenticado
  useEffect(() => {
    if (user) {
      setProfileName(user.name || 'Usuário CineStream');
      setProfileAvatar(user.photoURL || CINEMA_AVATARS[0].url);
    }
  }, [user]);

  // Database status
  const [dbStatusMessage, setDbStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    if (activeSheet === 'seguranca') {
      refreshSecurityLogs();
      setPassError(null);
      setPassSuccess(null);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    }
  }, [activeSheet, refreshSecurityLogs]);

  const handleResetDb = () => {
    // Legacy support: We no longer have local database
    setDbStatusMessage('Banco de dados em nuvem. Use a nuvem para gerenciar.');
    setTimeout(() => setDbStatusMessage(null), 3000);
  };

  const handleClearHistory = async () => {
    // Cloud based now
    setDbStatusMessage('Use o suporte na nuvem.');
    setTimeout(() => setDbStatusMessage(null), 3000);
  };

  const handleSaveName = async () => {
    if (profileName.trim()) {
      try {
        if (user) {
          await updateProfile(profileName.trim(), profileAvatar);
        }
        setIsEditingName(false);
      } catch (err: any) {
        console.warn('Erro ao salvar nome:', err);
      }
    }
  };

  const handleSaveAvatar = async (url: string) => {
    setProfileAvatar(url);
    setIsEditingAvatar(false);
    if (user) {
      try {
        await updateProfile(profileName, url);
      } catch (err: any) {
        console.warn('Erro ao atualizar avatar no auth:', err);
      }
    }
  };

  const newPassValidation: PasswordValidationResult = validatePassword(newPassword);
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmNewPassword;

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError(null);
    setPassSuccess(null);

    if (!currentPassword) {
      setPassError('Informe sua senha atual.');
      return;
    }

    if (!newPassValidation.isValid) {
      setPassError('A nova senha precisa cumprir todos os requisitos de segurança.');
      return;
    }

    if (!passwordsMatch) {
      setPassError('As senhas digitadas não coincidem.');
      return;
    }

    setPassChangeLoading(true);
    try {
      await AuthService.changePassword(currentPassword, newPassword);
      setPassSuccess('Senha alterada com sucesso!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err: any) {
      setPassError(getFriendlyErrorMessage(err));
    } finally {
      setPassChangeLoading(false);
    }
  };

  const formatDate = (timestamp?: number | string) => {
    if (!timestamp) return 'Recente';
    try {
      const d = typeof timestamp === 'number' ? new Date(timestamp) : new Date(timestamp);
      return d.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Recente';
    }
  };

  const getEventBadge = (type: string) => {
    switch (type) {
      case 'login_success':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400">LOGIN OK</span>;
      case 'login_failed':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-400">FALHA</span>;
      case 'register':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-brand-red/20 text-brand-red">CADASTRO</span>;
      case 'password_changed':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-yellow-500/20 text-yellow-400">SENHA ALTERADA</span>;
      case 'rate_limit_lock':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400">BLOQUEIO</span>;
      case 'logout':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-500/20 text-gray-400">LOGOUT</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/10 text-gray-300">INFO</span>;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-brand-bg pt-24 px-6 md:px-16 pb-32 text-gray-200 select-none"
    >
      <div className="max-w-2xl mx-auto space-y-8">

        {/* Guest Banner if not logged in */}
        {!user && (
          <div className="p-5 rounded-3xl bg-gradient-to-r from-brand-red/20 via-surface-container to-surface-container border border-brand-red/30 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
            <div className="flex items-center gap-3.5 text-center sm:text-left">
              <div className="w-12 h-12 rounded-2xl bg-brand-red flex items-center justify-center text-white shrink-0 shadow-lg shadow-brand-red/30">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-display font-black text-white text-base">
                  Você está navegando como Convidado
                </h3>
                <p className="text-xs text-gray-400">
                  Crie uma conta gratuita para salvar seus favoritos, histórico e assistir em 4K.
                </p>
              </div>
            </div>
            <button
              onClick={() => openAuthModal('register')}
              className="px-5 py-2.5 bg-brand-red hover:bg-brand-red-hover text-white text-xs font-display font-black tracking-wider uppercase rounded-xl transition-all cursor-pointer active:scale-95 shrink-0 shadow-md shadow-brand-red/25 flex items-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              Entrar / Criar Conta
            </button>
          </div>
        )}

        {/* Profile Header Block */}
        <section className="flex flex-col items-center">
          <div className="relative group mb-4">
            {/* Circular avatar image */}
            <div className="w-32 h-32 md:w-36 md:h-36 rounded-full border-4 border-brand-red p-1.5 overflow-hidden shadow-2xl shadow-brand-red/15 relative bg-surface-container">
              <img                 referrerPolicy="no-referrer"
                className="w-full h-full object-cover rounded-full transition-transform duration-500 group-hover:scale-105"
                alt={profileName}
                src={profileAvatar || DEFAULT_AVATAR_FALLBACK}
                onError={(e) => handleImageError(e, 'avatar')}
              />
              <button
                onClick={() => setIsEditingAvatar(true)}
                className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-full flex flex-col items-center justify-center text-white text-xs font-display font-bold cursor-pointer"
              >
                <Edit2 className="w-5 h-5 mb-1" />
                Alterar Foto
              </button>
            </div>

            {/* Premium PRO Badge */}
            <div className="absolute bottom-1 right-1 bg-brand-red text-white px-3 py-1 rounded-full text-[10px] font-display font-black tracking-widest flex items-center gap-1 shadow-lg border border-white/10">
              <Verified className="w-3.5 h-3.5 fill-white/10" />
              {user ? (user.provider === 'google.com' ? 'GOOGLE PRO' : 'VIP PRO') : 'GUEST'}
            </div>
          </div>

          {/* User Name Area (Editable) */}
          {isEditingName ? (
            <div className="flex items-center gap-2 mt-2">
              <input
                type="text"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                className="bg-surface-container border border-white/10 px-3 py-1.5 rounded-lg text-white font-display font-bold text-lg md:text-xl text-center focus:outline-none focus:border-brand-red w-56"
                maxLength={30}
                autoFocus
              />
              <button
                onClick={handleSaveName}
                className="p-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg cursor-pointer active:scale-95 transition-all"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setProfileName(user?.name || 'Usuário CineStream');
                  setIsEditingName(false);
                }}
                className="p-1.5 bg-white/10 hover:bg-white/15 text-white rounded-lg cursor-pointer active:scale-95 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 mt-2 group/name">
              <h1 className="font-display font-black text-2xl md:text-3xl text-white tracking-tight text-center">
                {profileName}
              </h1>
              <button
                onClick={() => setIsEditingName(true)}
                className="opacity-0 group-hover/name:opacity-100 p-1.5 text-gray-400 hover:text-white rounded-full hover:bg-white/5 active:scale-90 transition-all cursor-pointer"
                title="Editar Nome"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <p className="font-sans text-xs md:text-sm text-gray-400 mt-1">
            {user?.email || 'Nenhuma conta vinculada'} • Membro desde {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }) : 'Outubro 2023'}
          </p>
        </section>

        {/* Profile Statistics Grid */}
        <section className="grid grid-cols-3 gap-4">
          <div className="glass-panel rounded-xl p-4 text-center hover:bg-white/5 transition-colors">
            <p className="font-display font-black text-xl md:text-2xl text-brand-red">
              -
            </p>
            <p className="font-display font-extrabold text-[9px] md:text-[10px] text-gray-400 tracking-wider mt-1 uppercase">
              Assistidos
            </p>
          </div>
          <div className="glass-panel rounded-xl p-4 text-center hover:bg-white/5 transition-colors">
            <p className="font-display font-black text-xl md:text-2xl text-brand-red">
              {savedCount !== undefined ? savedCount : 0}
            </p>
            <p className="font-display font-extrabold text-[9px] md:text-[10px] text-gray-400 tracking-wider mt-1 uppercase">
              Minha Lista
            </p>
          </div>
          <div className="glass-panel rounded-xl p-4 text-center hover:bg-white/5 transition-colors">
            <p className="font-display font-black text-xl md:text-2xl text-brand-red">
              -
            </p>
            <p className="font-display font-extrabold text-[9px] md:text-[10px] text-gray-400 tracking-wider mt-1 uppercase">
              Avaliações
            </p>
          </div>
        </section>

        {/* Options List Container */}
        <section className="space-y-6">
          {/* SEGURANÇA & CONTA SECTION */}
          <div className="space-y-2">
            <h2 className="font-display font-extrabold text-[10px] tracking-widest text-gray-400 px-1 uppercase">
              Segurança & Conta
            </h2>
            <div className="glass-panel rounded-2xl overflow-hidden divide-y divide-white/5">
              
              {/* Option: Central de Segurança */}
              <button
                onClick={() => setActiveSheet('seguranca')}
                className="w-full flex items-center justify-between p-4 hover:bg-white/5 active:bg-white/5 transition-colors group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                    <ShieldCheck className="w-4.5 h-4.5" />
                  </div>
                  <div className="text-left">
                    <span className="font-sans font-semibold text-sm text-gray-200 group-hover:text-white block">
                      Segurança & Senha
                    </span>
                    <span className="text-[11px] text-gray-400 block">
                      Troca de senha, logs de auditoria e conexões
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                  <span>Protegido</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>

              {/* Option: Assinatura */}
              <button
                onClick={() => setActiveSheet('assinatura')}
                className="w-full flex items-center justify-between p-4 hover:bg-white/5 active:bg-white/5 transition-colors group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-brand-red/10 flex items-center justify-center text-brand-red">
                    <Star className="w-4.5 h-4.5 fill-brand-red/20" />
                  </div>
                  <span className="font-sans font-semibold text-sm text-gray-200 group-hover:text-white">
                    Plano & Benefícios
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium">
                  <span>CineStream Anual VIP</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>

              {/* Option: Downloads */}
              <button
                onClick={() => setActiveSheet('downloads')}
                className="w-full flex items-center justify-between p-4 hover:bg-white/5 active:bg-white/5 transition-colors group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-brand-red/10 flex items-center justify-center text-brand-red">
                    <Download className="w-4.5 h-4.5" />
                  </div>
                  <span className="font-sans font-semibold text-sm text-gray-200 group-hover:text-white">
                    Downloads Offline
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium">
                  <span>4.2 GB</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
            </div>
          </div>

          {/* NUVEM & DIAGNÓSTICOS SECTION */}
          <div className="space-y-2">
            <h2 className="font-display font-extrabold text-[10px] tracking-widest text-gray-400 px-1 uppercase">
              Diagnósticos & Sincronização
            </h2>
            <div className="glass-panel rounded-2xl overflow-hidden divide-y divide-white/5">
              
              {/* Option: Google Drive Cloud Stream */}
              <div className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-brand-red/10 flex items-center justify-center text-brand-red">
                    <HardDrive className="w-4.5 h-4.5" />
                  </div>
                  <div className="text-left">
                    <span className="font-sans font-semibold text-sm text-gray-200 block">
                      Google Drive Cloud
                    </span>
                    <span className="font-sans text-[11px] text-gray-400 block truncate max-w-[200px]">
                      {gdriveUser ? `Conectado: ${gdriveUser.email}` : 'Conexão em nuvem inativa'}
                    </span>
                  </div>
                </div>
                {gdriveUser ? (
                  <button
                    onClick={onGoogleSignOut}
                    className="px-3 py-1.5 bg-red-950/20 hover:bg-brand-red/20 text-brand-red text-xs font-display font-black tracking-widest rounded-lg border border-brand-red/30 cursor-pointer active:scale-95 transition-all"
                  >
                    DESCONECTAR
                  </button>
                ) : (
                  <button
                    onClick={onGoogleSignIn}
                    className="px-3 py-1.5 bg-brand-red hover:bg-brand-red-hover text-white text-xs font-display font-black tracking-widest rounded-lg border border-white/10 cursor-pointer active:scale-95 transition-all shadow-md shadow-brand-red/25"
                  >
                    CONECTAR
                  </button>
                )}
              </div>

              {/* Option: Gerenciar Banco de Dados */}
              <button
                onClick={() => setActiveSheet('banco de dados')}
                className="w-full flex items-center justify-between p-4 hover:bg-white/5 active:bg-white/5 transition-colors group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-brand-red/10 flex items-center justify-center text-brand-red">
                    <Database className="w-4.5 h-4.5" />
                  </div>
                  <span className="font-sans font-semibold text-sm text-gray-200 group-hover:text-white">
                    Status do Banco de Dados
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-mono font-bold">
                  <span>SINCRONIZADO / ONLINE</span>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>

              {/* Option: Aplicativo PWA */}
              <button
                onClick={() => setActiveSheet('app_pwa')}
                className="w-full flex items-center justify-between p-4 hover:bg-white/5 active:bg-white/5 transition-colors group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-brand-red/10 flex items-center justify-center text-brand-red">
                    <Smartphone className="w-4.5 h-4.5" />
                  </div>
                  <div className="text-left">
                    <span className="font-sans font-semibold text-sm text-gray-200 group-hover:text-white block">
                      Aplicativo & Instalação PWA
                    </span>
                    <span className="font-sans text-[11px] text-gray-400 block">
                      Instalação standalone, offline e gerenciamento de cache
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-brand-red font-semibold">
                  <span>{pwaManager.isStandalone() ? 'INSTALADO' : 'CONFIGURAR'}</span>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
            </div>
          </div>

          {/* Sair da Conta / Logout ou Login */}
          <div className="pt-4 space-y-3">
            {user ? (
              <button
                onClick={async () => {
                  await logout();
                  onLogout();
                }}
                className="w-full flex items-center justify-center gap-2 p-4 bg-white/5 hover:bg-red-950/20 hover:border-brand-red/30 border border-white/5 rounded-2xl transition-all duration-300 group cursor-pointer"
              >
                <LogOut className="w-4.5 h-4.5 text-brand-red group-hover:scale-110 transition-transform" />
                <span className="font-sans font-bold text-sm text-brand-red">
                  Sair da Conta ({user.email})
                </span>
              </button>
            ) : (
              <button
                onClick={() => openAuthModal('login')}
                className="w-full flex items-center justify-center gap-2 p-4 bg-brand-red hover:bg-brand-red-hover text-white rounded-2xl transition-all duration-300 font-display font-black text-xs tracking-wider uppercase cursor-pointer shadow-lg shadow-brand-red/25"
              >
                <LogIn className="w-4 h-4" />
                Fazer Login no CineStream
              </button>
            )}

            <p className="text-center font-sans text-[11px] text-gray-500 mt-6 tracking-wide select-none">
              CineStream v4.12.0 • Autenticação Segura Firebase & OAuth 2.0
            </p>
          </div>
        </section>
      </div>

      {/* Modal de Escolha de Avatar */}
      <AnimatePresence>
        {isEditingAvatar && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md bg-surface-container border border-white/10 rounded-3xl p-6 shadow-2xl space-y-4"
            >
              <div className="flex justify-between items-center border-b border-white/5 pb-3">
                <h3 className="font-display font-black text-white text-base">
                  Alterar Avatar do Perfil
                </h3>
                <button
                  onClick={() => setIsEditingAvatar(false)}
                  className="p-1 rounded-full text-gray-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <AvatarPicker
                selectedUrl={profileAvatar}
                onSelect={handleSaveAvatar}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Slide-over Sheets Modals */}
      <AnimatePresence>
        {activeSheet && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-4">
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 240 }}
              className="w-full max-w-xl bg-surface-container border-t sm:border border-white/10 rounded-t-3xl sm:rounded-3xl p-6 space-y-6 relative overflow-hidden max-h-[85vh] flex flex-col"
            >
              {/* Header */}
              <div className="flex justify-between items-center border-b border-white/5 pb-3 shrink-0">
                <h3 className="font-display font-black text-lg text-white capitalize">
                  {activeSheet === 'seguranca' && 'Central de Segurança & Auditoria'}
                  {activeSheet === 'assinatura' && 'Detalhes da Assinatura'}
                  {activeSheet === 'downloads' && 'Downloads Offline'}
                  {activeSheet === 'banco de dados' && 'Diagnósticos do Banco de Dados'}
                </h3>
                <button
                  onClick={() => setActiveSheet(null)}
                  className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 active:scale-90 transition-all text-gray-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              {/* Sheet content */}
              <div className="space-y-5 text-sm text-gray-300 leading-relaxed overflow-y-auto pr-1 flex-1">
                
                {/* ABA DE SEGURANÇA */}
                {activeSheet === 'seguranca' && (
                  <div className="space-y-6">
                    {/* Status da Conta */}
                    <div className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400 font-bold uppercase">Provedor de Acesso:</span>
                        <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full">
                          {user?.provider === 'google.com' ? 'Google OAuth 2.0' : 'E-mail & Senha Criptografada'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400 font-bold uppercase">Identificador UID:</span>
                        <span className="text-xs font-mono text-gray-300 truncate max-w-[180px]">
                          {user?.uid || 'Sessão Convidado'}
                        </span>
                      </div>
                    </div>

                    {/* Formulário de Troca de Senha (apenas para provedor password) */}
                    {user?.provider !== 'google.com' && (
                      <div className="space-y-3 p-4 bg-surface/70 rounded-2xl border border-white/5">
                        <h4 className="text-xs font-display font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                          <Lock className="w-3.5 h-3.5 text-brand-red" />
                          Alterar Senha de Acesso
                        </h4>

                        {passSuccess && (
                          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 shrink-0" />
                            <span>{passSuccess}</span>
                          </div>
                        )}

                        {passError && (
                          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <span>{passError}</span>
                          </div>
                        )}

                        <form onSubmit={handleChangePasswordSubmit} className="space-y-3 pt-1">
                          {/* Senha Atual */}
                          <div className="space-y-1">
                            <label className="text-[11px] text-gray-400 font-semibold">Senha Atual</label>
                            <div className="relative flex items-center">
                              <input
                                type={showCurrentPass ? 'text' : 'password'}
                                required
                                placeholder="••••••••"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                className="w-full bg-surface-container border border-white/10 rounded-xl py-2 px-3 pr-10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-brand-red"
                              />
                              <button
                                type="button"
                                onClick={() => setShowCurrentPass(!showCurrentPass)}
                                className="absolute right-2.5 text-gray-400 hover:text-white p-1"
                              >
                                {showCurrentPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          </div>

                          {/* Nova Senha */}
                          <div className="space-y-1">
                            <label className="text-[11px] text-gray-400 font-semibold">Nova Senha Segura</label>
                            <div className="relative flex items-center">
                              <input
                                type={showNewPass ? 'text' : 'password'}
                                required
                                placeholder="Mínimo 8 caracteres com símbolos"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full bg-surface-container border border-white/10 rounded-xl py-2 px-3 pr-10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-brand-red"
                              />
                              <button
                                type="button"
                                onClick={() => setShowNewPass(!showNewPass)}
                                className="absolute right-2.5 text-gray-400 hover:text-white p-1"
                              >
                                {showNewPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                            {newPassword.length > 0 && (
                              <PasswordStrengthMeter validation={newPassValidation} showRequirements={true} />
                            )}
                          </div>

                          {/* Confirmar Nova Senha */}
                          <div className="space-y-1">
                            <label className="text-[11px] text-gray-400 font-semibold">Confirmar Nova Senha</label>
                            <input
                              type="password"
                              required
                              placeholder="Repita a nova senha"
                              value={confirmNewPassword}
                              onChange={(e) => setConfirmNewPassword(e.target.value)}
                              className="w-full bg-surface-container border border-white/10 rounded-xl py-2 px-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-brand-red"
                            />
                            {confirmNewPassword.length > 0 && !passwordsMatch && (
                              <p className="text-[10px] text-red-400">As senhas não coincidem.</p>
                            )}
                          </div>

                          <button
                            type="submit"
                            disabled={passChangeLoading}
                            className="w-full py-2.5 bg-brand-red hover:bg-brand-red-hover disabled:bg-gray-800 text-white font-display font-bold text-xs rounded-xl cursor-pointer active:scale-95 transition-all flex items-center justify-center gap-2 shadow-md shadow-brand-red/20"
                          >
                            {passChangeLoading ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ATUALIZANDO SENHA...
                              </>
                            ) : (
                              'SALVAR NOVA SENHA'
                            )}
                          </button>
                        </form>
                      </div>
                    )}

                    {/* Logs de Auditoria de Segurança */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-display font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                          <History className="w-3.5 h-3.5 text-brand-red" />
                          Log de Auditoria de Segurança
                        </h4>
                        <span className="text-[10px] text-gray-500">Últimos eventos</span>
                      </div>

                      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                        {securityLogs.length === 0 ? (
                          <p className="text-xs text-gray-500 py-3 text-center">Nenhum evento registrado ainda.</p>
                        ) : (
                          securityLogs.map((log) => (
                            <div
                              key={log.id}
                              className="p-2.5 bg-white/5 rounded-xl border border-white/5 flex items-center justify-between gap-2 text-xs"
                            >
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-2">
                                  {getEventBadge(log.type)}
                                  <span className="text-[11px] text-gray-300 font-medium">
                                    {log.details || log.type}
                                  </span>
                                </div>
                                <p className="text-[10px] text-gray-500">
                                  {log.email ? `${log.email} • ` : ''}
                                  {formatDate(log.timestamp)}
                                </p>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* ABA DE ASSINATURA */}
                {activeSheet === 'assinatura' && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-4 bg-brand-red/10 rounded-xl border border-brand-red/25">
                      <CreditCard className="text-brand-red w-6 h-6 shrink-0" />
                      <div>
                        <p className="text-white font-display font-extrabold text-sm">Plano CineStream Anual VIP</p>
                        <p className="text-xs text-gray-400 mt-0.5">Acesso ilimitado e sem anúncios</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Benefícios Inclusos:</p>
                      <ul className="space-y-1 text-xs text-gray-300 list-disc list-inside">
                        <li>Acesso ilimitado a produções originais em 4K UHD</li>
                        <li>Downloads offline em até 4 dispositivos simultâneos</li>
                        <li>Som imersivo Spatial Dolby Atmos</li>
                        <li>Sem anúncios comerciais</li>
                      </ul>
                    </div>
                  </div>
                )}

                {/* ABA DE DOWNLOADS */}
                {activeSheet === 'downloads' && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-4 bg-white/5 rounded-xl border border-white/5">
                      <HardDrive className="text-brand-red w-6 h-6 animate-pulse" />
                      <div className="flex-1">
                        <p className="text-white font-sans font-bold text-sm">Espaço Utilizado: 4.2 GB</p>
                        <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden mt-1.5">
                          <div className="bg-brand-red h-full w-[42%]" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ABA DE BANCO DE DADOS */}
                {activeSheet === 'banco de dados' && (
                  <div className="space-y-5">
                    <div className="flex items-center gap-3 p-4 bg-brand-red/10 rounded-xl border border-brand-red/25 relative overflow-hidden">
                      <Server className="text-brand-red w-6 h-6 animate-pulse" />
                      <div>
                        <p className="text-white font-display font-extrabold text-sm">Estrutura Local & Firestore Sync</p>
                        <p className="text-xs text-gray-400 mt-0.5">Sincronização reativa ativa</p>
                      </div>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping absolute" />
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 relative" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3.5 bg-white/5 rounded-xl border border-white/5 text-center">
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1">Tamanho Estimado</span>
                        <span className="font-mono text-sm text-white font-bold">Nuvem (Firebase)</span>
                      </div>
                      <div className="p-3.5 bg-white/5 rounded-xl border border-white/5 text-center">
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1">Estabilidade</span>
                        <span className="font-mono text-sm text-emerald-400 font-bold">100% Saudável</span>
                      </div>
                    </div>

                    {dbStatusMessage && (
                      <div className="p-3 bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 rounded-xl text-center text-xs font-bold font-sans">
                        {dbStatusMessage}
                      </div>
                    )}

                    <div className="pt-2 space-y-3">
                      <button
                        onClick={handleClearHistory}
                        className="w-full flex items-center justify-center gap-2 py-3 bg-white/5 hover:bg-brand-red/10 hover:text-brand-red border border-white/10 rounded-xl transition-all font-sans font-bold text-xs cursor-pointer active:scale-95"
                      >
                        <Trash2 className="w-4 h-4" />
                        Limpar Histórico de Reprodução
                      </button>

                      <button
                        onClick={handleResetDb}
                        className="w-full flex items-center justify-center gap-2 py-3 bg-white/5 hover:bg-emerald-500/10 hover:text-emerald-400 border border-white/10 rounded-xl transition-all font-sans font-bold text-xs cursor-pointer active:scale-95"
                      >
                        <RefreshCw className="w-4 h-4" />
                        Restaurar Banco de Dados
                      </button>
                    </div>
                  </div>
                )}

                {/* ABA DE APLICATIVO & PWA */}
                {activeSheet === 'app_pwa' && (
                  <div className="space-y-5">
                    <div className="flex items-center gap-3 p-4 bg-brand-red/10 rounded-xl border border-brand-red/25 relative overflow-hidden">
                      <Smartphone className="text-brand-red w-6 h-6" />
                      <div>
                        <p className="text-white font-display font-extrabold text-sm">Progressive Web App (PWA)</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {pwaManager.isStandalone()
                            ? 'Executando em Modo Standalone Nativo'
                            : 'Executando no Navegador Web'}
                        </p>
                      </div>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        <span className="px-2 py-1 bg-brand-red/20 border border-brand-red/30 rounded text-[10px] font-mono text-brand-red font-bold uppercase">
                          {pwaManager.isStandalone() ? 'NATIVO' : 'WEB'}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3.5 bg-white/5 rounded-xl border border-white/5 text-center">
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1">Service Worker</span>
                        <span className="font-mono text-xs text-emerald-400 font-bold">Ativo & Otimizado</span>
                      </div>
                      <div className="p-3.5 bg-white/5 rounded-xl border border-white/5 text-center">
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1">Modo Offline</span>
                        <span className="font-mono text-xs text-emerald-400 font-bold">Suportado</span>
                      </div>
                    </div>

                    <div className="p-4 bg-surface-container/60 rounded-xl border border-white/5 space-y-2 text-xs text-gray-300">
                      <p className="font-semibold text-white">Benefícios do App Instalado:</p>
                      <ul className="list-disc list-inside space-y-1 text-gray-400 text-[11px]">
                        <li>Experiência cinematográfica em tela cheia sem barras do navegador</li>
                        <li>Inicialização ultra rápida com cache inteligente de capas e catálogo</li>
                        <li>Sessão e favoritos mantidos mesmo sem conexão com a internet</li>
                        <li>Ícone dedicado na tela inicial do celular ou área de trabalho</li>
                      </ul>
                    </div>

                    <div className="pt-2 space-y-3">
                      {!pwaManager.isStandalone() && (
                        <button
                          onClick={async () => {
                            if (pwaManager.isIOS()) {
                              alert('No iPhone/iPad: Toque no botão Compartilhar do Safari e selecione "Adicionar à Tela de Início".');
                            } else {
                              await pwaManager.promptInstall();
                            }
                          }}
                          className="w-full flex items-center justify-center gap-2 py-3.5 bg-brand-red hover:bg-brand-red-hover text-white rounded-xl transition-all font-display font-black text-xs uppercase tracking-wider cursor-pointer active:scale-95 shadow-lg shadow-brand-red/30"
                        >
                          <Download className="w-4 h-4" />
                          Instalar CineStream no Dispositivo
                        </button>
                      )}

                      <button
                        onClick={async () => {
                          try {
                            if ('caches' in window) {
                              const keys = await caches.keys();
                              await Promise.all(
                                keys
                                  .filter((k) => k.includes('images'))
                                  .map((k) => caches.delete(k))
                              );
                              alert('Cache de imagens e posters esvaziado com sucesso!');
                            }
                          } catch (e) {
                            console.error(e);
                          }
                        }}
                        className="w-full flex items-center justify-center gap-2 py-3 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 rounded-xl transition-all font-sans font-bold text-xs cursor-pointer active:scale-95"
                      >
                        <Trash2 className="w-4 h-4 text-gray-400" />
                        Limpar Cache de Imagens Temporárias
                      </button>

                      <button
                        onClick={() => {
                          pwaManager.applyUpdate();
                        }}
                        className="w-full flex items-center justify-center gap-2 py-3 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 rounded-xl transition-all font-sans font-bold text-xs cursor-pointer active:scale-95"
                      >
                        <RefreshCw className="w-4 h-4 text-gray-400" />
                        Verificar Atualizações do App
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
