/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Movie } from '../types';
import TMDbService from './tmdbService';
import { MOVIES_DATABASE } from '../data/movies';

/**
 * MovieRepository - Repositório de dados para Filmes.
 * Gerencia a busca de metadados via TMDb API com fallback gracioso para o banco local.
 */
export class MovieRepository {
  /**
   * Obtém filmes em tendência (Trending)
   */
  public static async getTrendingMovies(page: number = 1): Promise<{ results: Movie[]; totalPages: number }> {
    try {
      const data = await TMDbService.fetchFromTmdb<any>('/trending/movie/week', { page: String(page) });
      const results = (data.results || []).map((item: any) => TMDbService.formatTmdbToMovie(item, 'movie'));
      return { results, totalPages: data.total_pages || 1 };
    } catch (e) {
      console.warn('Fallback MovieRepository.getTrendingMovies para dados locais:', e);
      return { results: MOVIES_DATABASE.filter((m) => m.type !== 'series'), totalPages: 1 };
    }
  }

  /**
   * Obtém filmes populares
   */
  public static async getPopularMovies(page: number = 1): Promise<{ results: Movie[]; totalPages: number }> {
    try {
      const data = await TMDbService.fetchFromTmdb<any>('/movie/popular', { page: String(page) });
      const results = (data.results || []).map((item: any) => TMDbService.formatTmdbToMovie(item, 'movie'));
      return { results, totalPages: data.total_pages || 1 };
    } catch (e) {
      console.warn('Fallback MovieRepository.getPopularMovies:', e);
      return { results: MOVIES_DATABASE.filter((m) => m.type !== 'series'), totalPages: 1 };
    }
  }

  /**
   * Obtém filmes mais bem avaliados (Top Rated)
   */
  public static async getTopRatedMovies(page: number = 1): Promise<{ results: Movie[]; totalPages: number }> {
    try {
      const data = await TMDbService.fetchFromTmdb<any>('/movie/top_rated', { page: String(page) });
      const results = (data.results || []).map((item: any) => TMDbService.formatTmdbToMovie(item, 'movie'));
      return { results, totalPages: data.total_pages || 1 };
    } catch (e) {
      console.warn('Fallback MovieRepository.getTopRatedMovies:', e);
      return { results: MOVIES_DATABASE.filter((m) => m.rating >= 8.5), totalPages: 1 };
    }
  }

  /**
   * Obtém os últimos lançamentos (Now Playing)
   */
  public static async getNowPlayingMovies(page: number = 1): Promise<{ results: Movie[]; totalPages: number }> {
    try {
      const data = await TMDbService.fetchFromTmdb<any>('/movie/now_playing', { page: String(page) });
      const results = (data.results || []).map((item: any) => TMDbService.formatTmdbToMovie(item, 'movie'));
      return { results, totalPages: data.total_pages || 1 };
    } catch (e) {
      console.warn('Fallback MovieRepository.getNowPlayingMovies:', e);
      return { results: MOVIES_DATABASE.filter((m) => m.year >= 2023), totalPages: 1 };
    }
  }

  /**
   * Obtém os próximos lançamentos (Upcoming)
   */
  public static async getUpcomingMovies(page: number = 1): Promise<{ results: Movie[]; totalPages: number }> {
    try {
      const data = await TMDbService.fetchFromTmdb<any>('/movie/upcoming', { page: String(page) });
      const results = (data.results || []).map((item: any) => TMDbService.formatTmdbToMovie(item, 'movie'));
      return { results, totalPages: data.total_pages || 1 };
    } catch (e) {
      console.warn('Fallback MovieRepository.getUpcomingMovies:', e);
      return { results: MOVIES_DATABASE.slice(0, 4), totalPages: 1 };
    }
  }

  /**
   * Filtra filmes por categoria/gênero
   */
  public static async getMoviesByGenre(genreId: number, page: number = 1): Promise<{ results: Movie[]; totalPages: number }> {
    try {
      const data = await TMDbService.fetchFromTmdb<any>('/discover/movie', {
        with_genres: String(genreId),
        page: String(page),
      });
      const results = (data.results || []).map((item: any) => TMDbService.formatTmdbToMovie(item, 'movie'));
      return { results, totalPages: data.total_pages || 1 };
    } catch (e) {
      console.warn('Fallback MovieRepository.getMoviesByGenre:', e);
      return { results: MOVIES_DATABASE, totalPages: 1 };
    }
  }

  /**
   * Obtém detalhes completos de um filme (com elenco, diretor, trailer, recomendações)
   */
  public static async getMovieDetails(tmdbId: number | string): Promise<Movie | null> {
    try {
      const data = await TMDbService.fetchFromTmdb<any>(`/movie/${tmdbId}`, {
        append_to_response: 'credits,videos,recommendations',
      });
      return TMDbService.formatTmdbToMovie(data, 'movie');
    } catch (e) {
      console.warn(`Fallback MovieRepository.getMovieDetails para ID ${tmdbId}:`, e);
      const local = MOVIES_DATABASE.find((m) => String(m.tmdbId) === String(tmdbId) || m.id === String(tmdbId));
      return local || null;
    }
  }

  /**
   * Realiza busca por nome de filme
   */
  public static async searchMovies(query: string, page: number = 1): Promise<{ results: Movie[]; totalPages: number }> {
    if (!query.trim()) return { results: [], totalPages: 0 };
    try {
      const data = await TMDbService.fetchFromTmdb<any>('/search/movie', {
        query,
        page: String(page),
      });
      const results = (data.results || []).map((item: any) => TMDbService.formatTmdbToMovie(item, 'movie'));
      return { results, totalPages: data.total_pages || 1 };
    } catch (e) {
      console.warn('Fallback MovieRepository.searchMovies:', e);
      const q = query.toLowerCase();
      const results = MOVIES_DATABASE.filter(
        (m) => m.title.toLowerCase().includes(q) || m.description.toLowerCase().includes(q)
      );
      return { results, totalPages: 1 };
    }
  }
}

export default MovieRepository;
