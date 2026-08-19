/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ProviderId = 'autoembed' | 'vidsrcin' | 'vidsrcpm';

export interface EmbedProvider {
  id: ProviderId;
  name: string;
  getMovieUrl: (tmdbId: string | number) => string;
  getSeriesUrl: (tmdbId: string | number, season: number, episode: number) => string;
}

/**
 * EmbedService - Serviço responsável por gerenciar e gerar as URLs de reprodução de múltiplos provedores.
 */
export class EmbedService {
  public static readonly PROVIDERS: EmbedProvider[] = [
    {
      id: 'autoembed',
      name: 'AutoEmbed (Servidor Principal - Sem Anúncios)',
      getMovieUrl: (id) => `https://autoembed.co/movie/tmdb/${id}`,
      getSeriesUrl: (id, s, e) => `https://autoembed.co/tv/tmdb/${id}-${s}-${e}`
    },
    {
      id: 'vidsrcin',
      name: 'VidSrc.in (Servidor Secundário)',
      getMovieUrl: (id) => `https://vidsrc.in/embed/movie?tmdb=${id}`,
      getSeriesUrl: (id, s, e) => `https://vidsrc.in/embed/tv?tmdb=${id}&season=${s}&episode=${e}`
    },
    {
      id: 'vidsrcpm',
      name: 'VidSrc PM (Servidor Alternativo)',
      getMovieUrl: (id) => `https://vidsrc.pm/embed/movie?tmdb=${id}`,
      getSeriesUrl: (id, s, e) => `https://vidsrc.pm/embed/tv?tmdb=${id}&season=${s}&episode=${e}`
    }
  ];

  /**
   * Valida se um TMDb ID é válido e numérico ou string preenchida
   */
  public static isValidTmdbId(tmdbId?: string | number): boolean {
    if (tmdbId === undefined || tmdbId === null || tmdbId === '') return false;
    const str = String(tmdbId).trim();
    return str.length > 0 && !isNaN(Number(str));
  }
}

export default EmbedService;
