/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ProviderId = 'vidsrcme' | 'vidsrcto' | 'vidsrcpro' | 'embedsu' | 'cdnembed';

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
      id: 'vidsrcme',
      name: 'VidSrc (Servidor 1)',
      getMovieUrl: (id) => `https://vidsrc.me/embed/movie?tmdb=${id}`,
      getSeriesUrl: (id, s, e) => `https://vidsrc.me/embed/tv?tmdb=${id}&season=${s}&episode=${e}`
    },
    {
      id: 'vidsrcto',
      name: 'VidSrc.to (Servidor 2)',
      getMovieUrl: (id) => `https://vidsrc.to/embed/movie/${id}`,
      getSeriesUrl: (id, s, e) => `https://vidsrc.to/embed/tv/${id}/${s}/${e}`
    },
    {
      id: 'vidsrcpro',
      name: 'VidSrc Pro (Servidor 3)',
      getMovieUrl: (id) => `https://vidsrc.pro/embed/movie/${id}`,
      getSeriesUrl: (id, s, e) => `https://vidsrc.pro/embed/tv/${id}/${s}/${e}`
    },
    {
      id: 'embedsu',
      name: 'Embed.su (Servidor 4)',
      getMovieUrl: (id) => `https://embed.su/embed/movie/${id}`,
      getSeriesUrl: (id, s, e) => `https://embed.su/embed/tv/${id}/${s}/${e}`
    },
    {
      id: 'cdnembed',
      name: 'CDN Embed (Servidor 5)',
      getMovieUrl: (id) => `https://cdn-embed.com/filme/${id}`,
      getSeriesUrl: (id, s, e) => `https://cdn-embed.com/serie/${id}/${s}/${e}`
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
