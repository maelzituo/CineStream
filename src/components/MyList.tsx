/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import { Play, Film, Trash2 } from 'lucide-react';
import { Movie } from '../types';
import { handleImageError, DEFAULT_POSTER_FALLBACK } from '../lib/imageFallback';

interface MyListProps {
  savedMovies: Movie[];
  onMovieClick: (movie: Movie) => void;
  onRemoveFromList: (movie: Movie) => void;
  onNavigateHome: () => void;
}

export default function MyList({
  savedMovies,
  onMovieClick,
  onRemoveFromList,
  onNavigateHome,
}: MyListProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="  select-none"
    >
      {/* Page Header */}
      <section className="mb-8">
        <h2 className="font-display font-extrabold text-2xl md:text-3xl text-white tracking-tight mb-2">
          Minha Lista
        </h2>
        <div className="h-1 w-12 bg-brand-red rounded-full animate-pulse" />
      </section>

      {/* Empty State */}
      {savedMovies.length === 0 ? (
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex flex-col items-center justify-center text-center py-20 px-6 max-w-md mx-auto space-y-6"
        >
          <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center text-gray-500 border border-white/10 shadow-inner">
            <Film className="w-8 h-8 text-brand-red" />
          </div>
          <div className="space-y-2">
            <h3 className="font-display font-bold text-lg text-white">
              Sua lista está vazia
            </h3>
            <p className="text-sm text-gray-400">
              Navegue pelo nosso catálogo e salve seus títulos favoritos para assistir quando quiser.
            </p>
          </div>
          <button
            onClick={onNavigateHome}
            className="bg-brand-red hover:bg-brand-red-hover text-white px-7 py-3 rounded-xl font-display font-bold text-xs tracking-widest active:scale-95 transition-all cursor-pointer shadow-lg shadow-brand-red/30"
          >
            DESCOBRIR FILMES
          </button>
        </motion.div>
      ) : (
        /* Grid of saved movies */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          {savedMovies.map((movie, index) => (
            <motion.div
              key={movie.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: index * 0.03 }}
              className="relative group cursor-pointer overflow-hidden rounded-xl bg-surface-container"
              onClick={() => onMovieClick(movie)}
            >
              {/* Poster frame with hover overlay triggers */}
              <div className="aspect-[2/3] w-full bg-surface-container relative overflow-hidden rounded-xl border border-white/10 group-hover:scale-105 group-hover:border-brand-red/50 transition-all duration-300 shadow-md">
                <img
                  referrerPolicy="no-referrer"
                  src={movie.imageUrl || DEFAULT_POSTER_FALLBACK}
                  alt={movie.title}
                  onError={(e) => handleImageError(e, 'poster')}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />

                {/* Glassmorphic Play button cover on hover */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black/60 backdrop-blur-xs">
                  <div className="w-12 h-12 bg-brand-red rounded-full flex items-center justify-center shadow-xl hover:scale-110 active:scale-95 transition-transform">
                    <Play className="w-5 h-5 text-white fill-white translate-x-0.5" />
                  </div>
                </div>

                {/* Floating Trash Action to remove from List directly */}
                <button
                  onClick={(e) => {
                    e.stopPropagation(); // Stop navigation click
                    onRemoveFromList(movie);
                  }}
                  className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-black/70 hover:bg-brand-red text-white flex items-center justify-center opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity cursor-pointer shadow-lg border border-white/20 active:scale-90"
                  title="Remover da lista"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Poster Labels Block */}
              <div className="mt-2.5 px-1 select-none">
                <h3 className="font-display font-bold text-xs md:text-sm text-gray-200 truncate group-hover:text-white transition-colors">
                  {movie.title}
                </h3>
                <p className="font-sans text-[10px] md:text-xs text-gray-400 font-medium tracking-wider mt-0.5">
                  {movie.genres?.[0]?.toUpperCase()} • {movie.year}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
