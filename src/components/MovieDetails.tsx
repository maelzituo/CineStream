/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  Play, 
  Plus, 
  Check, 
  Star, 
  Users, 
  Sparkles, 
  MessageSquare, 
  Send, 
  Trash2, 
  Database,
  Film,
  X,
  Clapperboard
} from 'lucide-react';
import { Movie } from '../types';
import { MOVIES_DATABASE } from '../data/movies';
import { db, MovieReview } from '../lib/database';
import { handleImageError, DEFAULT_BACKDROP_FALLBACK, DEFAULT_POSTER_FALLBACK, DEFAULT_AVATAR_FALLBACK } from '../lib/imageFallback';
import { useAuth } from '../context/AuthContext';
import MovieRepository from '../services/movieRepository';
import SeriesRepository from '../services/seriesRepository';

interface MovieDetailsProps {
  movie: Movie;
  onBack: () => void;
  onPlayClick: (movie: Movie) => void;
  onSavedToggle: (movie: Movie) => void;
  savedIds: string[];
  onNavigateToMovie: (movie: Movie) => void;
}

export default function MovieDetails({
  movie: initialMovie,
  onBack,
  onPlayClick,
  onSavedToggle,
  savedIds,
  onNavigateToMovie,
}: MovieDetailsProps) {
  const { user } = useAuth();
  const [movie, setMovie] = useState<Movie>(initialMovie);
  const [showTrailerModal, setShowTrailerModal] = useState(false);
  const [backdropSrc, setBackdropSrc] = useState(
    initialMovie.backdropUrl || initialMovie.imageUrl || DEFAULT_BACKDROP_FALLBACK
  );

  // Carrega informações estendidas do TMDb (elenco, diretor, trailer, recomendações) se disponível
  useEffect(() => {
    setMovie(initialMovie);
    setBackdropSrc(initialMovie.backdropUrl || initialMovie.imageUrl || DEFAULT_BACKDROP_FALLBACK);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    let isMounted = true;
    const loadFullDetails = async () => {
      if (initialMovie.tmdbId) {
        try {
          const fullData = initialMovie.type === 'series'
            ? await SeriesRepository.getSeriesDetails(initialMovie.tmdbId)
            : await MovieRepository.getMovieDetails(initialMovie.tmdbId);
          if (fullData && isMounted) {
            setMovie((prev) => ({
              ...prev,
              ...fullData,
              imageUrl: fullData.imageUrl || prev.imageUrl,
              backdropUrl: fullData.backdropUrl || prev.backdropUrl,
            }));
            if (fullData.backdropUrl) {
              setBackdropSrc(fullData.backdropUrl);
            }
          }
        } catch (e) {
          console.warn('Erro ao carregar detalhes estendidos do TMDb:', e);
        }
      }
    };

    loadFullDetails();
    return () => { isMounted = false; };
  }, [initialMovie]);

  const isSaved = savedIds.includes(movie.id);

  // Estados de Avaliações / Comentários no Banco de Dados Local
  const [reviews, setReviews] = useState<MovieReview[]>([]);
  const [newComment, setNewComment] = useState('');
  const [newRating, setNewRating] = useState(10);
  const [submittingReview, setSubmittingReview] = useState(false);

  const loadReviews = async () => {
    try {
      const dbReviews = await db.getReviews(movie.id);
      setReviews(dbReviews);
    } catch (e) {
      console.error('Erro ao buscar avaliações:', e);
    }
  };

  useEffect(() => {
    loadReviews();
  }, [movie.id]);

  const handleAddReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || submittingReview) return;

    try {
      setSubmittingReview(true);
      
      const userName = user?.displayName || user?.email?.split('@')[0] || 'Usuário CineStream';
      const userAvatar = user?.photoURL || DEFAULT_AVATAR_FALLBACK;
      const userId = user?.uid;

      await db.addReview(movie.id, newRating, newComment, userName, userAvatar, userId);
      setNewComment('');
      setNewRating(10);
      await loadReviews();
    } catch (error) {
      console.error('Falha ao registrar crítica no banco de dados:', error);
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleDeleteReview = async (id: string) => {
    try {
      await db.deleteReview(id);
      await loadReviews();
    } catch (error) {
      console.error('Falha ao deletar crítica:', error);
    }
  };

  // Recomendações e Títulos Semelhantes
  const recommendationsList = movie.recommendations && movie.recommendations.length > 0
    ? movie.recommendations
    : (movie.similarIds || [])
        .map((id) => MOVIES_DATABASE.find((m) => m.id === id))
        .filter((m): m is Movie => !!m);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="min-h-screen bg-[#0F0F0F] pb-28 text-gray-200 select-none"
    >
      {/* Hero Banner Backdrop */}
      <section className="relative w-full h-[55vh] md:h-[70vh] overflow-hidden bg-brand-bg">
        <img
          referrerPolicy="no-referrer"
          src={backdropSrc}
          alt={movie.title}
          onError={(e) => {
            handleImageError(e, 'backdrop');
            setBackdropSrc(DEFAULT_BACKDROP_FALLBACK);
          }}
          className="absolute inset-0 w-full h-full object-cover object-center filter brightness-90"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0F0F0F] via-[#0F0F0F]/60 to-transparent z-10" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0F0F0F]/90 via-[#0F0F0F]/40 to-transparent z-10" />

        {/* Botão de Voltar */}
        <button
          onClick={onBack}
          className="absolute top-6 left-6 z-30 w-11 h-11 rounded-full flex items-center justify-center bg-black/70 hover:bg-brand-red active:scale-95 transition-all text-white cursor-pointer border border-white/20 shadow-2xl backdrop-blur-md"
          aria-label="Voltar"
          id="movie-details-back-btn"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
      </section>

      {/* Conteúdo Principal com Poster e Detalhes */}
      <section className="relative -mt-36 md:-mt-48 px-6 md:px-16 max-w-7xl mx-auto space-y-8 z-20">
        <div className="flex flex-col md:flex-row gap-8 items-start">
          {/* Poster Card */}
          <div className="flex-none w-44 md:w-64 aspect-[2/3] rounded-2xl overflow-hidden border-2 border-white/15 shadow-2xl bg-surface-container relative group">
            <img
              referrerPolicy="no-referrer"
              src={movie.imageUrl || DEFAULT_POSTER_FALLBACK}
              alt={movie.title}
              onError={(e) => handleImageError(e, 'poster')}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute top-3 left-3 px-2.5 py-1 bg-black/80 backdrop-blur-md border border-white/15 rounded-md text-[10px] font-display font-black text-brand-red uppercase">
              {movie.type === 'series' ? 'Série' : 'Filme'}
            </div>
          </div>

          {/* Cabeçalho e Metadados */}
          <div className="flex-1 space-y-4 pt-2 md:pt-12">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                {movie.type === 'series' ? (
                  <span className="px-2.5 py-0.5 bg-brand-red/20 border border-brand-red/40 text-brand-red text-[10px] font-display font-black tracking-widest rounded uppercase">
                    Série Embed
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 bg-white/10 border border-white/20 text-gray-300 text-[10px] font-display font-black tracking-widest rounded uppercase">
                    Filme Embed
                  </span>
                )}
                {movie.tmdbId && (
                  <span className="px-2 py-0.5 bg-white/5 border border-white/10 text-gray-400 font-mono text-[10px] rounded">
                    TMDb: {movie.tmdbId}
                  </span>
                )}
                {movie.director && (
                  <span className="px-2 py-0.5 bg-white/5 border border-white/10 text-amber-400 font-sans text-[10px] font-bold rounded flex items-center gap-1">
                    <Clapperboard className="w-3 h-3 text-amber-400" />
                    Dir: {movie.director}
                  </span>
                )}
              </div>

              <h1 className="font-display font-black text-3xl md:text-5xl text-white leading-tight drop-shadow-md">
                {movie.title}
              </h1>
            </div>

            {/* Linha de Indicadores de Metadados */}
            <div className="flex flex-wrap items-center gap-3 md:gap-4 text-xs md:text-sm font-sans font-medium text-gray-300">
              <span className="flex items-center gap-1.5 text-brand-red font-extrabold bg-brand-red/15 px-2.5 py-1 rounded-md border border-brand-red/30">
                <Star className="w-4 h-4 fill-brand-red text-brand-red" />
                {movie.rating.toFixed(1)} / 10
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
              <span className="font-bold text-white">{movie.year}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
              <span className="px-2 py-0.5 border border-white/30 rounded text-[10px] tracking-wider font-extrabold text-gray-200 bg-black/40">
                {movie.ageRating}
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
              <span className="font-semibold text-gray-200">{movie.duration}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
              <span className="text-gray-300">{movie.genres.join(', ')}</span>
            </div>

            {/* Botões de Ação Principais */}
            <div className="flex flex-wrap items-center gap-3.5 pt-4">
              <button
                onClick={() => onPlayClick(movie)}
                className="bg-brand-red hover:bg-brand-red-hover text-white font-display font-black text-xs sm:text-sm tracking-wider py-3.5 px-8 sm:px-10 rounded-xl flex items-center justify-center gap-2.5 active:scale-95 hover:scale-[1.02] transition-all duration-300 shadow-xl shadow-brand-red/30 cursor-pointer border border-red-500/40"
                id="details-play-button"
              >
                <Play className="w-4.5 h-4.5 sm:w-5 sm:h-5 fill-white" />
                <span>ASSISTIR AGORA</span>
              </button>

              {movie.videoUrl && (
                <button
                  onClick={() => setShowTrailerModal(true)}
                  className="bg-white/10 hover:bg-white/20 border border-white/20 text-white font-display font-bold text-xs sm:text-sm tracking-wider py-3.5 px-6 sm:px-8 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
                  id="details-trailer-button"
                >
                  <Film className="w-4 h-4 text-amber-400" />
                  <span>Trailer</span>
                </button>
              )}

              <button
                onClick={() => onSavedToggle(movie)}
                className="bg-black/40 hover:bg-white/15 border border-white/20 text-white font-display font-bold text-xs sm:text-sm tracking-wider py-3.5 px-6 sm:px-8 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer backdrop-blur-md"
                id="details-save-button"
              >
                {isSaved ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>Na Lista</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 text-white" />
                    <span>Minha Lista</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Sinopse */}
        <div className="max-w-4xl space-y-3 pt-6 border-t border-white/10">
          <h3 className="font-display font-extrabold text-xs uppercase tracking-[0.2em] text-gray-400">
            Sinopse
          </h3>
          <p className="font-sans text-sm md:text-base text-gray-300 leading-relaxed text-justify">
            {movie.description}
          </p>
        </div>

        {/* Diretor e Ficha Técnica */}
        {movie.director && (
          <div className="pt-2 text-xs font-sans text-gray-400">
            <span className="font-bold text-white uppercase tracking-wider">Direção:</span> {movie.director}
          </div>
        )}

        {/* Elenco */}
        {movie.cast && movie.cast.length > 0 && (
          <div className="space-y-4 pt-6 border-t border-white/5">
            <div className="flex items-center gap-2 text-gray-400">
              <Users className="w-4.5 h-4.5 text-brand-red" />
              <h3 className="font-display font-extrabold text-xs uppercase tracking-[0.2em]">
                Elenco Principal
              </h3>
            </div>

            <div className="flex gap-6 overflow-x-auto hide-scrollbar pb-2">
              {movie.cast.map((actor) => (
                <div key={actor.id} className="flex-none w-24 text-center group">
                  <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-surface-container border-2 border-white/15 mx-auto overflow-hidden group-hover:border-brand-red transition-all duration-300 shadow-md">
                    <img
                      referrerPolicy="no-referrer"
                      src={actor.imageUrl || DEFAULT_AVATAR_FALLBACK}
                      alt={actor.name}
                      onError={(e) => handleImageError(e, 'avatar')}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      loading="lazy"
                    />
                  </div>
                  <p className="mt-2.5 font-sans font-bold text-xs text-gray-200 truncate leading-tight">
                    {actor.name}
                  </p>
                  <p className="font-sans text-[10px] text-gray-400 mt-0.5 truncate">
                    {actor.character}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recomendações */}
        {recommendationsList.length > 0 && (
          <div className="space-y-4 pt-8 border-t border-white/5">
            <div className="flex items-center gap-2 text-gray-400">
              <Sparkles className="w-4.5 h-4.5 text-brand-red" />
              <h3 className="font-display font-extrabold text-xs uppercase tracking-[0.2em]">
                Recomendações e Títulos Semelhantes
              </h3>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-5">
              {recommendationsList.map((similar) => (
                <div
                  key={similar.id}
                  onClick={() => onNavigateToMovie(similar)}
                  className="group cursor-pointer space-y-2"
                >
                  <div className="aspect-[2/3] rounded-xl overflow-hidden border border-white/10 bg-surface-container relative transition-all duration-300 group-hover:scale-105 group-hover:border-brand-red/50 group-hover:shadow-xl">
                    <img
                      referrerPolicy="no-referrer"
                      src={similar.imageUrl || DEFAULT_POSTER_FALLBACK}
                      alt={similar.title}
                      onError={(e) => handleImageError(e, 'poster')}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute bottom-2 right-2 glass-panel px-2 py-0.5 rounded text-[9px] font-extrabold tracking-widest text-white shadow">
                      {similar.rating >= 8.0 ? '★ ' + similar.rating.toFixed(1) : 'HD'}
                    </div>
                  </div>
                  <div className="px-1">
                    <p className="font-display font-bold text-xs truncate text-gray-200 group-hover:text-white transition-colors">
                      {similar.title}
                    </p>
                    <p className="font-sans text-[10px] text-gray-400">
                      {similar.year}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Seção de Comentários / Avaliações */}
        <div className="space-y-6 pt-8 border-t border-white/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-gray-400">
              <MessageSquare className="w-4.5 h-4.5 text-brand-red" />
              <h3 className="font-display font-extrabold text-xs uppercase tracking-[0.2em]">
                Comentários & Críticas
              </h3>
            </div>
            <span className="flex items-center gap-1 text-[10px] font-mono text-gray-400 bg-white/5 border border-white/10 px-2.5 py-1 rounded">
              <Database className="w-3 h-3 text-brand-red" />
              {reviews.length} {reviews.length === 1 ? 'registro' : 'registros'}
            </span>
          </div>

          {/* Form de Críticas */}
          <form onSubmit={handleAddReview} className="glass-panel p-5 rounded-2xl border border-white/10 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <span className="text-xs font-sans text-gray-300 font-bold">Sua nota para este título:</span>
              <div className="flex flex-wrap items-center gap-1.5">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setNewRating(num)}
                    className={`w-8 h-8 rounded-lg font-display text-xs font-black transition-all cursor-pointer ${
                      newRating === num
                        ? 'bg-brand-red text-white scale-110 shadow-lg shadow-brand-red/35'
                        : 'bg-white/5 hover:bg-white/15 text-gray-400 hover:text-white border border-white/5'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <input
                type="text"
                placeholder="Escreva seu comentário..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="flex-1 bg-white/5 border border-white/10 hover:border-white/20 focus:border-brand-red/60 rounded-xl px-4 py-3 text-sm font-sans placeholder-gray-500 outline-none transition-all text-white"
                disabled={submittingReview}
              />
              <button
                type="submit"
                disabled={submittingReview || !newComment.trim()}
                className="bg-brand-red hover:bg-brand-red-hover disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed text-white px-5 rounded-xl flex items-center justify-center transition-all cursor-pointer shadow-md active:scale-95"
              >
                <Send className="w-4.5 h-4.5" />
              </button>
            </div>
          </form>

          {/* Lista de Avaliações */}
          <div className="space-y-3 max-h-[350px] overflow-y-auto hide-scrollbar pr-1">
            {reviews.length === 0 ? (
              <div className="text-center py-8 glass-panel rounded-xl border border-dashed border-white/5">
                <p className="font-sans text-xs text-gray-500">
                  Nenhum comentário ainda. Seja o primeiro a comentar!
                </p>
              </div>
            ) : (
              reviews.map((review) => (
                <div
                  key={review.id}
                  className="glass-panel p-4 rounded-xl border border-white/5 flex gap-4 items-start group"
                >
                  <img
                    referrerPolicy="no-referrer"
                    src={review.userAvatar || DEFAULT_AVATAR_FALLBACK}
                    alt={review.userName}
                    onError={(e) => handleImageError(e, 'avatar')}
                    className="w-10 h-10 rounded-full border border-white/10 object-cover bg-surface-container"
                  />
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-sans font-bold text-xs text-white truncate">
                          {review.userName}
                        </span>
                        <span className="text-[10px] text-gray-500 font-mono">
                          {new Date(review.createdAt).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-xs font-black text-brand-red bg-brand-red/10 px-2 py-0.5 rounded border border-brand-red/20">
                        <Star className="w-3 h-3 fill-brand-red" />
                        {review.rating}/10
                      </div>
                    </div>
                    <p className="font-sans text-xs md:text-sm text-gray-300 leading-relaxed break-words">
                      {review.comment}
                    </p>
                  </div>

                  <button
                    onClick={() => handleDeleteReview(review.id)}
                    className="opacity-0 group-hover:opacity-100 p-2 text-gray-500 hover:text-brand-red hover:bg-brand-red/10 rounded-lg transition-all cursor-pointer"
                    title="Excluir"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Modal de Trailer */}
      <AnimatePresence>
        {showTrailerModal && movie.videoUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          >
            <div className="relative w-full max-w-4xl aspect-video bg-black rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
              <button
                onClick={() => setShowTrailerModal(false)}
                className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-black/70 hover:bg-brand-red text-white flex items-center justify-center transition-colors cursor-pointer border border-white/20"
              >
                <X className="w-5 h-5" />
              </button>
              <iframe
                src={`${movie.videoUrl}?autoplay=1`}
                title={`Trailer - ${movie.title}`}
                className="w-full h-full border-0"
                allow="autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
