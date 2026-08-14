/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Search, Film, Tv, ListCollapse, Play, Sparkles, User as UserIcon, LogIn, Download } from 'lucide-react';
import { Tab } from '../types';
import { useAuth } from '../context/AuthContext';
import { pwaManager } from '../lib/pwa';

interface HeaderProps {
  currentTab: Tab;
  setCurrentTab: (tab: Tab) => void;
  onSearchClick: () => void;
  onProfileClick: () => void;
}

export default function Header({
  currentTab,
  setCurrentTab,
  onSearchClick,
  onProfileClick,
}: HeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [canInstall, setCanInstall] = useState(false);
  const { user, openAuthModal } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 40) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    const cleanupPWA = pwaManager.onInstallChange((installable) => {
      setCanInstall(installable);
    });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      cleanupPWA();
    };
  }, []);

  const handleInstallPWA = async () => {
    await pwaManager.promptInstall();
  };

  return (
    <header
      id="main-header"
      className={`fixed top-0 w-full z-50 transition-all duration-500 flex justify-between items-center px-6 md:px-16 h-16 ${
        isScrolled
          ? 'bg-brand-bg/95 backdrop-blur-md shadow-lg border-b border-white/5'
          : 'bg-gradient-to-b from-brand-bg/90 to-transparent'
      }`}
    >
      {/* Brand Logo */}
      <div
        className="flex items-center gap-2 cursor-pointer group"
        onClick={() => setCurrentTab('inicio')}
      >
        <span className="relative flex h-5 w-5 items-center justify-center">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-red opacity-30"></span>
          <Play className="text-brand-red fill-brand-red w-5 h-5 relative z-10 transition-transform group-hover:scale-110" />
        </span>
        <span className="font-display font-black text-2xl tracking-tighter text-brand-red select-none">
          CINESTREAM
        </span>
      </div>

      {/* Desktop Navigation Links */}
      <nav className="hidden md:flex gap-8 items-center font-display font-semibold text-xs tracking-widest text-on-surface-variant">
        <button
          onClick={() => setCurrentTab('inicio')}
          className={`hover:text-brand-red transition-all cursor-pointer ${
            currentTab === 'inicio' ? 'text-brand-red relative' : 'text-gray-400'
          }`}
        >
          INÍCIO
          {currentTab === 'inicio' && (
            <span className="absolute -bottom-1.5 left-0 right-0 h-0.5 bg-brand-red rounded-full" />
          )}
        </button>
        <button
          onClick={() => setCurrentTab('busca')}
          className={`hover:text-brand-red transition-all cursor-pointer ${
            currentTab === 'busca' ? 'text-brand-red relative' : 'text-gray-400'
          }`}
        >
          BUSCA
          {currentTab === 'busca' && (
            <span className="absolute -bottom-1.5 left-0 right-0 h-0.5 bg-brand-red rounded-full" />
          )}
        </button>
        <button
          onClick={() => setCurrentTab('lista')}
          className={`hover:text-brand-red transition-all cursor-pointer ${
            currentTab === 'lista' ? 'text-brand-red relative' : 'text-gray-400'
          }`}
        >
          MINHA LISTA
          {currentTab === 'lista' && (
            <span className="absolute -bottom-1.5 left-0 right-0 h-0.5 bg-brand-red rounded-full" />
          )}
        </button>
        <button
          onClick={() => setCurrentTab('perfil')}
          className={`hover:text-brand-red transition-all cursor-pointer ${
            currentTab === 'perfil' ? 'text-brand-red relative' : 'text-gray-400'
          }`}
        >
          PERFIL
          {currentTab === 'perfil' && (
            <span className="absolute -bottom-1.5 left-0 right-0 h-0.5 bg-brand-red rounded-full" />
          )}
        </button>
      </nav>

      {/* Header Actions */}
      <div className="flex items-center gap-3">
        {/* PWA Direct Install Button for Desktop / Mobile */}
        {canInstall && (
          <button
            onClick={handleInstallPWA}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white border border-white/10 text-xs font-semibold tracking-wider uppercase transition-all active:scale-95 cursor-pointer shadow-sm"
            title="Instalar CineStream no seu dispositivo"
            id="header-install-pwa-btn"
          >
            <Download className="w-3.5 h-3.5 text-brand-red" />
            <span>Instalar App</span>
          </button>
        )}

        {/* Search Trigger */}
        <button
          onClick={onSearchClick}
          className="p-2 rounded-full hover:bg-white/10 active:scale-95 transition-all text-gray-300 hover:text-white cursor-pointer"
          aria-label="Buscar"
        >
          <Search className="w-5 h-5" />
        </button>

        {/* User Auth or Profile Button */}
        {user ? (
          <button
            onClick={onProfileClick}
            className="flex items-center gap-2 p-0.5 rounded-full border border-white/20 hover:border-brand-red active:scale-95 transition-all cursor-pointer focus:outline-none relative group"
            title={user.displayName || 'Meu Perfil'}
          >
            <div className="w-8 h-8 rounded-full overflow-hidden relative">
              <img
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover transition-transform group-hover:scale-110"
                alt={user.displayName || 'Avatar'}
                src={user.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=185&auto=format&fit=crop&q=80'}
              />
            </div>
          </button>
        ) : (
          <button
            onClick={() => openAuthModal('login')}
            className="px-4 py-2 bg-brand-red hover:bg-brand-red-hover text-white text-xs font-display font-black tracking-wider uppercase rounded-xl transition-all cursor-pointer active:scale-95 shadow-md shadow-brand-red/25 flex items-center gap-1.5"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Entrar</span>
          </button>
        )}
      </div>
    </header>
  );
}
