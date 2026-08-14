/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import { Play, Film, HelpCircle, HeartOff, Trash2 } from 'lucide-react';
import { Movie } from '../types';

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
      className="min-h-screen bg-brand-bg pt-24 px-6 md:px-16 pb-32 select-none"
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
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-gray-500 border border-white/10">
            <Film className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h3 className="font-display font-bold text-lg text-white">
              Sua lista está vazia
            </h3>
            <p className="text-sm text-gray-400">
              Navegue pelos nossos títulos originais e salve os seus favoritos para assistir mais tarde.
            </p>
          </div>
          <button
            onClick={onNavigateHome}
            className="bg-brand-red hover:bg-brand-red-hover text-white px-6 py-2.5 rounded-lg font-display font-bold text-xs tracking-widest active:scale-95 transition-all cursor-pointer"
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
              transition={{ duration: 0.4, delay: index * 0.04 }}
              className="relative group cursor-pointer overflow-hidden rounded-xl bg-surface-container"
              onClick={() => onMovieClick(movie)}
            >
              {/* Poster frame with hover overlay triggers */}
              <div className="aspect-[2/3] w-full bg-white/5 relative overflow-hidden rounded-xl border border-white/5 group-hover:scale-105 group-hover:border-brand-red/40 transition-all duration-300 shadow-md">
                <img
                  referrerPolicy="no-referrer"
                  src={movie.imageUrl}
                  alt={movie.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.08]"
                />

                {/* Glassmorphic Play button cover on hover */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/60 backdrop-blur-xs">
                  <div className="w-12 h-12 bg-brand-red rounded-full flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-transform">
                    <Play className="w-6 h-6 text-white fill-white translate-x-0.5" />
                  </div>
                </div>

                {/* Floating Trash Action to remove from List directly */}
                <button
                  onClick={(e) => {
                    e.stopPropagation(); // Stop navigation click
                    onRemoveFromList(movie);
                  }}
                  className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-black/50 hover:bg-brand-red text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow border border-white/10 active:scale-90"
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
                <p className="font-sans text-[10px] md:text-xs text-gray-400 font-semibold tracking-wider mt-0.5">
                  {movie.genres[0]?.toUpperCase()} • {movie.year}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
