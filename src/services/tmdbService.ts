/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Movie, CastMember } from '../types';

// Default TMDb v3 API keys for public metadata queries (with fallback)
const TMDB_API_KEYS = [
  '4e44d9029b1270a757cddc766a1bcb63',
  '15d2244414d420db23d93d0926d9be29',
  'e9e927171e2e05232b15ca97ab8d2341',
];

/**
 * TMDbService - Serviço responsável por consumir a API do TMDb,
 * gerenciar cache local de requisições e formatar metadados de filmes, séries e elenco.
 */
export class TMDbService {
  private static readonly BASE_URL = 'https://api.themoviedb.org/3';
  private static readonly IMAGE_BASE_POSTER = 'https://image.tmdb.org/t/p/w500';
  private static readonly IMAGE_BASE_BACKDROP = 'https://image.tmdb.org/t/p/w1280';
  private static readonly IMAGE_BASE_PROFILE = 'https://image.tmdb.org/t/p/w185';

  // Obter a lista de chaves da API do TMDb a partir do ambiente ou padrão
  private static getApiKeys(): string[] {
    const metaEnv = (import.meta as any).env;
    const envKey = metaEnv?.VITE_TMDB_API_KEY;
    if (envKey) {
      return [envKey, ...TMDB_API_KEYS];
    }
    return TMDB_API_KEYS;
  }

  // Métodos de Cache Local (localStorage com expiração de 1 hora)
  private static getCache<T>(key: string): T | null {
    try {
      const cached = localStorage.getItem(`tmdb_cache_${key}`);
      if (!cached) return null;
      const parsed = JSON.parse(cached);
      // Expira após 1 hora (3600000 ms)
      if (Date.now() - parsed.timestamp > 3600000) {
        localStorage.removeItem(`tmdb_cache_${key}`);
        return null;
      }
      return parsed.data as T;
    } catch {
      return null;
    }
  }

  private static setCache<T>(key: string, data: T): void {
    try {
      localStorage.setItem(
        `tmdb_cache_${key}`,
        JSON.stringify({ timestamp: Date.now(), data })
      );
    } catch (e) {
      // Ignora estouro do localStorage se ocorrer
      console.warn('Falha ao salvar no cache local:', e);
    }
  }

  /**
   * Executa requisições HTTP para a API do TMDb com suporte a cache local e rotação de chaves.
   */
  public static async fetchFromTmdb<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
    const keys = this.getApiKeys();
    const cacheKey = `${endpoint}_${new URLSearchParams(params).toString()}`;

    // Tenta obter do cache local
    const cachedData = this.getCache<T>(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    let lastError: any = null;

    for (const apiKey of keys) {
      const queryParams = new URLSearchParams({
        api_key: apiKey,
        language: 'pt-BR',
        ...params,
      });

      const url = `${this.BASE_URL}${endpoint}?${queryParams.toString()}`;

      try {
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          this.setCache<T>(cacheKey, data);
          return data;
        } else {
          lastError = new Error(`Erro TMDb (${response.status}): ${response.statusText}`);
          if (response.status === 401) {
            // Se for 401 (não autorizado), tenta a próxima chave
            continue;
          } else {
            break;
          }
        }
      } catch (error) {
        lastError = error;
      }
    }

