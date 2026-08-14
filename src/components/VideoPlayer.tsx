/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import MoviePlayer from './MoviePlayer';
import SeriesPlayer from './SeriesPlayer';
import { Movie } from '../types';

interface VideoPlayerProps {
  movie: Movie;
  onClose: () => void;
}

/**
 * Componente Wrapper VideoPlayer - Redireciona para o MoviePlayer ou SeriesPlayer
 * com base no tipo do conteúdo (filme ou série) e gerencia o player da EmbedMovies.
 */
export default function VideoPlayer({ movie, onClose }: VideoPlayerProps) {
  // Caso seja uma série, abre o SeriesPlayer com seleção de temporadas/episódios
  if (movie.type === 'series') {
    return <SeriesPlayer movie={movie} onClose={onClose} />;
  }

  // Por padrão, abre o MoviePlayer para filmes
  return <MoviePlayer movie={movie} onClose={onClose} />;
}
