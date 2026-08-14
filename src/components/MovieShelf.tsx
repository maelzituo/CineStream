/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Play, Plus, Check, Star } from 'lucide-react';
import { Movie } from '../types';
import { handleImageError } from '../lib/imageFallback';

interface MovieShelfProps {
  title: string;
  movies: Movie[];
  layout?: 'poster' | 'landscape';
  onMovieClick: (movie: Movie) => void;
  onSavedToggle?: (movie: Movie) => void;
  savedIds?: string[];
}

export default function MovieShelf({
  title,
  movies,
  layout = 'poster',
  onMovieClick,
  onSavedToggle,
  savedIds = [],
}: MovieShelfProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  const checkScroll = () => {
    const container = scrollContainerRef.current;
    if (container) {
      setShowLeftArrow(container.scrollLeft > 15);
      setShowRightArrow(
        container.scrollLeft < container.scrollWidth - container.clientWidth - 15
      );
    }
  };

  const handleScroll = (direction: 'left' | 'right') => {
    const container = scrollContainerRef.current;
    if (container) {
      const scrollAmount = container.clientWidth * 0.75;
      container.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  if (movies.length === 0) return null;

  return (
    <section className="relative space-y-3 group/shelf select-none">
      {/* Shelf Header */}
      <div className="flex justify-between items-center px-6 md:px-16">
        <h2 className="font-display font-extrabold text-lg md:text-xl text-white tracking-wide flex items-center gap-2">
          <span>{title}</span>
        </h2>
      </div>

      {/* Carousel Wrapper */}
      <div className="relative">
        {/* Left Arrow Trigger */}
        {showLeftArrow && (
          <button
            onClick={() => handleScroll('left')}
            className="absolute left-2 md:left-6 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-black/80 hover:bg-brand-red text-white border border-white/20 shadow-2xl backdrop-blur-md flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer opacity-90 group-hover/shelf:opacity-100"
            aria-label="Rolar para esquerda"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}

        {/* Right Arrow Trigger */}
        {showRightArrow && (
          <button
            onClick={() => handleScroll('right')}
            className="absolute right-2 md:right-6 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-black/80 hover:bg-brand-red text-white border border-white/20 shadow-2xl backdrop-blur-md flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer opacity-90 group-hover/shelf:opacity-100"
            aria-label="Rolar para direita"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}

        {/* Horizontal Scroll Area */}
        <div
          ref={scrollContainerRef}
          onScroll={checkScroll}
          className="flex gap-4 overflow-x-auto px-6 md:px-16 py-3 hide-scrollbar shelf-mask scroll-smooth"
        >
          {movies.map((movie) => {
            const isSaved = savedIds.includes(movie.id);
            const imageSource = layout === 'poster' ? (movie.imageUrl || movie.backdropUrl) : (movie.backdropUrl || movie.imageUrl);

            return (
              <div
                key={movie.id}
                onClick={() => onMovieClick(movie)}
                className={`flex-none group/card cursor-pointer transition-all duration-300 ${
                  layout === 'poster' ? 'w-36 sm:w-44 md:w-52' : 'w-64 sm:w-72 md:w-88'
                }`}
              >
                {/* Media Container */}
                <div
                  className={`relative rounded-xl overflow-hidden border border-white/10 shadow-md bg-surface-container transition-all duration-300 group-hover/card:scale-105 group-hover/card:border-brand-red/50 group-hover/card:shadow-xl group-hover/card:shadow-brand-red/10 ${
                    layout === 'poster' ? 'aspect-[2/3]' : 'aspect-video'
                  }`}
                >
                  <img
                    referrerPolicy="no-referrer"
                    src={imageSource}
                    alt={movie.title}
                    onError={(e) => handleImageError(e, layout === 'poster' ? 'poster' : 'backdrop')}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover/card:scale-105 bg-surface-container"
                    loading="lazy"
                  />

                  {/* Rating Tag */}
                  {movie.rating && (
                    <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-md bg-black/75 backdrop-blur-sm border border-white/10 flex items-center gap-1 text-[10px] font-bold text-yellow-400 z-10">
                      <Star className="w-2.5 h-2.5 fill-yellow-400 text-yellow-400" />
                      <span>{movie.rating.toFixed(1)}</span>
                    </div>
                  )}

                  {/* Backdrop Overlay for Landscape layout */}
                  {layout === 'landscape' && (
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent flex flex-col justify-end p-3 md:p-4">
                      {/* Watch Progress Indicator */}
                      {movie.progress !== undefined && (
                        <div className="w-full bg-white/20 h-1.5 rounded-full overflow-hidden mb-2">
                          <div
                            className="bg-brand-red h-full rounded-full"
                            style={{ width: `${movie.progress}%` }}
                          />
                        </div>
                      )}
                      <span className="text-white font-display font-bold text-xs md:text-sm truncate drop-shadow">
                        {movie.title}
                      </span>
                    </div>
                  )}

                  {/* Hover Glass Controls for Poster layout */}
                  {layout === 'poster' && (
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-200 flex flex-col justify-end p-3">
                      <div className="flex justify-between items-center z-10">
                        {/* Play Action */}
                        <div className="flex items-center gap-1.5 text-xs text-white font-display font-black">
                          <div className="w-7 h-7 rounded-full bg-brand-red flex items-center justify-center shadow-md">
                            <Play className="w-3.5 h-3.5 text-white fill-white translate-x-0.2" />
                          </div>
                          <span>ASSISTIR</span>
                        </div>

                        {/* Save Trigger */}
                        {onSavedToggle && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation(); // prevent opening details
                              onSavedToggle(movie);
                            }}
                            className="w-8 h-8 rounded-full bg-black/60 backdrop-blur-md border border-white/25 flex items-center justify-center hover:bg-brand-red hover:border-brand-red active:scale-90 transition-all cursor-pointer shadow-lg"
                            title={isSaved ? 'Remover da minha lista' : 'Salvar na minha lista'}
                          >
                            {isSaved ? (
                              <Check className="w-4 h-4 text-emerald-400" />
                            ) : (
                              <Plus className="w-4 h-4 text-white" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Poster Subtitles (External below card to match layout) */}
                {layout === 'poster' && (
                  <div className="mt-2 px-1 select-none">
                    <h3 className="font-display font-bold text-xs md:text-sm text-gray-200 truncate group-hover/card:text-white transition-colors">
                      {movie.title}
                    </h3>
                    <p className="font-sans text-[10px] md:text-xs text-gray-400 mt-0.5 font-medium">
                      {movie.year} • {movie.ageRating}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
