/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Play, Plus, Check } from 'lucide-react';
import { Movie } from '../types';

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
      setShowLeftArrow(container.scrollLeft > 10);
      setShowRightArrow(
        container.scrollLeft < container.scrollWidth - container.clientWidth - 10
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
        <h2 className="font-display font-extrabold text-lg md:text-xl text-white tracking-wide">
          {title}
        </h2>
      </div>

      {/* Carousel Wrapper */}
      <div className="relative">
        {/* Left Arrow Trigger */}
        {showLeftArrow && (
          <button
            onClick={() => handleScroll('left')}
            className="absolute left-0 top-0 bottom-0 w-12 z-40 bg-gradient-to-r from-brand-bg to-transparent flex items-center justify-start pl-2 opacity-0 group-hover/shelf:opacity-100 transition-opacity duration-300 hover:scale-105 cursor-pointer text-white"
          >
            <div className="w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm border border-white/10 flex items-center justify-center hover:bg-black/80">
              <ChevronLeft className="w-5 h-5" />
            </div>
          </button>
        )}

        {/* Right Arrow Trigger */}
        {showRightArrow && (
          <button
            onClick={() => handleScroll('right')}
            className="absolute right-0 top-0 bottom-0 w-12 z-40 bg-gradient-to-l from-brand-bg to-transparent flex items-center justify-end pr-2 opacity-0 group-hover/shelf:opacity-100 transition-opacity duration-300 hover:scale-105 cursor-pointer text-white"
          >
            <div className="w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm border border-white/10 flex items-center justify-center hover:bg-black/80">
              <ChevronRight className="w-5 h-5" />
            </div>
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

            return (
              <div
                key={movie.id}
                onClick={() => onMovieClick(movie)}
                className={`flex-none group/card cursor-pointer transition-all duration-300 ${
                  layout === 'poster' ? 'w-36 md:w-52' : 'w-64 md:w-88'
                }`}
              >
                {/* Media Container */}
                <div
                  className={`relative rounded-xl overflow-hidden border border-white/5 shadow-md bg-surface-container transition-all duration-500 group-hover/card:scale-105 group-hover/card:border-brand-red/40 group-hover/card:shadow-lg group-hover/card:shadow-brand-red/10 ${
                    layout === 'poster' ? 'aspect-[2/3]' : 'aspect-video'
                  }`}
                >
                  <img
                    referrerPolicy="no-referrer"
                    src={layout === 'poster' ? movie.imageUrl : movie.backdropUrl}
                    alt={movie.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover/card:scale-[1.08]"
                  />

                  {/* Backdrop Overlay for Landscape layout */}
                  {layout === 'landscape' && (
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-end p-3 md:p-4">
                      {/* Watch Progress Indicator */}
                      {movie.progress !== undefined && (
                        <div className="w-full bg-white/20 h-1 rounded-full overflow-hidden mb-2">
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
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
                      <div className="flex justify-between items-center z-10">
                        {/* Play Action */}
                        <div className="flex items-center gap-1.5 text-xs text-white font-display font-black">
                          <Play className="w-4.5 h-4.5 text-brand-red fill-brand-red" />
                          <span>PLAY</span>
                        </div>

                        {/* Save Trigger */}
                        {onSavedToggle && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation(); // prevent opening details
                              onSavedToggle(movie);
                            }}
                            className="w-7 h-7 rounded-full bg-black/40 backdrop-blur-sm border border-white/20 flex items-center justify-center hover:bg-brand-red/20 hover:border-brand-red active:scale-90 transition-all cursor-pointer"
                          >
                            {isSaved ? (
                              <Check className="w-4.5 h-4.5 text-emerald-400" />
                            ) : (
                              <Plus className="w-4.5 h-4.5 text-white" />
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
                    <p className="font-sans text-[10px] md:text-xs text-gray-400 mt-0.5">
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
