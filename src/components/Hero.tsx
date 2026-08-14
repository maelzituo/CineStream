/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import { Play, Info, ThumbsUp, Sparkles } from 'lucide-react';
import { Movie } from '../types';

interface HeroProps {
  movie: Movie;
  onPlayClick: (movie: Movie) => void;
  onInfoClick: (movie: Movie) => void;
}

export default function Hero({ movie, onPlayClick, onInfoClick }: HeroProps) {
  return (
    <section className="relative w-full h-[70vh] md:h-[85vh] overflow-hidden flex items-end">
      {/* Background Poster / Backdrop with Smooth Cinematic Parallax / Zoom */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-t from-brand-bg via-brand-bg/10 to-transparent z-10" />
        <div className="absolute inset-0 bg-gradient-to-r from-brand-bg via-transparent to-transparent z-10" />
        
        {/* Animated background image */}
        <motion.div
          initial={{ scale: 1 }}
          animate={{ scale: 1.05 }}
          transition={{
            duration: 15,
            ease: 'easeInOut',
            repeat: Infinity,
            repeatType: 'reverse',
          }}
          className="w-full h-full bg-cover bg-center"
          style={{
            backgroundImage: `url('${movie.backdropUrl}')`,
          }}
        />
      </div>

      {/* Hero Content Panel */}
      <div className="relative z-20 px-6 md:px-16 pb-16 md:pb-20 max-w-4xl select-none">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="space-y-4"
        >
          {/* Tagline */}
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-3 py-1 bg-brand-red text-white text-[10px] font-display font-black rounded-sm tracking-[0.2em]">
              ORIGINAL CINESTREAM
            </span>
            <span className="text-yellow-500 flex items-center gap-1 font-display font-bold text-xs">
              <Sparkles className="w-3 h-3 fill-yellow-500" /> RECOMENDADO
            </span>
          </div>

          {/* Title */}
          <h1 className="font-display font-black text-4xl md:text-6xl text-white uppercase tracking-tighter drop-shadow-2xl">
            {movie.title}
          </h1>

          {/* Metadata Block */}
          <div className="flex flex-wrap items-center gap-3 text-xs md:text-sm font-sans font-medium text-gray-300">
            <span className="text-emerald-400 font-bold flex items-center gap-1">
              <ThumbsUp className="w-4.5 h-4.5 fill-emerald-400/20" />
              98% Relevante
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
            <span>{movie.year}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
            <span className="border border-white/30 px-1.5 py-0.2 rounded text-[10px] tracking-wide font-bold">
              {movie.ageRating}
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
            <span>{movie.duration}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
            <span className="text-gray-400">{movie.genres.join(', ')}</span>
          </div>

          {/* Plot Paragraph */}
          <p className="text-gray-300 text-sm md:text-base leading-relaxed line-clamp-3 md:line-clamp-none max-w-2xl text-justify opacity-90 drop-shadow">
            {movie.description}
          </p>

          {/* Action Callouts */}
          <div className="flex flex-wrap gap-4 pt-3">
            <button
              onClick={() => onPlayClick(movie)}
              className="bg-brand-red hover:bg-brand-red-hover text-white px-8 py-3 rounded-lg flex items-center gap-2.5 font-display font-extrabold text-sm tracking-wider cursor-pointer active:scale-95 hover:scale-[1.03] transition-all duration-300 shadow-lg shadow-brand-red/20"
            >
              <Play className="w-4 h-4 fill-white" />
              ASSISTIR AGORA
            </button>
            
            <button
              onClick={() => onInfoClick(movie)}
              className="glass-panel text-white hover:bg-white/10 border border-white/20 px-8 py-3 rounded-lg flex items-center gap-2.5 font-display font-extrabold text-sm tracking-wider cursor-pointer active:scale-95 hover:scale-[1.03] transition-all duration-300"
            >
              <Info className="w-4.5 h-4.5" />
              MAIS INFORMAÇÕES
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
