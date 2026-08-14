/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Movie } from '../types';
import TMDbService from './tmdbService';
import { MOVIES_DATABASE } from '../data/movies';

/**
 * SeriesRepository - Repositório de dados para Séries de TV.
 * Gerencia a busca de metadados via TMDb API com fallback gracioso para o banco local.
 */
export class SeriesRepository {
  /**
   * Obtém séries em tendência (Trending)
   */
  public static async getTrendingSeries(page: number = 1): Promise<{ results: Movie[]; totalPages: number }> {
    try {
      const data = await TMDbService.fetchFromTmdb<any>('/trending/tv/week', { page: String(page) });
      const results = (data.results || []).map((item: any) => TMDbService.formatTmdbToMovie(item, 'series'));
      return { results, totalPages: data.total_pages || 1 };
    } catch (e) {
      console.warn('Fallback SeriesRepository.getTrendingSeries:', e);
      return { results: MOVIES_DATABASE.filter((m) => m.type === 'series'), totalPages: 1 };
    }
  }

  /**
   * Obtém séries populares
   */
  public static async getPopularSeries(page: number = 1): Promise<{ results: Movie[]; totalPages: number }> {
    try {
      const data = await TMDbService.fetchFromTmdb<any>('/tv/popular', { page: String(page) });
      const results = (data.results || []).map((item: any) => TMDbService.formatTmdbToMovie(item, 'series'));
      return { results, totalPages: data.total_pages || 1 };
    } catch (e) {
      console.warn('Fallback SeriesRepository.getPopularSeries:', e);
      return { results: MOVIES_DATABASE.filter((m) => m.type === 'series'), totalPages: 1 };
    }
  }

  /**
   * Obtém séries em exibição (On The Air / Airing Today)
   */
  public static async getOnTheAirSeries(page: number = 1): Promise<{ results: Movie[]; totalPages: number }> {
    try {
      const data = await TMDbService.fetchFromTmdb<any>('/tv/on_the_air', { page: String(page) });
      const results = (data.results || []).map((item: any) => TMDbService.formatTmdbToMovie(item, 'series'));
      return { results, totalPages: data.total_pages || 1 };
    } catch (e) {
      console.warn('Fallback SeriesRepository.getOnTheAirSeries:', e);
      return { results: MOVIES_DATABASE.filter((m) => m.type === 'series'), totalPages: 1 };
    }
  }

  /**
   * Obtém séries mais bem avaliadas
   */
  public static async getTopRatedSeries(page: number = 1): Promise<{ results: Movie[]; totalPages: number }> {
    try {
      const data = await TMDbService.fetchFromTmdb<any>('/tv/top_rated', { page: String(page) });
      const results = (data.results || []).map((item: any) => TMDbService.formatTmdbToMovie(item, 'series'));
      return { results, totalPages: data.total_pages || 1 };
    } catch (e) {
      console.warn('Fallback SeriesRepository.getTopRatedSeries:', e);
      return { results: MOVIES_DATABASE.filter((m) => m.type === 'series'), totalPages: 1 };
    }
  }

  /**
   * Filtra séries por categoria/gênero
   */
  public static async getSeriesByGenre(genreId: number, page: number = 1): Promise<{ results: Movie[]; totalPages: number }> {
    try {
      const data = await TMDbService.fetchFromTmdb<any>('/discover/tv', {
        with_genres: String(genreId),
        page: String(page),
      });
      const results = (data.results || []).map((item: any) => TMDbService.formatTmdbToMovie(item, 'series'));
      return { results, totalPages: data.total_pages || 1 };
    } catch (e) {
      console.warn('Fallback SeriesRepository.getSeriesByGenre:', e);
      return { results: MOVIES_DATABASE.filter((m) => m.type === 'series'), totalPages: 1 };
    }
  }

  /**
   * Obtém detalhes completos de uma série (com temporadas, elenco, diretor, trailer, recomendações)
   */
  public static async getSeriesDetails(tmdbId: number | string): Promise<Movie | null> {
    try {
      const data = await TMDbService.fetchFromTmdb<any>(`/tv/${tmdbId}`, {
        append_to_response: 'credits,videos,recommendations',
      });
      return TMDbService.formatTmdbToMovie(data, 'series');
    } catch (e) {
      console.warn(`Fallback SeriesRepository.getSeriesDetails para ID ${tmdbId}:`, e);
      const local = MOVIES_DATABASE.find((m) => String(m.tmdbId) === String(tmdbId) || m.id === String(tmdbId));
      return local || null;
    }
  }

  /**
   * Realiza busca por nome de série
   */
  public static async searchSeries(query: string, page: number = 1): Promise<{ results: Movie[]; totalPages: number }> {
    if (!query.trim()) return { results: [], totalPages: 0 };
    try {
      const data = await TMDbService.fetchFromTmdb<any>('/search/tv', {
        query,
        page: String(page),
      });
      const results = (data.results || []).map((item: any) => TMDbService.formatTmdbToMovie(item, 'series'));
      return { results, totalPages: data.total_pages || 1 };
    } catch (e) {
      console.warn('Fallback SeriesRepository.searchSeries:', e);
      const q = query.toLowerCase();
      const results = MOVIES_DATABASE.filter(
        (m) => m.type === 'series' && (m.title.toLowerCase().includes(q) || m.description.toLowerCase().includes(q))
      );
      return { results, totalPages: 1 };
    }
  }
}

export default SeriesRepository;
