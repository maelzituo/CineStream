/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  RefreshCw, 
  Film, 
  Maximize, 
  Minimize, 
  RotateCw, 
  AlertCircle,
  Play
} from 'lucide-react';
import { Movie } from '../types';
import EmbedService from '../services/embedService';

interface MoviePlayerProps {
  movie: Movie;
  onClose: () => void;
  onProgressUpdate?: (progress: number, seconds: number) => void;
}

/**
 * Componente MoviePlayer - Responsável por reproduzir filmes via iframe EmbedMovies.
 */
export default function MoviePlayer({ movie, onClose, onProgressUpdate }: MoviePlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLandscape, setIsLandscape] = useState(false);

  // Verifica se o filme possui um link de vídeo direto (ex: Google Drive)
  const isDirectVideo = !!movie.videoUrl;

  // Verifica se o filme possui um TMDb ID válido
  const tmdbId = movie.tmdbId;
  const isValidId = EmbedService.isValidTmdbId(tmdbId);
  
  const [selectedProviderIndex, setSelectedProviderIndex] = useState(0);
  const currentProvider = EmbedService.PROVIDERS[selectedProviderIndex];
  const playerUrl = isValidId ? currentProvider.getMovieUrl(tmdbId!) : null;

  // Gerencia o timeout do carregamento do player
  useEffect(() => {
    if (!isValidId && !isDirectVideo) {
      setIsLoading(false);
      return;
    }

    if (isDirectVideo) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setHasError(false);

    // Timeout de segurança de 15 segundos caso o iframe não dispare onLoad
    const timer = setTimeout(() => {
      setIsLoading((loading) => {
        if (loading) {
          setHasError(true);
          return false;
        }
        return false;
      });
    }, 15000);

    return () => clearTimeout(timer);
  }, [movie.id, retryCount, isValidId]);

  // Listener para sair do modo tela cheia ao fechar
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      // Garante saída do modo tela cheia ao desmontar o componente
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    };
  }, []);

  // Recarrega o iframe para tentar novamente
  const handleRetry = () => {
    setHasError(false);
    setIsLoading(true);
    setRetryCount((prev) => prev + 1);
  };

  // Alterna o estado de Tela Cheia
  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (e) {
      console.error('Erro ao alternar tela cheia:', e);
    }
  };

  // Alterna a rotação da tela no mobile / simulado
  const toggleOrientation = () => {
    setIsLandscape((prev) => !prev);
  };

  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  const handleIframeError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  return (
    <div
      ref={containerRef}
      className={`fixed inset-0 z-50 bg-black flex flex-col items-center justify-center overflow-hidden select-none transition-transform duration-300 ${
        isLandscape ? 'rotate-90 md:rotate-0 w-full h-full' : 'w-full h-full'
      }`}
    >
      {/* Barra de Controle Superior (Header do Player) */}
      <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between p-4 md:p-6 bg-gradient-to-b from-black/90 via-black/50 to-transparent pointer-events-auto">
        <div className="flex items-center gap-3">
          <span className="px-2.5 py-1 text-[10px] font-display font-black tracking-widest text-brand-red bg-brand-red/15 border border-brand-red/30 rounded">
            FILME EMBED
          </span>
          <h2 className="text-white font-display font-bold text-sm md:text-base truncate max-w-[200px] sm:max-w-md">
            {movie.title}
          </h2>
        </div>

        {/* Botões de Ação do Player */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* Seletor de Servidor */}
          {isValidId && !isDirectVideo && (
            <select
              value={selectedProviderIndex}
              onChange={(e) => setSelectedProviderIndex(Number(e.target.value))}
              className="bg-black/60 border border-white/20 text-white text-xs rounded-lg px-2 py-2 md:px-3 focus:outline-none focus:border-brand-red cursor-pointer"
            >
              {EmbedService.PROVIDERS.map((provider, index) => (
                <option key={provider.id} value={index}>
                  {provider.name}
                </option>
              ))}
            </select>
          )}

          {/* Rotação / Orientação */}
          <button
            onClick={toggleOrientation}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 text-white flex items-center justify-center transition-all cursor-pointer"
            title="Girar Tela (Horizontal / Retrato)"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          {/* Tela Cheia */}
          <button
            onClick={toggleFullscreen}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 text-white flex items-center justify-center transition-all cursor-pointer"
            title={isFullscreen ? 'Sair de Tela Cheia' : 'Tela Cheia'}
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>

          {/* Fechar Player */}
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-brand-red/80 hover:bg-brand-red text-white flex items-center justify-center transition-all cursor-pointer shadow-lg shadow-brand-red/30"
            title="Fechar Player"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* ÁREA PRINCIPAL DO PLAYER */}
      <div className="relative w-full h-full flex items-center justify-center bg-black">
        {/* Caso não possua TMDb ID nem vídeo direto */}
        {!isValidId && !isDirectVideo && (
          <div className="text-center px-6 py-12 max-w-md glass-panel rounded-2xl border border-white/10 space-y-4 m-4">
            <div className="w-16 h-16 rounded-full bg-amber-500/15 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/30">
              <Film className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h3 className="text-white font-display font-black text-lg">Vídeo Indisponível</h3>
              <p className="text-gray-400 text-xs font-sans leading-relaxed">
                Este título ainda não possui um ID do TMDb cadastrado nem link direto para reprodução.
              </p>
            </div>
            <button
              onClick={onClose}
              className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-display font-bold text-xs tracking-wider transition-all cursor-pointer"
            >
              VOLTAR
            </button>
          </div>
        )}

        {/* Player HTML5 (Google Drive, Sem Anúncios) */}
        {isDirectVideo && (
          <video
            autoPlay
            controls
            playsInline
            src={movie.videoUrl}
            className="w-full h-full object-contain bg-black"
            onTimeUpdate={(e) => {
              const target = e.target as HTMLVideoElement;
              if (onProgressUpdate && target.duration) {
                const percent = Math.round((target.currentTime / target.duration) * 100);
                // Throttle updates? The App layer can throttle or we can just send it.
                // We'll just send it, let the hook or user throttle if needed.
                onProgressUpdate(percent, Math.round(target.currentTime));
              }
            }}
          />
        )}

        {/* Caso ocorra erro no carregamento do player iframe */}
        {isValidId && !isDirectVideo && hasError && (
          <div className="text-center px-6 py-12 max-w-md glass-panel rounded-2xl border border-red-500/20 space-y-5 m-4 z-20">
            <div className="w-16 h-16 rounded-full bg-brand-red/15 text-brand-red flex items-center justify-center mx-auto border border-brand-red/30">
              <AlertCircle className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h3 className="text-white font-display font-black text-lg">Erro ao Carregar Player</h3>
              <p className="text-gray-400 text-xs font-sans leading-relaxed">
                Não foi possível conectar ao servidor da EmbedMovies para exibir o filme. Verifique sua conexão.
              </p>
            </div>
            <div className="flex gap-3 justify-center pt-2">
              <button
                onClick={handleRetry}
                className="px-6 py-3 bg-brand-red hover:bg-brand-red-hover text-white rounded-xl font-display font-bold text-xs tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-brand-red/25"
              >
                <RefreshCw className="w-4 h-4" />
                TENTAR NOVAMENTE
              </button>
              <button
                onClick={onClose}
                className="px-5 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-display font-bold text-xs tracking-wider transition-all cursor-pointer"
              >
                FECHAR
              </button>
            </div>
          </div>
        )}

        {/* Animação de Carregamento (Loading State) */}
        <AnimatePresence>
          {isValidId && !isDirectVideo && isLoading && !hasError && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/90 space-y-4"
            >
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 rounded-full border-4 border-brand-red/20" />
                <div className="absolute inset-0 rounded-full border-4 border-brand-red border-t-transparent animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Play className="w-6 h-6 text-brand-red fill-brand-red ml-0.5 animate-pulse" />
                </div>
              </div>
              <div className="text-center space-y-1">
                <p className="text-white font-display font-extrabold text-sm tracking-wider uppercase">
                  Carregando Player Embed
                </p>
                <p className="text-xs text-gray-400 font-mono">
                  {currentProvider?.name || 'Servidor Externo'} ({tmdbId})
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Iframe Embed Player */}
        {isValidId && !isDirectVideo && !hasError && (
          <iframe
            ref={iframeRef}
            key={`${movie.id}-${retryCount}`}
            src={playerUrl!}
            title={`Embed Player - ${movie.title}`}
            className="w-full h-full border-0"
            allow="autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            allowFullScreen
            onLoad={handleIframeLoad}
            onError={handleIframeError}
          />
        )}
      </div>
    </div>
  );
}
