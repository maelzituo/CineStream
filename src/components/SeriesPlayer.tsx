/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  RefreshCw, 
  Tv, 
  Maximize, 
  Minimize, 
  RotateCw, 
  AlertCircle,
  Play,
  ChevronDown
} from 'lucide-react';
import { Movie } from '../types';
import EmbedService from '../services/embedService';

interface SeriesPlayerProps {
  movie: Movie;
  onClose: () => void;
  onProgressUpdate?: (progress: number, seconds: number) => void;
}

/**
 * Componente SeriesPlayer - Responsável por reproduzir episódios de séries via iframe EmbedMovies.
 */
export default function SeriesPlayer({ movie, onClose, onProgressUpdate }: SeriesPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Estados de Temporada e Episódio selecionados
  const [currentSeason, setCurrentSeason] = useState(1);
  const [currentEpisode, setCurrentEpisode] = useState(1);

  // Estados de carregamento e erro
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLandscape, setIsLandscape] = useState(false);

  // Totais de temporadas e episódios
  const totalSeasons = movie.seasonsCount || 3;
  const totalEpisodes = movie.episodesPerSeason || 10;

  // Validação do TMDb ID da série
  const tmdbId = movie.tmdbId;
  const isValidId = EmbedService.isValidTmdbId(tmdbId);
  
  const [selectedProviderIndex, setSelectedProviderIndex] = useState(0);
  const currentProvider = EmbedService.PROVIDERS[selectedProviderIndex];

  const playerUrl = isValidId
    ? currentProvider.getSeriesUrl(tmdbId!, currentSeason, currentEpisode)
    : null;

  // Recarrega o player quando a temporada ou episódio altera
  useEffect(() => {
    if (!isValidId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setHasError(false);

    // Timeout de segurança de 15 segundos
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
  }, [movie.id, currentSeason, currentEpisode, retryCount, isValidId]);

  // Listener para evento de tela cheia
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    };
  }, []);

  const handleRetry = () => {
    setHasError(false);
    setIsLoading(true);
    setRetryCount((prev) => prev + 1);
  };

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
      {/* Barra de Controle Superior */}
      <div className="absolute top-0 left-0 right-0 z-30 flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 md:p-6 bg-gradient-to-b from-black/95 via-black/70 to-transparent pointer-events-auto gap-3">
        <div className="flex items-center gap-3">
          <span className="px-2.5 py-1 text-[10px] font-display font-black tracking-widest text-brand-red bg-brand-red/15 border border-brand-red/30 rounded">
            SÉRIE EMBED
          </span>
          <div>
            <h2 className="text-white font-display font-bold text-sm md:text-base truncate max-w-[180px] sm:max-w-md">
              {movie.title}
            </h2>
            <p className="text-[11px] text-gray-400 font-sans">
              T{currentSeason}:E{currentEpisode} • Temporada {currentSeason}, Episódio {currentEpisode}
            </p>
          </div>
        </div>

        {/* Seletores de Temporada e Episódio + Ações */}
        <div className="flex flex-wrap items-center gap-2 md:gap-3 w-full sm:w-auto justify-between sm:justify-end">
          {/* Seletor de Servidor */}
          {isValidId && (
            <div className="flex flex-col items-end gap-1">
              <div className="relative">
                <select
                  value={selectedProviderIndex}
                  onChange={(e) => setSelectedProviderIndex(Number(e.target.value))}
                  className="appearance-none bg-black/60 border border-white/20 text-white text-xs rounded-lg pl-3 pr-8 py-2 md:py-2.5 focus:outline-none focus:border-brand-red cursor-pointer"
                >
                  {EmbedService.PROVIDERS.map((provider, index) => (
                    <option key={provider.id} value={index}>
                      {provider.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
              <span className="text-[10px] text-gray-300 font-sans hidden md:block bg-black/60 px-2 py-1 rounded border border-white/10">
                Sem áudio PT-BR? Tente outro servidor no menu acima.
              </span>
            </div>
          )}

          {/* Seletor de Temporadas */}
          <div className="relative">
            <select
              value={currentSeason}
              onChange={(e) => {
                setCurrentSeason(Number(e.target.value));
                setCurrentEpisode(1); // Reseta para o episódio 1 ao mudar de temporada
              }}
              className="bg-white/10 hover:bg-white/15 border border-white/20 text-white font-sans text-xs font-semibold py-2 pl-3 pr-8 rounded-lg outline-none cursor-pointer appearance-none transition-all"
            >
              {Array.from({ length: totalSeasons }, (_, i) => i + 1).map((s) => (
                <option key={s} value={s} className="bg-[#1A1A1A] text-white">
                  Temp. {s}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Seletor de Episódios */}
          <div className="relative">
            <select
              value={currentEpisode}
              onChange={(e) => setCurrentEpisode(Number(e.target.value))}
              className="bg-white/10 hover:bg-white/15 border border-white/20 text-white font-sans text-xs font-semibold py-2 pl-3 pr-8 rounded-lg outline-none cursor-pointer appearance-none transition-all"
            >
              {Array.from({ length: totalEpisodes }, (_, i) => i + 1).map((ep) => (
                <option key={ep} value={ep} className="bg-[#1A1A1A] text-white">
                  Epi. {ep}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Rotação / Orientação */}
          <button
            onClick={toggleOrientation}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 text-white flex items-center justify-center transition-all cursor-pointer"
            title="Girar Tela (Horizontal / Retrato)"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          {/* Tela Cheia */}
          <button
            onClick={toggleFullscreen}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 text-white flex items-center justify-center transition-all cursor-pointer"
            title={isFullscreen ? 'Sair de Tela Cheia' : 'Tela Cheia'}
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>

          {/* Fechar Player */}
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-brand-red/80 hover:bg-brand-red text-white flex items-center justify-center transition-all cursor-pointer shadow-lg shadow-brand-red/30"
            title="Fechar Player"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* ÁREA PRINCIPAL DO PLAYER DE SÉRIES */}
      <div className="relative w-full h-full flex items-center justify-center bg-black">
        {/* Caso não possua TMDb ID válido */}
        {!isValidId && (
          <div className="text-center px-6 py-12 max-w-md glass-panel rounded-2xl border border-white/10 space-y-4 m-4">
            <div className="w-16 h-16 rounded-full bg-amber-500/15 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/30">
              <Tv className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h3 className="text-white font-display font-black text-lg">Série Indisponível</h3>
              <p className="text-gray-400 text-xs font-sans leading-relaxed">
                Esta série ainda não possui um ID do TMDb cadastrado para carregar o player da EmbedMovies.
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

        {/* Caso ocorra erro no carregamento do episódio */}
        {isValidId && hasError && (
          <div className="text-center px-6 py-12 max-w-md glass-panel rounded-2xl border border-red-500/20 space-y-5 m-4 z-20">
            <div className="w-16 h-16 rounded-full bg-brand-red/15 text-brand-red flex items-center justify-center mx-auto border border-brand-red/30">
              <AlertCircle className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h3 className="text-white font-display font-black text-lg">Erro ao Carregar Episódio</h3>
              <p className="text-gray-400 text-xs font-sans leading-relaxed">
                Não foi possível carregar a Temporada {currentSeason}, Episódio {currentEpisode} da EmbedMovies.
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
          {isValidId && isLoading && !hasError && (
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
                  Carregando Temp {currentSeason} • Epi {currentEpisode}
                </p>
                <p className="text-xs text-gray-400 font-mono">
                  {currentProvider?.name || 'Servidor Externo'} ({tmdbId})
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Iframe Embed Player para Séries */}
        {isValidId && !hasError && (
          <iframe
            ref={iframeRef}
            key={`${movie.id}-s${currentSeason}-e${currentEpisode}-${retryCount}`}
            src={playerUrl!}
            title={`Embed Player - ${movie.title} T${currentSeason}:E${currentEpisode}`}
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
