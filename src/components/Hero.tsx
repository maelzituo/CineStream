/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { motion } from 'motion/react';
import { Play, Info, ThumbsUp, Sparkles, Plus, Check } from 'lucide-react';
import { Movie } from '../types';
import { handleImageError, DEFAULT_BACKDROP_FALLBACK } from '../lib/imageFallback';

interface HeroProps {
  movie: Movie;
  onPlayClick: (movie: Movie) => void;
  onInfoClick: (movie: Movie) => void;
  onSavedToggle?: (movie: Movie) => void;
  isSaved?: boolean;
}

export default function Hero({ movie, onPlayClick, onInfoClick, onSavedToggle, isSaved }: HeroProps) {
  const [backdropSrc, setBackdropSrc] = useState(
    movie.backdropUrl || movie.imageUrl || DEFAULT_BACKDROP_FALLBACK
  );

  return (
    <section className="relative w-full min-h-[600px] sm:min-h-[660px] md:min-h-[720px] h-[82vh] md:h-[88vh] overflow-hidden flex items-end pt-24 pb-14 sm:pb-16 md:pb-20">
      {/* Background Poster / Backdrop with Smooth Cinematic Parallax / Zoom */}
      <div className="absolute inset-0 z-0 overflow-hidden bg-brand-bg">
        {/* Top Header Protection Gradient */}
        <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-[#0F0F0F] via-[#0F0F0F]/80 to-transparent z-10 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-bg via-brand-bg/50 to-transparent z-10" />
        <div className="absolute inset-0 bg-gradient-to-r from-brand-bg via-brand-bg/70 to-transparent z-10" />
        
        {/* Animated background image with error fallback */}
        <motion.img
          key={movie.id}
          initial={{ scale: 1.08, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          referrerPolicy="no-referrer"
          src={backdropSrc}
          alt={movie.title}
          onError={(e) => {
            handleImageError(e, 'backdrop');
            setBackdropSrc(DEFAULT_BACKDROP_FALLBACK);
          }}
          className="w-full h-full object-cover object-center transform filter brightness-90 contrast-105"
        />
      </div>

      {/* Hero Content Panel */}
      <div className="relative z-20 px-6 sm:px-10 md:px-16 max-w-4xl select-none">
        <motion.div
          key={`content-${movie.id}`}
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="space-y-3.5 sm:space-y-4"
        >
          {/* Tagline */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center px-2.5 py-1 bg-brand-red text-white text-[10px] font-display font-black rounded tracking-[0.2em] shadow-md shadow-brand-red/30">
              ORIGINAL CINESTREAM
            </span>
            <span className="text-yellow-400 flex items-center gap-1 font-display font-extrabold text-xs bg-black/50 backdrop-blur-sm px-2.5 py-1 rounded border border-yellow-500/20">
              <Sparkles className="w-3 h-3 fill-yellow-400 text-yellow-400" /> RECOMENDADO
            </span>
          </div>

          {/* Title */}
          <h1 className="font-display font-black text-2xl sm:text-4xl md:text-5xl lg:text-6xl text-white uppercase tracking-tight drop-shadow-2xl leading-tight">
            {movie.title}
          </h1>

          {/* Metadata Block */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 text-xs md:text-sm font-sans font-medium text-gray-300">
            <span className="text-emerald-400 font-bold flex items-center gap-1 bg-emerald-950/50 px-2.5 py-1 rounded border border-emerald-500/30">
              <ThumbsUp className="w-3.5 h-3.5 fill-emerald-400/20" />
              98% Relevante
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
            <span className="text-gray-200 font-bold">{movie.year}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
            <span className="border border-white/30 px-2 py-0.5 rounded text-[10px] tracking-wide font-extrabold text-white bg-black/40">
              {movie.ageRating}
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
            <span className="text-gray-200 font-semibold">{movie.duration}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
            <span className="text-gray-300 truncate max-w-[200px] sm:max-w-none">{movie.genres.join(', ')}</span>
          </div>

          {/* Plot Paragraph */}
          <p className="text-gray-200 text-xs sm:text-sm md:text-base leading-relaxed line-clamp-2 sm:line-clamp-3 max-w-2xl opacity-95 drop-shadow">
            {movie.description}
          </p>

          {/* Action Callouts */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => onPlayClick(movie)}
              className="bg-brand-red hover:bg-brand-red-hover text-white px-7 sm:px-8 py-3.5 rounded-xl flex items-center justify-center gap-2.5 font-display font-black text-xs sm:text-sm tracking-wider cursor-pointer active:scale-95 hover:scale-[1.02] transition-all duration-300 shadow-xl shadow-brand-red/30 border border-red-500/40"
              id="hero-play-button"
            >
              <Play className="w-4 h-4 sm:w-4.5 sm:h-4.5 fill-white" />
              <span>ASSISTIR AGORA</span>
            </button>
            
            <button
              onClick={() => onInfoClick(movie)}
              className="bg-black/50 hover:bg-white/20 border border-white/20 text-white px-6 sm:px-8 py-3.5 rounded-xl flex items-center justify-center gap-2.5 font-display font-extrabold text-xs sm:text-sm tracking-wider cursor-pointer active:scale-95 hover:scale-[1.02] transition-all duration-300 backdrop-blur-md shadow-lg"
              id="hero-info-button"
            >
              <Info className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-gray-200" />
              <span>MAIS DETALHES</span>
            </button>

            {onSavedToggle && (
              <button
                onClick={() => onSavedToggle(movie)}
                className={`p-3.5 rounded-xl flex items-center justify-center border transition-all duration-300 cursor-pointer active:scale-95 backdrop-blur-md shadow-lg ${
                  isSaved
                    ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                    : 'bg-black/50 hover:bg-white/20 border-white/20 text-gray-200 hover:text-white'
                }`}
                title={isSaved ? 'Remover da minha lista' : 'Adicionar à minha lista'}
                id="hero-save-button"
              >
                {isSaved ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <Plus className="w-5 h-5" />
                )}
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
