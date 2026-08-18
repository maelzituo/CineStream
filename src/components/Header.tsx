/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Search, Film, Tv, ListCollapse, Play, Sparkles, User as UserIcon, LogIn, Download } from 'lucide-react';
import { Tab } from '../types';
import { useAuth } from '../context/AuthContext';
import { pwaManager } from '../lib/pwa';
import { handleImageError, DEFAULT_AVATAR_FALLBACK } from '../lib/imageFallback';

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
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

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

  // Se não estiver na aba de início, o header sempre usa fundo sólido/vidro fosco para não colidir com o conteúdo
  const isSolidHeader = isScrolled || currentTab !== 'inicio';

  return (
    <header
      id="main-header"
      className="fixed top-0 left-0 right-0 w-full z-40 transition-all duration-300 flex justify-between items-center px-4 sm:px-8 md:px-12 h-16 md:h-18 bg-[#0F0F0F]/95 backdrop-blur-xl shadow-2xl border-b border-white/10"
    >
      {/* Brand Logo */}
      <div
        className="flex items-center gap-2.5 cursor-pointer group select-none"
        onClick={() => setCurrentTab('inicio')}
        id="header-brand-logo"
      >
        <div className="relative flex h-7 w-7 items-center justify-center rounded-xl bg-brand-red/10 border border-brand-red/30 group-hover:bg-brand-red/20 transition-all shadow-md shadow-brand-red/20">
          <Play className="text-brand-red fill-brand-red w-3.5 h-3.5 ml-0.5 transition-transform group-hover:scale-110" />
        </div>
        <span className="font-display font-black text-xl md:text-2xl tracking-tighter text-white group-hover:text-brand-red transition-colors">
          CINE<span className="text-brand-red">STREAM</span>
        </span>
      </div>

      {/* Desktop Navigation Links */}
      <nav className="hidden md:flex gap-1 lg:gap-2 items-center font-display font-bold text-xs tracking-wider">
        <button
          onClick={() => setCurrentTab('inicio')}
          className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
            currentTab === 'inicio'
              ? 'bg-brand-red/15 text-white border border-brand-red/30 font-black'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
          id="nav-tab-inicio"
        >
          INÍCIO
        </button>
        <button
          onClick={() => setCurrentTab('busca')}
          className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
            currentTab === 'busca'
              ? 'bg-brand-red/15 text-white border border-brand-red/30 font-black'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
          id="nav-tab-busca"
        >
          BUSCA
        </button>
        <button
          onClick={() => setCurrentTab('lista')}
          className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
            currentTab === 'lista'
              ? 'bg-brand-red/15 text-white border border-brand-red/30 font-black'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
          id="nav-tab-lista"
        >
          MINHA LISTA
        </button>
        <button
          onClick={() => setCurrentTab('perfil')}
          className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
            currentTab === 'perfil'
              ? 'bg-brand-red/15 text-white border border-brand-red/30 font-black'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
          id="nav-tab-perfil"
        >
          PERFIL
        </button>
      </nav>

      {/* Header Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* PWA Direct Install Button for Desktop / Mobile */}
        {canInstall && (
          <button
            onClick={handleInstallPWA}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white border border-white/10 text-xs font-semibold tracking-wider uppercase transition-all active:scale-95 cursor-pointer shadow-sm"
            title="Instalar CineStream no seu dispositivo"
            id="header-install-pwa-btn"
          >
            <Download className="w-3.5 h-3.5 text-brand-red" />
            <span className="hidden lg:inline">Instalar App</span>
          </button>
        )}

        {/* Search Trigger */}
        <button
          onClick={onSearchClick}
          className={`p-2 rounded-xl border transition-all cursor-pointer ${
            currentTab === 'busca'
              ? 'bg-brand-red text-white border-brand-red shadow-md shadow-brand-red/25'
              : 'bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border-white/10'
          }`}
          aria-label="Buscar"
          id="header-search-btn"
        >
          <Search className="w-4.5 h-4.5" />
        </button>

        {/* User Auth or Profile Button */}
        {user ? (
          <button
            onClick={onProfileClick}
            className={`flex items-center gap-2 p-0.5 rounded-full border-2 transition-all cursor-pointer focus:outline-none relative group ${
              currentTab === 'perfil' ? 'border-brand-red shadow-md shadow-brand-red/30' : 'border-white/20 hover:border-brand-red'
            }`}
            title={user.name || 'Meu Perfil'}
            id="header-profile-btn"
          >
            <div className="w-8 h-8 rounded-full overflow-hidden relative bg-surface-container">
              <img
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover transition-transform group-hover:scale-110"
                alt={user.name || 'Avatar'}
                src={user.photoURL || DEFAULT_AVATAR_FALLBACK}
                onError={(e) => handleImageError(e, 'avatar')}
              />
            </div>
          </button>
        ) : (
          <button
            onClick={() => openAuthModal('login')}
            className="px-3.5 py-1.5 sm:px-4 sm:py-2 bg-brand-red hover:bg-brand-red-hover text-white text-xs font-display font-black tracking-wider uppercase rounded-xl transition-all cursor-pointer active:scale-95 shadow-md shadow-brand-red/25 flex items-center gap-1.5"
            id="header-login-btn"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Entrar</span>
          </button>
        )}
      </div>
    </header>
  );
}