    console.warn(`Aviso ao buscar dados do TMDb [${endpoint}]:`, lastError);
    throw lastError || new Error(`Falha nas requisições TMDb para ${endpoint}`);
  }

  /**
   * Converte o payload retornado pelo TMDb para a interface unificada `Movie`.
   */
  public static formatTmdbToMovie(item: any, overrideType?: 'movie' | 'series'): Movie {
    const isSeries = overrideType === 'series' || item.media_type === 'tv' || !!item.first_air_date;
    const type: 'movie' | 'series' = isSeries ? 'series' : 'movie';

    const title = item.title || item.name || item.original_title || item.original_name || 'Sem Título';
    const releaseDate = item.release_date || item.first_air_date || '';
    const year = releaseDate ? new Date(releaseDate).getFullYear() : new Date().getFullYear();

    const posterPath = item.poster_path
      ? `${this.IMAGE_BASE_POSTER}${item.poster_path}`
      : 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=500&auto=format&fit=crop&q=80';

    const backdropPath = item.backdrop_path
      ? `${this.IMAGE_BASE_BACKDROP}${item.backdrop_path}`
      : posterPath;

    const rating = item.vote_average ? Math.round(item.vote_average * 10) / 10 : 7.5;

    // Duração ou Temporadas
    let duration = '2h 00min';
    if (isSeries) {
      const seasons = item.number_of_seasons || 1;
      duration = `${seasons} Temporada${seasons > 1 ? 's' : ''}`;
    } else if (item.runtime) {
      const hours = Math.floor(item.runtime / 60);
      const mins = item.runtime % 60;
      duration = `${hours}h ${mins}min`;
    }

    // Gêneros
    let genres: string[] = [];
    if (item.genres && Array.isArray(item.genres)) {
      genres = item.genres.map((g: any) => g.name);
    } else if (item.genre_ids && Array.isArray(item.genre_ids)) {
      // Mapeamento simplificado de IDs de gênero comuns
      genres = item.genre_ids.map((id: number) => this.getGenreNameById(id));
    }
    if (genres.length === 0) genres = [isSeries ? 'Série' : 'Filme'];

    // Elenco
    let cast: CastMember[] = [];
    if (item.credits?.cast && Array.isArray(item.credits.cast)) {
      cast = item.credits.cast.slice(0, 10).map((c: any) => ({
        id: String(c.id),
        name: c.name,
        character: c.character || 'Ator',
        imageUrl: c.profile_path
          ? `${this.IMAGE_BASE_PROFILE}${c.profile_path}`
          : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=185&auto=format&fit=crop&q=80',
      }));
    }

    // Diretor
    let director = undefined;
    if (item.credits?.crew && Array.isArray(item.credits.crew)) {
      const dirObj = item.credits.crew.find((c: any) => c.job === 'Director');
      if (dirObj) director = dirObj.name;
    }

    // Trailer oficial
    let videoUrl = undefined;
    if (item.videos?.results && Array.isArray(item.videos.results)) {
      const trailer = item.videos.results.find(
        (v: any) => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser')
      );
      if (trailer) {
        videoUrl = `https://www.youtube.com/embed/${trailer.key}`;
      }
    }

    // Recomendações
    let recommendations: Movie[] = [];
    if (item.recommendations?.results && Array.isArray(item.recommendations.results)) {
      recommendations = item.recommendations.results
        .slice(0, 8)
        .map((rec: any) => this.formatTmdbToMovie(rec, type));
    }

    return {
      id: `tmdb_${type}_${item.id}`,
      tmdbId: item.id,
      type,
      title,
      description: item.overview || 'Sinopse não disponível no momento.',
      imageUrl: posterPath,
      backdropUrl: backdropPath,
      year,
      ageRating: item.adult ? '18+' : '14+',
      duration,
      genres,
      rating,
      isOriginal: item.vote_count > 1000 && item.vote_average > 7.5,
      cast,
      director,
      videoUrl,
      recommendations,
      seasonsCount: item.number_of_seasons || 1,
      episodesPerSeason: item.number_of_episodes
        ? Math.round(item.number_of_episodes / (item.number_of_seasons || 1))
        : 10,
    };
  }

  /**
   * Mapeia ID de gênero do TMDb para o nome em português
   */
  public static getGenreNameById(genreId: number): string {
    const genreMap: Record<number, string> = {
      28: 'Ação',
      12: 'Aventura',
      16: 'Animação',
      35: 'Comédia',
      80: 'Crime',
      99: 'Documentário',
      18: 'Drama',
      10751: 'Família',
      14: 'Fantasia',
      36: 'História',
      27: 'Terror',
      10402: 'Música',
      9648: 'Mistério',
      10749: 'Romance',
      878: 'Ficção Científica',
      10770: 'Cinema TV',
      53: 'Suspense',
      10752: 'Guerra',
      37: 'Faroeste',
      10759: 'Ação e Aventura',
      10762: 'Kids',
      10763: 'News',
      10764: 'Reality',
      10765: 'Sci-Fi e Fantasia',
      10766: 'Soap',
      10767: 'Talk',
      10768: 'Guerra e Política',
    };
    return genreMap[genreId] || 'Geral';
  }
}

export default TMDbService;
