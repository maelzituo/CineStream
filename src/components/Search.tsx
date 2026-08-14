/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search as SearchIcon, 
  X, 
  Film, 
  Compass, 
  Tv, 
  Users, 
  RefreshCw, 
  Loader2, 
  Star 
} from 'lucide-react';
import { Movie } from '../types';
import TMDbService from '../services/tmdbService';

interface SearchProps {
  movies: Movie[];
  onMovieClick: (movie: Movie) => void;
}

// Mapeamento de Gêneros Populares com seus respectivos IDs no TMDb
const GENRE_TAGS = [
  { name: 'Todos', id: null },
  { name: 'Ação', id: 28 },
  { name: 'Ficção Científica', id: 878 },
  { name: 'Drama', id: 18 },
  { name: 'Comédia', id: 35 },
  { name: 'Terror', id: 27 },
  { name: 'Animação', id: 16 },
  { name: 'Crime', id: 80 },
  { name: 'Suspense', id: 53 },
  { name: 'Romance', id: 10749 },
  { name: 'Aventura', id: 12 },
];

export default function Search({ movies: initialMovies, onMovieClick }: SearchProps) {
  const [query, setQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<{ name: string; id: number | null }>(GENRE_TAGS[0]);
  
  // Lista de resultados da busca dinâmica
  const [apiResults, setApiResults] = useState<Movie[]>([]);
  const [actorResults, setActorResults] = useState<any[]>([]);
  
  // Estados de Paginação e Carregamento
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchType, setSearchType] = useState<'all' | 'movie' | 'series' | 'actor'>('all');

  // Função principal de busca via TMDb
  const performSearch = useCallback(async (searchQuery: string, genreId: number | null, pageNum: number, append = false) => {
    setIsLoading(true);
    try {
      if (searchQuery.trim().length > 0) {
        if (searchType === 'actor') {
          // Busca por Ator/Pessoa
          const data = await TMDbService.fetchFromTmdb<any>('/search/person', {
            query: searchQuery,
            page: String(pageNum),
          });
          const persons = data.results || [];
          setActorResults(persons);

          // Extrai os filmes e séries conhecidos desse ator
          const knownMovies: Movie[] = [];
          persons.forEach((p: any) => {
            if (p.known_for && Array.isArray(p.known_for)) {
              p.known_for.forEach((item: any) => {
                knownMovies.push(TMDbService.formatTmdbToMovie(item));
              });
            }
          });
          
          setApiResults((prev) => (append ? [...prev, ...knownMovies] : knownMovies));
          setTotalPages(data.total_pages || 1);
        } else {
          // Busca Geral Multi (Filmes e Séries)
          const data = await TMDbService.fetchFromTmdb<any>('/search/multi', {
            query: searchQuery,
            page: String(pageNum),
          });

          const formatted = (data.results || [])
            .filter((item: any) => item.media_type === 'movie' || item.media_type === 'tv')
            .map((item: any) => TMDbService.formatTmdbToMovie(item));

          setApiResults((prev) => (append ? [...prev, ...formatted] : formatted));
          setTotalPages(data.total_pages || 1);
        }
      } else if (genreId) {
        // Busca por Gênero/Categoria
        const movieData = await TMDbService.fetchFromTmdb<any>('/discover/movie', {
          with_genres: String(genreId),
          page: String(pageNum),
        });
        const formatted = (movieData.results || []).map((item: any) => TMDbService.formatTmdbToMovie(item, 'movie'));

        setApiResults((prev) => (append ? [...prev, ...formatted] : formatted));
        setTotalPages(movieData.total_pages || 1);
      } else {
        // Sem query nem gênero: exibe catálogo local
        setApiResults([]);
      }
    } catch (e) {
      console.warn('Erro ao buscar do TMDb no componente Search:', e);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [searchType]);

  // Efeito para disparar busca com debounce ao digitar query ou mudar gênero
  useEffect(() => {
    setPage(1);
    const timer = setTimeout(() => {
      if (query.trim() || selectedGenre.id) {
        performSearch(query, selectedGenre.id, 1, false);
      } else {
        setApiResults([]);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [query, selectedGenre, searchType, performSearch]);

  // Carregar mais (Paginação / Scroll Infinito)
  const handleLoadMore = () => {
    if (page < totalPages && !isLoading) {
      const nextPage = page + 1;
      setPage(nextPage);
      performSearch(query, selectedGenre.id, nextPage, true);
    }
  };

  // Pull to Refresh / Atualizar
  const handleRefresh = () => {
    setIsRefreshing(true);
    setPage(1);
    performSearch(query, selectedGenre.id, 1, false);
  };

  // Lista final de filmes a exibir (combina API + catálogo local se query vazia)
  const displayMovies = useMemo(() => {
    if (query.trim() || selectedGenre.id) {
      return apiResults;
    }
    return initialMovies;
  }, [query, selectedGenre, apiResults, initialMovies]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-brand-bg pt-24 px-6 md:px-16 pb-32 text-gray-200 select-none animate-fade-in"
    >
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Barra de Pesquisa */}
        <section className="relative space-y-4">
          <div className="relative flex items-center">
            <SearchIcon className="absolute left-4 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder={
                searchType === 'actor'
                  ? 'Pesquise por nome do ator/atriz (ex: Tom Cruise, Zendaya)...'
                  : 'Pesquise por filmes, séries, atores ou diretores...'
              }
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-surface-container/80 border border-white/10 rounded-2xl py-4.5 pl-12 pr-12 text-sm md:text-base font-sans text-white focus:outline-none focus:border-brand-red focus:bg-surface-container transition-all shadow-inner placeholder-gray-500"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-4 p-1.5 rounded-full bg-white/10 text-gray-400 hover:text-white cursor-pointer active:scale-90"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filtros de Tipo de Busca */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setSearchType('all')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-display font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  searchType === 'all'
                    ? 'bg-brand-red text-white'
                    : 'bg-white/5 text-gray-400 hover:text-white'
                }`}
              >
                <Film className="w-3.5 h-3.5" />
                TUDO
              </button>
              <button
                onClick={() => setSearchType('actor')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-display font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  searchType === 'actor'
                    ? 'bg-brand-red text-white'
                    : 'bg-white/5 text-gray-400 hover:text-white'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                POR ATOR
              </button>
            </div>

            {/* Botão de Atualizar / Pull-to-refresh */}
            <button
              onClick={handleRefresh}
              disabled={isRefreshing || isLoading}
              className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white text-xs font-sans flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-brand-red' : ''}`} />
              Atualizar
            </button>
          </div>
        </section>

        {/* Chips de Categorias e Gêneros */}
        <section className="space-y-3">
          <div className="flex items-center gap-1.5 text-gray-400 text-xs font-display font-extrabold tracking-wider uppercase px-1">
            <Compass className="w-4 h-4 text-brand-red" />
            <span>Explorar Gêneros</span>
          </div>

          <div className="flex gap-2.5 overflow-x-auto hide-scrollbar py-1">
            {GENRE_TAGS.map((genre) => {
              const isActive = selectedGenre.name === genre.name;
              return (
                <button
                  key={genre.name}
                  onClick={() => {
                    setSelectedGenre(genre);
                    setQuery('');
                  }}
                  className={`flex-none px-4.5 py-2.5 rounded-full text-xs font-display font-bold tracking-wide transition-all cursor-pointer active:scale-95 ${
                    isActive
                      ? 'bg-brand-red text-white shadow-lg shadow-brand-red/20'
                      : 'bg-surface-container/70 text-gray-400 hover:bg-white/10 hover:text-white border border-white/5'
                  }`}
                >
                  {genre.name}
                </button>
              );
            })}
          </div>
        </section>

        {/* Resultados de Atores Encontrados */}
        {searchType === 'actor' && actorResults.length > 0 && (
          <section className="space-y-3 pt-2">
            <h3 className="text-xs font-display font-extrabold uppercase tracking-widest text-gray-400">
              Atores Encontrados
            </h3>
            <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-2">
              {actorResults.slice(0, 6).map((actor) => (
                <div key={actor.id} className="flex-none w-24 text-center space-y-2">
                  <div className="w-20 h-20 rounded-full border border-white/15 overflow-hidden mx-auto bg-surface-container">
                    <img
                      referrerPolicy="no-referrer"
                      src={
                        actor.profile_path
                          ? `https://image.tmdb.org/t/p/w185${actor.profile_path}`
                          : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=185&auto=format&fit=crop&q=80'
                      }
                      alt={actor.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <p className="text-xs font-bold text-white truncate">{actor.name}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Indicador de Carregamento */}
        {isLoading && page === 1 && (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 text-brand-red animate-spin" />
          </div>
        )}

        {/* Grid de Resultados */}
        {!isLoading || page > 1 ? (
          <section className="space-y-6">
            <div className="flex justify-between items-center text-xs text-gray-400 font-sans">
              <span>
                Exibindo {displayMovies.length} título{displayMovies.length === 1 ? '' : 's'}
              </span>
              {selectedGenre.name !== 'Todos' && (
                <span className="text-brand-red font-bold uppercase">
                  Gênero: {selectedGenre.name}
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
              {displayMovies.map((movie) => (
                <div
                  key={movie.id}
                  onClick={() => onMovieClick(movie)}
                  className="group cursor-pointer space-y-2"
                >
                  <div className="aspect-[2/3] rounded-2xl overflow-hidden border border-white/10 bg-surface-container relative transition-all duration-300 group-hover:scale-105 group-hover:border-brand-red/50 group-hover:shadow-xl">
                    <img
                      referrerPolicy="no-referrer"
                      src={movie.imageUrl}
                      alt={movie.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/70 backdrop-blur-md text-[9px] font-display font-black text-brand-red uppercase border border-white/10">
                      {movie.type === 'series' ? 'SÉRIE' : 'FILME'}
                    </div>
                    <div className="absolute bottom-2 right-2 glass-panel px-2 py-0.5 rounded text-[10px] font-extrabold text-white flex items-center gap-1 shadow">
                      <Star className="w-3 h-3 fill-brand-red text-brand-red" />
                      {movie.rating.toFixed(1)}
                    </div>
                  </div>
                  <div className="px-1">
                    <p className="font-display font-bold text-xs truncate text-gray-200 group-hover:text-white transition-colors">
                      {movie.title}
                    </p>
                    <p className="font-sans text-[10px] text-gray-400">
                      {movie.year} • {movie.duration}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Botão de Carregar Mais / Paginação */}
            {page < totalPages && (
              <div className="flex justify-center pt-8">
                <button
                  onClick={handleLoadMore}
                  disabled={isLoading}
                  className="px-8 py-3.5 bg-brand-red hover:bg-brand-red-hover text-white font-display font-bold text-xs tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-2 shadow-lg shadow-brand-red/25"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      CARREGANDO...
                    </>
                  ) : (
                    'CARREGAR MAIS RESULTADOS'
                  )}
                </button>
              </div>
            )}
          </section>
        ) : null}
      </div>
    </motion.div>
  );
}
