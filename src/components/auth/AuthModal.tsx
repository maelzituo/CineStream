/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  ShieldCheck,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  KeyRound,
  Sparkles
} from 'lucide-react';
import { useAuth, AuthModalView } from '../../context/AuthContext';
import { validateEmail, validateName, validatePassword } from '../../lib/passwordUtils';
import { SecurityLogger } from '../../lib/securityLogger';
import { getFriendlyErrorMessage } from '../../lib/firebaseMessages';
import PasswordStrengthMeter from './PasswordStrengthMeter';
import AvatarPicker, { CINEMA_AVATARS } from './AvatarPicker';

export default function AuthModal() {
  const {
    isAuthModalOpen,
    closeAuthModal,
    authModalView,
    setAuthModalView,
    login,
    register,
    loginWithGoogle,
    requestPasswordReset,
  } = useAuth();

  // Estados dos Formulários
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(CINEMA_AVATARS[0].url);
  const [rememberMe, setRememberMe] = useState(true);

  // UI e Feedback
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Lockout de Força Bruta
  const [lockoutRemaining, setLockoutRemaining] = useState<number>(0);

  // Reset de estados ao abrir/mudar de aba
  useEffect(() => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(false);
  }, [authModalView, isAuthModalOpen]);

  // Checa lockout timer
  useEffect(() => {
    if (email && isAuthModalOpen) {
      const lock = SecurityLogger.checkLockout(email);
      setLockoutRemaining(lock.remainingSeconds);
    }
  }, [email, isAuthModalOpen]);

  // Contagem regressiva do lockout
  useEffect(() => {
    if (lockoutRemaining > 0) {
      const timer = setInterval(() => {
        setLockoutRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [lockoutRemaining]);

  // Validação em Tempo Real para Cadastro
  const nameValidation = useMemo(() => validateName(name), [name]);
  const emailValidation = useMemo(() => validateEmail(email), [email]);
  const passwordValidation = useMemo(() => validatePassword(password), [password]);
  const passwordsMatch = password.length > 0 && password === confirmPassword;

  // Submissão do Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (lockoutRemaining > 0) {
      setErrorMessage(`Aguarde ${lockoutRemaining}s para tentar novamente.`);
      return;
    }

    if (!emailValidation.isValid) {
      setErrorMessage('Por favor, informe um endereço de e-mail válido.');
      return;
    }

    if (!password) {
      setErrorMessage('Por favor, informe sua senha de acesso.');
      return;
    }

    setIsLoading(true);
    try {
      await login(emailValidation.normalized, password);
    } catch (err: any) {
      setErrorMessage(getFriendlyErrorMessage(err));
      // Atualiza lockout se disparou
      const lock = SecurityLogger.checkLockout(email);
      if (lock.isLocked) {
        setLockoutRemaining(lock.remainingSeconds);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Submissão do Cadastro
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!nameValidation.isValid) {
      setErrorMessage(nameValidation.error || 'Nome inválido.');
      return;
    }

    if (!emailValidation.isValid) {
      setErrorMessage(emailValidation.error || 'E-mail inválido.');
      return;
    }

    if (!passwordValidation.isValid) {
      setErrorMessage('A senha precisa atender a todos os requisitos de segurança listados abaixo.');
      return;
    }

    if (!passwordsMatch) {
      setErrorMessage('As senhas digitadas não coincidem.');
      return;
    }

    setIsLoading(true);
    try {
      await register(nameValidation.sanitized, emailValidation.normalized, password, selectedAvatar);
    } catch (err: any) {
      setErrorMessage(getFriendlyErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  // Submissão de Recuperação de Senha
  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!emailValidation.isValid) {
      setErrorMessage('Por favor, insira um e-mail válido.');
      return;
    }

    setIsLoading(true);
    try {
      await requestPasswordReset(emailValidation.normalized);
      setSuccessMessage(
        'Instruções enviadas! Caso o e-mail esteja cadastrado, você receberá um link seguro para redefinir sua senha em instantes.'
      );
    } catch (err: any) {
      setErrorMessage(getFriendlyErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  // Login com Google OAuth Oficial
  const handleGoogleClick = async () => {
    setErrorMessage(null);
    setIsLoading(true);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      setErrorMessage(getFriendlyErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={closeAuthModal}
        className="fixed inset-0 bg-black/80 backdrop-blur-md"
      />

      {/* Modal Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ type: 'spring', damping: 25, stiffness: 280 }}
        className="relative w-full max-w-md bg-surface-container border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl z-10 my-auto overflow-hidden text-gray-200"
      >
        {/* Glow Superior */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-32 bg-brand-red/20 blur-3xl rounded-full pointer-events-none" />

        {/* Botão Fechar */}
        <button
          onClick={closeAuthModal}
          className="absolute top-5 right-5 p-2 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all cursor-pointer active:scale-90"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Cabeçalho */}
        <div className="text-center space-y-1 mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-red/10 border border-brand-red/20 text-brand-red text-[10px] font-display font-black tracking-widest uppercase mb-2">
            <Sparkles className="w-3 h-3" />
            CineStream Cinema Club
          </div>
          <h2 className="text-2xl font-display font-black text-white tracking-tight">
            {authModalView === 'login' && 'Bem-vindo de Volta'}
            {authModalView === 'register' && 'Crie sua Conta'}
            {authModalView === 'forgot_password' && 'Recuperar Acesso'}
          </h2>
          <p className="text-xs text-gray-400">
            {authModalView === 'login' && 'Acesse seus filmes, séries e listas sincronizadas.'}
            {authModalView === 'register' && 'Cadastre-se para assistir com qualidade Ultra HD.'}
            {authModalView === 'forgot_password' && 'Enviaremos um link criptografado para seu e-mail.'}
          </p>
        </div>

        {/* Abas Alternadoras (Login / Cadastro) */}
        {authModalView !== 'forgot_password' && (
          <div className="grid grid-cols-2 p-1 bg-surface/80 rounded-2xl border border-white/5 mb-6">
            <button
              type="button"
              onClick={() => setAuthModalView('login')}
              className={`py-2 text-xs font-display font-black tracking-wider uppercase rounded-xl transition-all cursor-pointer ${
                authModalView === 'login'
                  ? 'bg-brand-red text-white shadow-lg shadow-brand-red/20'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={() => setAuthModalView('register')}
              className={`py-2 text-xs font-display font-black tracking-wider uppercase rounded-xl transition-all cursor-pointer ${
                authModalView === 'register'
                  ? 'bg-brand-red text-white shadow-lg shadow-brand-red/20'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Cadastrar
            </button>
          </div>
        )}

        {/* Banner de Erro */}
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-4 p-3.5 rounded-xl border flex items-start gap-2.5 text-xs ${
              errorMessage.startsWith('PROVIDER_DISABLED|') || errorMessage.startsWith('UNAUTHORIZED_DOMAIN|')
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                : 'bg-red-500/10 border-red-500/30 text-red-300'
            }`}
          >
            <AlertCircle className={`w-4 h-4 shrink-0 mt-0.5 ${(errorMessage.startsWith('PROVIDER_DISABLED|') || errorMessage.startsWith('UNAUTHORIZED_DOMAIN|')) ? 'text-amber-400' : 'text-brand-red'}`} />
            <div className="flex-1 leading-snug">
              {errorMessage.startsWith('PROVIDER_DISABLED|') ? (
                <div className="space-y-1.5">
                  <strong className="block text-amber-400 font-display text-xs">Email/Senha Desativado</strong>
                  <p>O método de autenticação por E-mail e Senha não está habilitado no seu projeto Firebase.</p>
                  <p className="opacity-80">Acesse o <strong>Firebase Console &gt; Authentication &gt; Sign-in method</strong>, adicione e habilite <strong>Email/Password</strong>.</p>
                </div>
              ) : errorMessage.startsWith('UNAUTHORIZED_DOMAIN|') ? (
                <div className="space-y-1.5">
                  <strong className="block text-amber-400 font-display text-xs">Domínio Não Autorizado</strong>
                  <p>O Firebase bloqueou o login porque este domínio não está na lista de origens autorizadas.</p>
                  <p className="opacity-80">
                    Acesse o <strong>Firebase Console &gt; Authentication &gt; Settings &gt; Authorized domains</strong> e adicione:<br/>
                    <code className="bg-black/30 px-1 py-0.5 rounded mt-1 block select-all">{errorMessage.split('|')[1]}</code>
                  </p>
                </div>
              ) : (
                errorMessage
              )}
            </div>
          </motion.div>
        )}

        {/* Banner de Sucesso */}
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-2.5 text-xs text-emerald-300"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div className="flex-1 leading-snug">{successMessage}</div>
          </motion.div>
        )}

        {/* Banner de Bloqueio por Força Bruta */}
        {lockoutRemaining > 0 && (
          <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs text-amber-300 font-mono">
            <span>Tentativas excedidas:</span>
            <span className="font-bold bg-amber-500/20 px-2 py-0.5 rounded">
              Bloqueado: {lockoutRemaining}s
            </span>
          </div>
        )}

        {/* FORMULÁRIO DE LOGIN */}
        {authModalView === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-display font-bold uppercase tracking-wider text-gray-300">
                E-mail
              </label>
              <div className="relative flex items-center">
                <Mail className="absolute left-3.5 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  required
                  placeholder="seu.email@exemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-surface/70 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-brand-red focus:bg-surface transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-display font-bold uppercase tracking-wider text-gray-300">
                  Senha
                </label>
                <button
                  type="button"
                  onClick={() => setAuthModalView('forgot_password')}
                  className="text-[11px] font-sans text-brand-red hover:underline cursor-pointer"
                >
                  Esqueci minha senha
                </button>
              </div>
              <div className="relative flex items-center">
                <Lock className="absolute left-3.5 w-4 h-4 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-surface/70 border border-white/10 rounded-xl py-3 pl-10 pr-10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-brand-red focus:bg-surface transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 text-gray-400 hover:text-white p-1 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Checkbox Lembrar de Mim */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded bg-surface border-white/10 text-brand-red focus:ring-brand-red w-3.5 h-3.5 cursor-pointer"
              />
              <label htmlFor="rememberMe" className="text-xs text-gray-400 cursor-pointer select-none">
                Manter conectado neste dispositivo
              </label>
            </div>

            {/* Botão de Entrar */}
            <button
              type="submit"
              disabled={isLoading || lockoutRemaining > 0}
              className="w-full py-3.5 bg-brand-red hover:bg-brand-red-hover disabled:bg-gray-800 disabled:text-gray-500 text-white font-display font-black text-xs tracking-wider rounded-xl transition-all cursor-pointer active:scale-98 shadow-lg shadow-brand-red/25 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  ENTRANDO...
                </>
              ) : (
                'ENTRAR NA CONTA'
              )}
            </button>
          </form>
        )}

        {/* FORMULÁRIO DE CADASTRO */}
        {authModalView === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
            {/* Nome Completo */}
            <div className="space-y-1">
              <label className="text-xs font-display font-bold uppercase tracking-wider text-gray-300">
                Nome Completo
              </label>
              <div className="relative flex items-center">
                <User className="absolute left-3.5 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  required
                  placeholder="Seu nome"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-surface/70 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-brand-red transition-all"
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1">
              <label className="text-xs font-display font-bold uppercase tracking-wider text-gray-300">
                E-mail
              </label>
              <div className="relative flex items-center">
                <Mail className="absolute left-3.5 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  required
                  placeholder="seu.email@exemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-surface/70 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-brand-red transition-all"
                />
              </div>
            </div>

            {/* Seletor de Avatar */}
            <AvatarPicker
              selectedUrl={selectedAvatar}
              onSelect={(url) => setSelectedAvatar(url)}
            />

            {/* Senha */}
            <div className="space-y-1">
              <label className="text-xs font-display font-bold uppercase tracking-wider text-gray-300">
                Crie uma Senha Segura
              </label>
              <div className="relative flex items-center">
                <Lock className="absolute left-3.5 w-4 h-4 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Mínimo 8 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-surface/70 border border-white/10 rounded-xl py-2.5 pl-10 pr-10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-brand-red transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 text-gray-400 hover:text-white p-1 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Medidor de Força da Senha */}
              {password.length > 0 && (
                <PasswordStrengthMeter validation={passwordValidation} showRequirements={true} />
              )}
            </div>

            {/* Confirmar Senha */}
            <div className="space-y-1">
              <label className="text-xs font-display font-bold uppercase tracking-wider text-gray-300">
                Confirmar Senha
              </label>
              <div className="relative flex items-center">
                <KeyRound className="absolute left-3.5 w-4 h-4 text-gray-400" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  placeholder="Repita sua senha"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-surface/70 border border-white/10 rounded-xl py-2.5 pl-10 pr-10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-brand-red transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 text-gray-400 hover:text-white p-1 cursor-pointer"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {confirmPassword.length > 0 && !passwordsMatch && (
                <p className="text-[11px] text-red-400">As senhas não coincidem.</p>
              )}
            </div>

            {/* Botão de Cadastrar */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-brand-red hover:bg-brand-red-hover disabled:bg-gray-800 disabled:text-gray-500 text-white font-display font-black text-xs tracking-wider rounded-xl transition-all cursor-pointer active:scale-98 shadow-lg shadow-brand-red/25 flex items-center justify-center gap-2 mt-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  CRIANDO CONTA...
                </>
              ) : (
                'CRIAR MINHA CONTA'
              )}
            </button>
          </form>
        )}

        {/* FORMULÁRIO DE RECUPERAÇÃO DE SENHA */}
        {authModalView === 'forgot_password' && (
          <form onSubmit={handleForgotSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-display font-bold uppercase tracking-wider text-gray-300">
                E-mail Cadastrado
              </label>
              <div className="relative flex items-center">
                <Mail className="absolute left-3.5 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  required
                  placeholder="seu.email@exemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-surface/70 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-brand-red transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-brand-red hover:bg-brand-red-hover disabled:bg-gray-800 text-white font-display font-black text-xs tracking-wider rounded-xl transition-all cursor-pointer active:scale-98 shadow-lg shadow-brand-red/25 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  ENVIANDO...
                </>
              ) : (
                'ENVIAR LINK DE REDEFINIÇÃO'
              )}
            </button>

            <button
              type="button"
              onClick={() => setAuthModalView('login')}
              className="w-full flex items-center justify-center gap-1.5 text-xs text-gray-400 hover:text-white pt-2 cursor-pointer transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Voltar ao Login
            </button>
          </form>
        )}

        {/* Divisor OU */}
        {authModalView !== 'forgot_password' && (
          <div className="relative flex py-4 items-center">
            <div className="flex-grow border-t border-white/10"></div>
            <span className="flex-shrink mx-4 text-[11px] font-mono text-gray-500 uppercase tracking-widest">
              ou
            </span>
            <div className="flex-grow border-t border-white/10"></div>
          </div>
        )}

        {/* Botão Oficial do Google OAuth */}
        {authModalView !== 'forgot_password' && (
          <button
            type="button"
            onClick={handleGoogleClick}
            disabled={isLoading}
            className="w-full py-3 px-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl text-xs font-display font-bold text-white transition-all cursor-pointer active:scale-98 flex items-center justify-center gap-3"
          >
            {/* Ícone Oficial do Google em SVG */}
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#EA4335"
                d="M12 5c1.54 0 2.93.56 4.02 1.48l3.01-3.01C17.21 1.8 14.77 1 12 1 7.54 1 3.73 3.53 1.85 7.24l3.66 2.84C6.39 7.37 8.97 5 12 5z"
              />
              <path
                fill="#4285F4"
                d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58l3.71 2.88c2.16-1.99 3.71-4.92 3.71-8.7z"
              />
              <path
                fill="#FBBC05"
                d="M5.51 14.08c-.24-.71-.38-1.47-.38-2.27s.14-1.56.38-2.27L1.85 6.7C.67 9.04 0 10.95 0 12s.67 2.96 1.85 5.3l3.66-3.22z"
              />
              <path
                fill="#34A853"
                d="M12 23c3.24 0 5.95-1.08 7.93-2.91l-3.71-2.88c-1.07.72-2.45 1.16-4.22 1.16-3.03 0-5.61-2.37-6.49-5.08L1.85 16.5C3.73 20.21 7.54 23 12 23z"
              />
            </svg>
            <span>Continuar com Google</span>
          </button>
        )}

        {/* Rodapé de Segurança e Criptografia */}
        <div className="pt-5 mt-2 border-t border-white/5 flex flex-col items-center justify-center gap-2 text-[10px] text-gray-500 font-sans text-center">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Protegido por Criptografia SSL 256-bit & Auth Firebase</span>
          </div>
          <p>
            Ao continuar, você concorda com nossa{' '}
            <a href="/politica-de-privacidade" className="text-brand-red hover:text-white transition-colors">
              Política de Privacidade
            </a>
            .
          </p>
        </div>
      </motion.div>
    </div>
  );
}
